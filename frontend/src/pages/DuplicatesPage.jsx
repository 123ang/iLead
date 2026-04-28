import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

export default function DuplicatesPage() {
  const qc = useQueryClient();
  const { data: duplicates = [] } = useQuery({
    queryKey: ["duplicates"],
    queryFn: async () => (await api.get("/leads/duplicates")).data,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action }) =>
      (await api.post(`/leads/duplicates/${id}/${action}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplicates"] }),
  });

  return (
    <Card title="Duplicate Lead Queue">
      <div className="grid gap-3">
        {duplicates.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 p-4 text-sm">
            <p className="font-medium">
              {item.leadA?.fullName} ↔ {item.leadB?.fullName}
            </p>
            <p className="text-slate-500">
              {item.reason} · confidence {Number(item.confidence).toFixed(2)} · {item.status}
            </p>
            {item.status === "PENDING" ? (
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded bg-uum-blue px-3 py-1 text-white"
                  onClick={() => mutation.mutate({ id: item.id, action: "merge" })}
                >
                  Merge
                </button>
                <button
                  className="rounded border px-3 py-1"
                  onClick={() => mutation.mutate({ id: item.id, action: "reject" })}
                >
                  Reject
                </button>
                <button
                  className="rounded border px-3 py-1"
                  onClick={() => mutation.mutate({ id: item.id, action: "ignore" })}
                >
                  Ignore
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

