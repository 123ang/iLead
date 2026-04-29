import React, { useState } from "react";
import { CheckCircle2, Edit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";

const followUpTypes = ["EMAIL", "WHATSAPP", "CALL", "MEETING", "BROCHURE_SENT", "APPLICATION_GUIDE_SENT", "OTHER"];
const emptyForm = { followUpType: "EMAIL", followUpDate: "", nextFollowUpDate: "", outcome: "", notes: "" };

function dateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function message(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.message || fallback;
}

export default function FollowUpsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [completeTarget, setCompleteTarget] = useState(null);

  const overdueQuery = useQuery({
    queryKey: ["follow-ups", "overdue"],
    queryFn: async () => (await api.get("/follow-ups/overdue")).data,
  });

  const updateFollowUp = useMutation({
    mutationFn: async (payload) => (await api.patch(`/follow-ups/${editing.id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-ups", "overdue"] });
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const completeFollowUp = useMutation({
    mutationFn: async (item) => (await api.post(`/follow-ups/${item.latestFollowUp.id}/complete`, { outcome: "Completed from overdue queue" })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-ups", "overdue"] });
      setCompleteTarget(null);
    },
  });

  function openEdit(item) {
    const followUp = item.latestFollowUp;
    setEditing(followUp);
    setForm({
      followUpType: followUp.followUpType || "EMAIL",
      followUpDate: dateInput(followUp.followUpDate),
      nextFollowUpDate: dateInput(followUp.nextFollowUpDate),
      outcome: followUp.outcome || "",
      notes: followUp.notes || "",
    });
  }

  function submit(event) {
    event.preventDefault();
    updateFollowUp.mutate({
      followUpType: form.followUpType,
      followUpDate: form.followUpDate || undefined,
      nextFollowUpDate: form.nextFollowUpDate || null,
      outcome: form.outcome || null,
      notes: form.notes || null,
    });
  }

  const rows = overdueQuery.data || [];
  const columns = [
    {
      key: "lead",
      header: "Lead",
      render: (item) => (
        <div>
          <Link className="font-semibold text-uum-blue hover:underline" to={`/leads/${item.lead.id}`}>{item.lead.fullName}</Link>
          <div className="mt-1 text-xs text-slate-500">{item.lead.email || item.lead.phone || "No direct identifier"}</div>
        </div>
      ),
    },
    { key: "reason", header: "Reason", render: (item) => <span className="text-sm text-slate-700">{item.reason}</span> },
    { key: "deadline", header: "Deadline", render: (item) => <span className="text-sm text-slate-600">{item.deadline ? new Date(item.deadline).toLocaleString() : "n/a"}</span> },
    { key: "assigned", header: "Assigned", render: (item) => <span className="text-sm text-slate-600">{item.lead.assignedStaff?.name || "Unassigned"}</span> },
    {
      key: "actions",
      header: "Actions",
      cellClassName: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button disabled={!item.latestFollowUp} onClick={() => openEdit(item)} title="Edit latest follow-up" variant="secondary"><Edit2 className="h-4 w-4" /></Button>
          <Button disabled={!item.latestFollowUp} onClick={() => setCompleteTarget(item)} title="Complete latest follow-up" variant="secondary"><CheckCircle2 className="h-4 w-4 text-green-700" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Operations" title="Overdue Follow-ups" description="Review overdue leads and update or complete the latest follow-up record." />
      <DataTable columns={columns} emptyDescription="No leads are currently overdue under the configured SLA settings." emptyTitle="No overdue follow-ups" error={overdueQuery.error} isLoading={overdueQuery.isLoading} rows={rows} />

      <SlideOver onClose={() => setEditing(null)} open={Boolean(editing)} title="Edit Follow-up">
        <form className="grid gap-4" onSubmit={submit}>
          <label className="field-label"><span>Type</span><select className="field-control" value={form.followUpType} onChange={(event) => setForm((current) => ({ ...current, followUpType: event.target.value }))}>{followUpTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label"><span>Follow-up date</span><input className="field-control" type="datetime-local" value={form.followUpDate} onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))} /></label>
            <label className="field-label"><span>Next follow-up</span><input className="field-control" type="datetime-local" value={form.nextFollowUpDate} onChange={(event) => setForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} /></label>
          </div>
          <label className="field-label"><span>Outcome</span><input className="field-control" value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} /></label>
          <label className="field-label"><span>Notes</span><textarea className="field-control" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          {updateFollowUp.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message(updateFollowUp.error, "Follow-up could not be updated.")}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={updateFollowUp.isPending} onClick={() => setEditing(null)} variant="secondary">Cancel</Button>
            <Button disabled={updateFollowUp.isPending} type="submit">Save Changes</Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog busy={completeFollowUp.isPending} confirmLabel="Complete" description={completeTarget ? `Complete the latest follow-up for "${completeTarget.lead.fullName}" and clear its next follow-up date?` : ""} onCancel={() => setCompleteTarget(null)} onConfirm={() => completeFollowUp.mutate(completeTarget)} open={Boolean(completeTarget)} title="Complete Follow-up" />
    </div>
  );
}
