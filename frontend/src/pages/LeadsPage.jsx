import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, StatusPill } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";
import { useAuthStore } from "../store/auth.store.js";

const leadStatuses = ["NEW", "CONTACTED", "INTERESTED", "APPLIED", "OFFERED", "ENROLLED", "LOST", "DUPLICATE"];
const studyLevels = ["FOUNDATION", "BACHELOR", "MASTER", "PHD", "EXECUTIVE", "MOBILITY", "OTHER"];
const leadSources = ["MANUAL_ENTRY", "EVENT_FORM", "CSV_UPLOAD", "QR_CODE", "WEBSITE", "AGENT_REFERRAL", "OTHER"];
const leadQualities = ["HOT", "WARM", "COLD"];

const emptyLead = {
  fullName: "",
  email: "",
  phone: "",
  passportNumber: "",
  externalLeadId: "",
  countryId: "",
  interestedProgrammeId: "",
  studyLevel: "BACHELOR",
  leadQuality: "WARM",
  status: "NEW",
  source: "MANUAL_ENTRY",
  campaignId: "",
  assignedStaffId: "",
  notes: "",
};

function humanize(value) {
  return String(value || "").replaceAll("_", " ");
}

function cleanLeadPayload(form) {
  const payload = { ...form };
  for (const key of ["email", "phone", "passportNumber", "externalLeadId", "countryId", "interestedProgrammeId", "campaignId", "assignedStaffId", "notes"]) {
    if (payload[key] === "") payload[key] = null;
  }
  return payload;
}

