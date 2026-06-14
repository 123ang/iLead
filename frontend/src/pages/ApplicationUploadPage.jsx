import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { StatusPill } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";

function normalizeHeader(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map((v) => v.trim());
}

const EXPECTED_FIELDS = [
  { key: "applicantName", label: "Applicant name", synonyms: ["applicantname", "name", "full name"] },
  { key: "email", label: "Email", synonyms: ["email", "mail"] },
  { key: "phone", label: "Phone", synonyms: ["phone", "mobile", "msisdn"] },
  { key: "passportNumber", label: "Passport number", synonyms: ["passport", "passportnumber"] },
  { key: "country", label: "Country", synonyms: ["country", "countryname"] },
  { key: "programmeCode", label: "Programme code", synonyms: ["programmecode", "programcode", "program code", "programme"] },
  { key: "studyLevel", label: "Study level", synonyms: ["studylevel", "level"] },
  { key: "applicationStatus", label: "Application status", synonyms: ["applicationstatus", "status"] },
  { key: "applicationDate", label: "Application date", synonyms: ["applicationdate", "appdate"] },
  { key: "offerDate", label: "Offer date", synonyms: ["offerdate"] },
  { key: "enrolmentDate", label: "Enrolment date", synonyms: ["enrolmentdate", "enrollmentdate"] },
  { key: "sourceCampaign", label: "Source campaign", synonyms: ["sourcecampaign", "campaign"] },
  { key: "scholarshipMyr", label: "Scholarship MYR", synonyms: ["scholarshipmyr", "scholarship"] },
  { key: "tuitionRevenueMyr", label: "Tuition revenue MYR", synonyms: ["tuitionrevenue", "tuitionrevenueMyr", "tuitionrevenuemyr", "tuitionrevenue myr"] },
];

