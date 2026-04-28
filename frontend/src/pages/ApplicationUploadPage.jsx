import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

export default function ApplicationUploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const upload = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("file", file);
      return (
        await api.post("/applications/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: (data) => setResult(data),
  });

  const rematch = useMutation({
    mutationFn: async () =>
      (await api.post("/applications/match-leads", { batchId: result.batchId })).data,
    onSuccess: (data) => setResult((current) => ({ ...current, rematch: data })),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
      <Card title="Upload Applications CSV">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (file) upload.mutate();
          }}
        >
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <p className="text-sm text-slate-500">
            Expected headers: `applicantName,email,phone,passportNumber,country,programmeCode,studyLevel,applicationStatus,applicationDate,offerDate,enrolmentDate,sourceCampaign,scholarshipMyr,tuitionRevenueMyr`
          </p>
          <button className="rounded bg-uum-blue px-4 py-2 text-white" type="submit">
            Upload
          </button>
        </form>
      </Card>

      <Card title="Validation Report">
        {!result ? (
          <p className="text-sm text-slate-500">No upload yet.</p>
        ) : (
          <div className="grid gap-3 text-sm">
            <p>
              Batch {result.batchId} · {result.successRows} success · {result.failedRows} failed
            </p>
            <button
              className="w-fit rounded border px-3 py-1"
              onClick={() => rematch.mutate()}
            >
              Rematch Unmatched Rows
            </button>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Row</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows?.map((row) => (
                    <tr key={row.rowNumber} className="border-b align-top">
                      <td className="py-2">{row.rowNumber}</td>
                      <td className="py-2">{row.status}</td>
                      <td className="py-2">
                        {row.errors?.length ? row.errors.join(", ") : row.result?.reason || "Created"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