function hasIdentifier(form) {
  return Boolean(form.email || form.phone || form.passportNumber || form.externalLeadId);
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const role = useAuthStore((state) => state.user?.role ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [form, setForm] = useState(emptyLead);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const mayAssign = ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN", "FACULTY_DEAN", "PROGRAMME_COORDINATOR"].includes(role);

  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/leads")).data,
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/master/countries")).data,
  });
  const { data: programmes = [] } = useQuery({
    queryKey: ["programmes"],
    queryFn: async () => (await api.get("/master/programmes")).data,
  });
  const { data: campaigns = { items: [] } } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await api.get("/campaigns")).data,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
    enabled: mayAssign,
  });

  const saveLead = useMutation({
    mutationFn: async (payload) =>
      editingId
        ? (await api.patch(`/leads/${editingId}`, payload)).data
        : (await api.post("/leads", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setDrawerOpen(false);
      setEditingId(null);
      setForm(emptyLead);
    },
  });

  const assignLead = useMutation({
    mutationFn: async ({ leadId, assignedStaffId }) =>
      (await api.patch(`/leads/${leadId}/assign`, { assignedStaffId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ leadId, status }) =>
      (await api.patch(`/leads/${leadId}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteLead = useMutation({
    mutationFn: async (leadId) => (await api.delete(`/leads/${leadId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setDeleteTarget(null);
    },
  });

  const staffUsers = useMemo(() => users.filter((user) => user.role === "STAFF"), [users]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (leadsQuery.data?.items || []).filter((lead) => {
      const matchesSearch =
        !search ||
        [lead.fullName, lead.email, lead.phone, lead.passportNumber, lead.externalLeadId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesQuality = !qualityFilter || lead.leadQuality === qualityFilter;
      return matchesSearch && matchesStatus && matchesQuality;
    });
  }, [leadsQuery.data?.items, query, qualityFilter, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyLead);
    setDrawerOpen(true);
  }

  function openEdit(lead) {
    setEditingId(lead.id);
    setForm({
      fullName: lead.fullName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      passportNumber: lead.passportNumber || "",
      externalLeadId: lead.externalLeadId || "",
      countryId: lead.countryId || "",
      interestedProgrammeId: lead.interestedProgrammeId || "",
      studyLevel: lead.studyLevel || "BACHELOR",
      leadQuality: lead.leadQuality || "WARM",
      status: lead.status || "NEW",
      source: lead.source || "MANUAL_ENTRY",
      campaignId: lead.touches?.[0]?.campaignId || "",
      assignedStaffId: lead.assignedStaffId || "",
      notes: lead.notes || "",
    });
    setDrawerOpen(true);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!hasIdentifier(form)) return;
    saveLead.mutate(cleanLeadPayload(form));
  }

  const columns = [
    {
      key: "lead",
      header: "Lead",
      render: (lead) => (
        <div>
          <Link className="font-semibold text-uum-blue hover:underline" to={`/leads/${lead.id}`}>
            {lead.fullName}
          </Link>
          <div className="mt-1 text-xs text-slate-500">{lead.email || lead.phone || lead.passportNumber || lead.externalLeadId}</div>
        </div>
      ),
    },
    {
      key: "profile",
      header: "Profile",
      render: (lead) => (
        <div className="grid gap-1">
          <div className="flex flex-wrap gap-1">
            <StatusPill value={lead.leadQuality} />
            <StatusPill value={lead.status} />
          </div>
          <div className="text-xs text-slate-500">{humanize(lead.studyLevel || "n/a")}</div>
        </div>
      ),
    },
    {
      key: "programme",
      header: "Programme / Country",
      render: (lead) => (
        <div>
          <div className="font-medium text-slate-800">{lead.interestedProgramme?.name || "Programme not set"}</div>
          <div className="text-xs text-slate-500">{lead.country?.name || "Country not set"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => (
        <select
          className="field-control py-1.5 text-xs"
          value={lead.status}
          onChange={(event) => updateStatus.mutate({ leadId: lead.id, status: event.target.value })}
        >
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {humanize(status)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "assign",
      header: "Assignment",
      render: (lead) =>
        mayAssign ? (
          <select
            className="field-control py-1.5 text-xs"
            value={lead.assignedStaffId || ""}
            onChange={(event) =>
              assignLead.mutate({
                leadId: lead.id,
                assignedStaffId: event.target.value,
              })
            }
          >
            <option value="" disabled>
              Unassigned
            </option>
            {staffUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-slate-600">{lead.assignedStaff?.name || "Unassigned"}</span>
        ),
    },
    {
      key: "actions",
      header: "",
      cellClassName: "text-right",
      render: (lead) => (
        <div className="flex justify-end gap-2">
          <Button className="px-2.5" onClick={() => openEdit(lead)} variant="secondary">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button className="px-2.5" onClick={() => setDeleteTarget(lead)} variant="secondary">
            <Trash2 className="h-4 w-4 text-red-700" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lead Management"
        title="Leads"
        description="Manage recruitment enquiries, owner assignment, status progression, and source campaign touchpoints."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        }
      />

      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="field-control pl-9"
              placeholder="Search by name, email, phone, passport, or external ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
        <label className="field-label lg:w-56">
          <span>Status</span>
          <select className="field-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label lg:w-48">
          <span>Quality</span>
          <select className="field-control" value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)}>
            <option value="">All quality</option>
            {leadQualities.map((quality) => (
              <option key={quality} value={quality}>
                {humanize(quality)}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>

      <DataTable
        columns={columns}
        emptyDescription="Create a lead manually or upload application records to begin matching."
        emptyTitle="No leads match the current view"
        error={leadsQuery.error}
        isLoading={leadsQuery.isLoading}
        rows={rows}
      />

      <SlideOver
        description="A lead requires at least one identifier: email, phone, passport number, or external lead ID."
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        title={editingId ? "Edit Lead" : "Create Lead"}
      >
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="field-label">
            <span>Full name</span>
            <input
              className="field-control"
              required
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["email", "Email", "email"],
              ["phone", "Phone", "text"],
              ["passportNumber", "Passport number", "text"],
              ["externalLeadId", "External lead ID", "text"],
            ].map(([key, label, type]) => (
              <label className="field-label" key={key}>
                <span>{label}</span>
                <input
                  className="field-control"
                  type={type}
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          {!hasIdentifier(form) ? (
            <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              Add at least one identifier before saving.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Country</span>
              <select className="field-control" value={form.countryId} onChange={(event) => setForm((current) => ({ ...current, countryId: event.target.value }))}>
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Programme</span>
              <select
                className="field-control"
                value={form.interestedProgrammeId}
                onChange={(event) => setForm((current) => ({ ...current, interestedProgrammeId: event.target.value }))}
              >
                <option value="">Select programme</option>
                {programmes.map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            <span>Source campaign</span>
            <select className="field-control" value={form.campaignId} onChange={(event) => setForm((current) => ({ ...current, campaignId: event.target.value }))}>
              <option value="">No campaign touch</option>
              {campaigns.items.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          {mayAssign ? (
            <label className="field-label">
              <span>Assigned staff</span>
              <select className="field-control" value={form.assignedStaffId} onChange={(event) => setForm((current) => ({ ...current, assignedStaffId: event.target.value }))}>
                <option value="">Unassigned</option>
                {staffUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Status</span>
              <select className="field-control" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {leadStatuses.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Quality</span>
              <select className="field-control" value={form.leadQuality} onChange={(event) => setForm((current) => ({ ...current, leadQuality: event.target.value }))}>
                {leadQualities.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Study level</span>
              <select className="field-control" value={form.studyLevel} onChange={(event) => setForm((current) => ({ ...current, studyLevel: event.target.value }))}>
                {studyLevels.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Source</span>
              <select className="field-control" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}>
                {leadSources.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            <span>Notes</span>
            <textarea
              className="field-control"
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          {saveLead.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveLead.error.response?.data?.message || "Lead could not be saved."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={saveLead.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={saveLead.isPending || !hasIdentifier(form)} type="submit">
              {editingId ? "Save Lead" : "Create Lead"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        busy={deleteLead.isPending}
        confirmLabel="Delete Lead"
        description={deleteTarget ? `This will soft-delete "${deleteTarget.fullName}" and preserve audit history.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteLead.mutate(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete lead?"
      />
    </div>
  );
}
