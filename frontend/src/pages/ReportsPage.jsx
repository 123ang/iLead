import React, { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { api } from "../services/api.js";

const REPORTS = [
  { key: "country-performance", label: "Country Performance" },
  { key: "faculty-performance", label: "Faculty Performance" },
  { key: "programme-conversion", label: "Programme Conversion" },
  { key: "follow-up-sla", label: "Follow-up SLA" },
  { key: "duplicates", label: "Duplicate Leads" },
  { key: "scholarship-revenue", label: "Scholarship Revenue" },
];

function title(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatCell(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (String(value).match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

function reportRows(data) {
  if (Array.isArray(data)) return data;
  return data?.rows || data?.items || [];
}

function Summary({ data }) {
  const summary = data?.summary;
  if (!summary || Array.isArray(data)) return null;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {Object.entries(summary)
        .filter(([, value]) => typeof value !== "object")
        .map(([key, value]) => (
          <div key={key} className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase text-slate-500">{title(key)}</div>
            <div className="mt-1 text-lg font-semibold text-slate-800">
              {formatCell(value)}
            </div>
          </div>
        ))}
    </div>
  );
}

export default function ReportsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportKey = REPORTS.some((report) => report.key === searchParams.get("report"))
    ? searchParams.get("report")
    : REPORTS[0].key;
  const filters = {
    q: searchParams.get("q") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
  };

  function setRouteState(next) {
    const merged = { report: reportKey, ...filters, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", reportKey, filters],
    queryFn: async () =>
      (
        await api.get(`/reports/${reportKey}`, {
          params: filters,
        })
      ).data,
  });

  const refresh = useMutation({
    mutationFn: async () => (await api.post("/reports/campaign-metrics/refresh", {})).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report"] }),
  });

  const rows = useMemo(() => {
    return reportRows(data);
  }, [data]);

  const headers = useMemo(() => {
    const allHeaders = [
      ...rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    ];
    const filteredHeaders =
      reportKey === "country-performance"
        ? allHeaders.filter((header) => header !== "id")
        : allHeaders;
    return filteredHeaders.slice(0, 12);
  }, [rows, reportKey]);

  async function exportCsv() {
    const response = await api.get(`/reports/${reportKey}/export.csv`, {
      params: filters,
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ilead-${reportKey}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Management Reporting"
        title="Reports"
        description="Run operational reports, export CSV files, and refresh campaign metric snapshots."
      />
      <Toolbar>
        <div className="grid w-full gap-3 lg:grid-cols-[1fr,1fr,1fr,1fr,auto,auto]">
          <select
            className="field-control"
            value={reportKey}
            onChange={(event) => setRouteState({ report: event.target.value })}
          >
            {REPORTS.map((report) => (
              <option key={report.key} value={report.key}>
                {report.label}
              </option>
            ))}
          </select>
          <input
            className="field-control"
            placeholder="Search table"
            value={filters.q}
            onChange={(event) => setRouteState({ q: event.target.value })}
          />
          <input
            className="field-control"
            type="date"
            value={filters.from}
            onChange={(event) => setRouteState({ from: event.target.value })}
          />
          <input
            className="field-control"
            type="date"
            value={filters.to}
            onChange={(event) => setRouteState({ to: event.target.value })}
          />
          <Button
            onClick={() => refresh.mutate()}
            type="button"
            variant="secondary"
          >
            <RefreshCw size={16} /> Refresh Metrics
          </Button>
          <Button
            onClick={exportCsv}
            type="button"
          >
            <Download size={16} /> CSV
          </Button>
        </div>
      </Toolbar>

      <Summary data={data} />

      <Card title={`${REPORTS.find((item) => item.key === reportKey)?.label} Table`}>
        {isLoading ? <p className="text-sm text-slate-500">Loading report...</p> : null}
        {error ? <p className="text-sm text-red-600">Report could not be loaded.</p> : null}
        {!isLoading && !rows.length ? (
          <p className="text-sm text-slate-500">No rows match the current filters.</p>
        ) : null}
        {rows.length ? (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  {headers.map((header) => (
                    <th key={header} className="whitespace-nowrap py-2 pr-4">
                      {title(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id || row.leadId || row.enrolmentId || index} className="border-b">
                    {headers.map((header) => (
                      <td key={header} className="max-w-72 truncate py-2 pr-4">
                        {formatCell(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