export default function ApplicationUploadPage() {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});

  const [result, setResult] = useState(null);
  const [conflictChoiceByAppId, setConflictChoiceByAppId] = useState({});

  const mappingSummary = useMemo(() => {
    const m = {};
    for (const f of EXPECTED_FIELDS) {
      if (columnMapping[f.key]) m[f.key] = columnMapping[f.key];
    }
    return m;
  }, [columnMapping]);

  function guessMapping(detectedHeaders) {
    const mapped = {};
    const headerNorm = detectedHeaders.reduce((acc, h) => {
      acc[h] = normalizeHeader(h);
      return acc;
    }, {});

    for (const field of EXPECTED_FIELDS) {
      const target = field.synonyms.map(normalizeHeader);
      const pick = detectedHeaders.find((h) => {
        const hn = headerNorm[h];
        return target.some((t) => hn === t || hn.includes(t) || t.includes(hn));
      });
      if (pick) mapped[field.key] = pick;
    }
    return mapped;
  }

  async function hydrateHeaders(chosenFile) {
    if (!chosenFile) return;
    const name = String(chosenFile.name || "").toLowerCase();
    if (!name.endsWith(".csv")) {
      throw new Error("Only CSV uploads are supported.");
    }

    // CSV header parsing
    const text = await chosenFile.text();
    const firstLine = String(text || "").split(/\r?\n/)[0] || "";
    const hdrs = splitCsvLine(firstLine).filter((h) => h.length > 0);
    setHeaders(hdrs);
    setColumnMapping(guessMapping(hdrs));
  }

  const upload = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("columnMapping", JSON.stringify(mappingSummary));
      return (await api.post("/applications/upload", form, { headers: { "Content-Type": "multipart/form-data" } })).data;
    },
    onSuccess: (data) => {
      setResult(data);
      setConflictChoiceByAppId({});
      toast.success("Upload complete.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Upload failed."),
  });

  const rematch = useMutation({
    mutationFn: async () => (await api.post("/applications/match-leads", { batchId: result.batchId })).data,
    onSuccess: (data) => setResult((current) => ({ ...current, rematch: data })),
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Rematch failed."),
  });

  const resolveConflict = useMutation({
    mutationFn: async ({ batchId, applicationId, chosenLeadId }) =>
      (await api.post(`/applications/upload/${batchId}/conflicts/resolve`, { applicationId, chosenLeadId })).data,
    onSuccess: (_, vars) => {
      const { applicationId, chosenLeadId } = vars;
      setResult((current) => {
        if (!current?.rows) return current;
        return {
          ...current,
          rows: current.rows.map((row) => {
            if (row.applicationId !== applicationId) return row;
            const chosen =
              row?.result?.matches?.find((m) => String(m?.lead?.id) === String(chosenLeadId))?.lead ??
              { id: chosenLeadId };
            return {
              ...row,
              status: "MATCHED",
              leadId: chosenLeadId,
              errors: [],
              result: { status: "matched", reason: "MANUAL_REVIEW", lead: chosen },
            };
          }),
        };
      });
      toast.success("Conflict resolved.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Resolve failed."),
  });

  const rollback = useMutation({
    mutationFn: async () => (await api.post(`/applications/upload/${result.batchId}/rollback`)).data,
    onSuccess: () => {
      toast.success("Upload batch rolled back.");
      setResult(null);
      setHeaders([]);
      setColumnMapping({});
      setFile(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Rollback failed."),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Application Operations"
        title="Application Upload"
        description="Upload application CSV files, review row-level validation + matching outcomes, and resolve conflicts manually."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <Card title="Upload CSV">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!file) return;
              upload.mutate();
            }}
          >
            <input
              className="field-control"
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                const f = event.target.files?.[0] || null;
                setFile(f);
                setResult(null);
                setHeaders([]);
                setColumnMapping({});
                if (f) {
                  try {
                    await hydrateHeaders(f);
                    toast.success("Headers detected.");
                  } catch (e) {
                    toast.error(e?.message || "Header detection failed.");
                  }
                }
              }}
            />

            <div className="text-sm text-slate-500">
              Expected fields are mapped by the table below (you can edit mapping before uploading).
            </div>

            {headers?.length ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Column mapping
                </p>
                <div className="grid gap-2">
                  {EXPECTED_FIELDS.map((f) => (
                    <label key={f.key} className="grid gap-1 text-xs font-medium text-slate-600">
                      <span className="text-slate-700">{f.label}</span>
                      <select
                        className="field-control py-2 px-3"
                        value={columnMapping[f.key] || ""}
                        onChange={(e) => setColumnMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                      >
                        <option value="">(skip)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select a file to detect headers.</div>
            )}

            <Button disabled={!file || upload.isPending} type="submit">
              Upload
            </Button>
          </form>
        </Card>

        <Card title="Validation + Matching Report">
          {!result ? (
            <p className="text-sm text-slate-500">No upload yet.</p>
          ) : (
            <div className="grid gap-3 text-sm">
              <p>
                Batch {result.batchId} · {result.successRows} success · {result.failedRows} failed
              </p>

              <div className="flex flex-wrap gap-2">
                <Button className="w-fit" onClick={() => rematch.mutate()} variant="secondary" disabled={rematch.isPending}>
                  Rematch Unmatched
                </Button>
                <Button
                  className="w-fit"
                  onClick={() => {
                    if (confirm("Rollback this upload batch? This deletes applications created by the batch.")) rollback.mutate();
                  }}
                  variant="secondary"
                  disabled={rollback.isPending}
                >
                  Rollback Batch
                </Button>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2">Row</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Result / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows?.map((row) => {
                      if (row.status === "CONFLICT") {
                        const matches = row?.result?.matches || [];
                        const appId = row.applicationId;
                        const selected = conflictChoiceByAppId[appId] || "";
                        return (
                          <tr key={row.rowNumber} className="border-b align-top">
                            <td className="py-2">{row.rowNumber}</td>
                            <td className="py-2">
                              <StatusPill value={row.status} />
                            </td>
                            <td className="py-2">
                              <div className="grid gap-2">
                                <div className="text-xs text-slate-500">
                                  {matches.length} possible match(es)
                                </div>
                                <select
                                  className="field-control py-2 px-3"
                                  value={selected}
                                  onChange={(e) =>
                                    setConflictChoiceByAppId((m) => ({ ...m, [appId]: e.target.value }))
                                  }
                                >
                                  <option value="">Select lead</option>
                                  {matches.map((m, idx) => (
                                    <option key={`${m?.lead?.id || idx}`} value={m?.lead?.id}>
                                      {m?.lead?.fullName || m?.lead?.email || m?.lead?.id}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={!selected || resolveConflict.isPending}
                                  onClick={() =>
                                    resolveConflict.mutate({
                                      batchId: result.batchId,
                                      applicationId: appId,
                                      chosenLeadId: selected,
                                    })
                                  }
                                  className="w-fit"
                                >
                                  Resolve
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.rowNumber} className="border-b align-top">
                          <td className="py-2">{row.rowNumber}</td>
                          <td className="py-2">
                            <StatusPill value={row.status} />
                          </td>
                          <td className="py-2">
                            {row.errors?.length ? row.errors.join(", ") : row.result?.reason || "Created"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
