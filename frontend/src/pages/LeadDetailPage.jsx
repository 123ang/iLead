import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

export default function LeadDetailPage() {
  const { id } = useParams();
  const { data: lead } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => (await api.get(`/leads/${id}`)).data,
  });

  if (!lead) return <p>Loading...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
      <Card title={lead.fullName}>
        <div className="grid gap-2 text-sm">
          <p>Status: {lead.status}</p>
          <p>Quality: {lead.leadQuality}</p>
          <p>Programme: {lead.interestedProgramme?.name || "n/a"}</p>
          <p>Country: {lead.country?.name || "n/a"}</p>
          <p>Assigned: {lead.assignedStaff?.name || "Unassigned"}</p>
        </div>
      </Card>
      <Card title="Status History">
        <ul className="grid gap-2 text-sm">
          {lead.statusHistory.map((entry) => (
            <li key={entry.id} className="rounded border border-slate-200 p-2">
              {entry.fromStatus || "NEW"} → {entry.toStatus}
              <div className="text-xs text-slate-500">
                {entry.changedBy?.name || "System"} at {new Date(entry.changedAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Campaign Touches">
        <ul className="grid gap-2 text-sm">
          {lead.touches.map((touch) => (
            <li key={touch.id} className="rounded border border-slate-200 p-2">
              {touch.campaign.name}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Applications">
        <ul className="grid gap-2 text-sm">
          {lead.applications.map((application) => (
            <li key={application.id} className="rounded border border-slate-200 p-2">
              {application.programme?.name || application.applicantName} · {application.applicationStatus}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

