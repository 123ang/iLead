import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { StatusPill } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";

const followUpTypes = ["EMAIL", "WHATSAPP", "CALL", "MEETING", "BROCHURE_SENT", "APPLICATION_GUIDE_SENT", "OTHER"];

const emptyFollowUp = {
  followUpType: "EMAIL",
  followUpDate: "",
  nextFollowUpDate: "",
  outcome: "",
  notes: "",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "n/a";
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState(emptyFollowUp);

  const { data: lead } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => (await api.get(`/leads/${id}`)).data,
  });

  const createFollowUp = useMutation({
    mutationFn: async (payload) => (await api.post("/follow-ups", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      setFollowUpForm(emptyFollowUp);
      setDrawerOpen(false);
    },
  });

  if (!lead) return <p className="text-sm text-slate-500">Loading lead...</p>;

  function submitFollowUp(event) {
    event.preventDefault();
    createFollowUp.mutate({
      leadId: id,
      followUpType: followUpForm.followUpType,
      followUpDate: followUpForm.followUpDate || undefined,
      nextFollowUpDate: followUpForm.nextFollowUpDate || null,
      outcome: followUpForm.outcome || null,
      notes: followUpForm.notes || null,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lead Detail"
        title={lead.fullName}
        description="Student profile, campaign touches, follow-up activity, application progression, and status history."
        actions={
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Follow-up
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card title="Profile">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
              <div className="mt-1"><StatusPill value={lead.status} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Quality</div>
              <div className="mt-1"><StatusPill value={lead.leadQuality} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Programme</div>
              <div className="mt-1 font-semibold text-uum-navy">{lead.interestedProgramme?.name || "n/a"}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Country</div>
              <div className="mt-1 font-semibold text-uum-navy">{lead.country?.name || "n/a"}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Assigned</div>
              <div className="mt-1 font-semibold text-uum-navy">{lead.assignedStaff?.name || "Unassigned"}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Identifier</div>
              <div className="mt-1 font-semibold text-uum-navy">{lead.email || lead.phone || lead.passportNumber || lead.externalLeadId || "n/a"}</div>
            </div>
          </div>
        </Card>

        <Card title="Follow-ups">
          <ul className="grid gap-2 text-sm">
            {lead.followUps?.length ? (
              lead.followUps.map((entry) => (
                <li key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold text-uum-navy">{entry.followUpType.replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">{formatDate(entry.followUpDate)}</div>
                  {entry.outcome ? <p className="mt-2 text-slate-700">{entry.outcome}</p> : null}
                  {entry.nextFollowUpDate ? <p className="mt-1 text-xs text-slate-500">Next: {formatDate(entry.nextFollowUpDate)}</p> : null}
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">No follow-ups recorded.</li>
            )}
          </ul>
        </Card>

        <Card title="Campaign Touches">
          <ul className="grid gap-2 text-sm">
            {lead.touches?.length ? (
              lead.touches.map((touch) => (
                <li key={touch.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold text-uum-navy">{touch.campaign.name}</div>
                  <div className="text-xs text-slate-500">{touch.source?.replaceAll("_", " ")}</div>
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">No campaign touches recorded.</li>
            )}
          </ul>
        </Card>

        <Card title="Applications">
          <ul className="grid gap-2 text-sm">
            {lead.applications?.length ? (
              lead.applications.map((application) => (
                <li key={application.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold text-uum-navy">{application.programme?.name || application.applicantName}</div>
                  <div className="mt-1"><StatusPill value={application.applicationStatus} /></div>
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">No applications linked.</li>
            )}
          </ul>
        </Card>

        <Card className="xl:col-span-2" title="Status History">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {lead.statusHistory.map((entry) => (
              <li key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="font-semibold text-uum-navy">
                  {entry.fromStatus || "NEW"} to {entry.toStatus}
                </div>
                <div className="text-xs text-slate-500">
                  {entry.changedBy?.name || "System"} at {formatDate(entry.changedAt)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <SlideOver onClose={() => setDrawerOpen(false)} open={drawerOpen} title="Add Follow-up">
        <form className="grid gap-4" onSubmit={submitFollowUp}>
          <label className="field-label">
            <span>Type</span>
            <select className="field-control" value={followUpForm.followUpType} onChange={(event) => setFollowUpForm((current) => ({ ...current, followUpType: event.target.value }))}>
              {followUpTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Follow-up date</span>
              <input className="field-control" type="datetime-local" value={followUpForm.followUpDate} onChange={(event) => setFollowUpForm((current) => ({ ...current, followUpDate: event.target.value }))} />
            </label>
            <label className="field-label">
              <span>Next follow-up</span>
              <input className="field-control" type="datetime-local" value={followUpForm.nextFollowUpDate} onChange={(event) => setFollowUpForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} />
            </label>
          </div>
          <label className="field-label">
            <span>Outcome</span>
            <input className="field-control" value={followUpForm.outcome} onChange={(event) => setFollowUpForm((current) => ({ ...current, outcome: event.target.value }))} />
          </label>
          <label className="field-label">
            <span>Notes</span>
            <textarea className="field-control" rows={4} value={followUpForm.notes} onChange={(event) => setFollowUpForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          {createFollowUp.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createFollowUp.error.response?.data?.message || "Follow-up could not be saved."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={createFollowUp.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={createFollowUp.isPending} type="submit">
              Save Follow-up
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
