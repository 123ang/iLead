import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { StatusPill } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";

export default function DuplicatesPage() {
  const qc = useQueryClient();
  const { data: report } = useQuery({
    queryKey: ["duplicate-report"],
    queryFn: async () => (await api.get("/leads/duplicates/report")).data,
  });
  const { data: duplicates = [] } = useQuery({
    queryKey: ["duplicates"],
    queryFn: async () => (await api.get("/leads/duplicates")).data,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action }) =>
      (await api.post(`/leads/duplicates/${id}/${action}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duplicates"] });
      qc.invalidateQueries({ queryKey: ["duplicate-report"] });
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Data Quality"
        title="Duplicate Leads"
        description="Review suspected duplicate student identities and resolve the merge queue."
      />
      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
      <Card title="Duplicate Report">
        <div className="grid gap-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Pending</div>
              <div className="mt-1 text-2xl font-semibold">{report?.summary?.pending ?? 0}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Merged</div>
              <div className="mt-1 text-2xl font-semibold">{report?.summary?.merged ?? 0}</div>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Reasons</div>
            <div className="mt-2 grid gap-2">
              {Object.entries(report?.summary?.byReason || {}).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span>{reason}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Duplicate Lead Queue">
        <div className="grid gap-3">
          {duplicates.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <p className="font-medium">
                {item.leadA?.fullName} ↔ {item.leadB?.fullName}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
                <span>{item.reason} · confidence {Number(item.confidence).toFixed(2)}</span>
                <StatusPill value={item.status} />
              </p>
              {item.status === "PENDING" ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    className="py-1"
                    onClick={() => mutation.mutate({ id: item.id, action: "merge" })}
                  >
                    Merge
                  </Button>
                  <Button
                    className="py-1"
                    onClick={() => mutation.mutate({ id: item.id, action: "reject" })}
                    variant="secondary"
                  >
                    Reject
                  </Button>
                  <Button
                    className="py-1"
                    onClick={() => mutation.mutate({ id: item.id, action: "ignore" })}
                    variant="secondary"
                  >
                    Ignore
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
      </div>
    </div>
  );
}
