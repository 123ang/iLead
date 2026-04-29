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

const campaignTypes = [
  "EDUCATION_FAIR",
  "UNIVERSITY_VISIT",
  "ROADSHOW",
  "ACADEMIC_COLLABORATION",
  "CONFERENCE",
  "AGENT_EVENT",
  "DIGITAL_CAMPAIGN",
  "CIAC_UMBRELLA",
  "OTHER",
];

const campaignStatuses = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];

const emptyForm = {
  name: "",
  campaignType: "EDUCATION_FAIR",
  status: "PLANNED",
  startDate: "",
  endDate: "",
  objective: "",
  approvedBudgetMyr: 0,
  countryIds: [],
  facultyIds: [],
  programmeIds: [],
};

function formatMoney(value) {
  return `MYR ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function humanize(value) {
  return String(value || "").replaceAll("_", " ");
}

function dateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function MultiSelect({ label, value, onChange, options, labelKey = "name" }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <select
        multiple
        className="field-control min-h-32"
        value={value}
        onChange={(event) =>
          onChange(Array.from(event.target.selectedOptions, (option) => option.value))
        }
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option[labelKey]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await api.get("/campaigns")).data,
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/master/countries")).data,
  });
  const { data: faculties = [] } = useQuery({
    queryKey: ["faculties"],
    queryFn: async () => (await api.get("/master/faculties")).data,
  });
  const { data: programmes = [] } = useQuery({
    queryKey: ["programmes"],
    queryFn: async () => (await api.get("/master/programmes")).data,
  });

  const saveCampaign = useMutation({
    mutationFn: async (payload) =>
      editingId
        ? (await api.patch(`/campaigns/${editingId}`, payload)).data
        : (await api.post("/campaigns", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setDrawerOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId) => (await api.delete(`/campaigns/${campaignId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setDeleteTarget(null);
    },
  });

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (campaignsQuery.data?.items || []).filter((campaign) => {
      const matchesSearch =
        !search ||
        [campaign.name, campaign.campaignType, campaign.objective]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesStatus = !statusFilter || campaign.status === statusFilter;
      const matchesType = !typeFilter || campaign.campaignType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaignsQuery.data?.items, query, statusFilter, typeFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(campaign) {
    setEditingId(campaign.id);
    setForm({
      name: campaign.name || "",
      campaignType: campaign.campaignType || "EDUCATION_FAIR",
      status: campaign.status || "PLANNED",
      startDate: dateInput(campaign.startDate),
      endDate: dateInput(campaign.endDate),
      objective: campaign.objective || "",
      approvedBudgetMyr: Number(campaign.approvedBudgetMyr || 0),
      countryIds: campaign.countries?.map((item) => item.countryId) || [],
      facultyIds: campaign.faculties?.map((item) => item.facultyId) || [],
      programmeIds: campaign.programmes?.map((item) => item.programmeId) || [],
    });
    setDrawerOpen(true);
  }

  function onSubmit(event) {
    event.preventDefault();
    saveCampaign.mutate({
      ...form,
      approvedBudgetMyr: Number(form.approvedBudgetMyr || 0),
    });
  }

  const columns = [
    {
      key: "name",
      header: "Campaign",
      render: (campaign) => (
        <div>
          <Link className="font-semibold text-uum-blue hover:underline" to={`/campaigns/${campaign.id}`}>
            {campaign.name}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="blue">{humanize(campaign.campaignType)}</Badge>
            <StatusPill value={campaign.status} />
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Timeline",
      render: (campaign) => (
        <div className="text-slate-700">
          <div>{dateInput(campaign.startDate) || "n/a"}</div>
          <div className="text-xs text-slate-500">to {dateInput(campaign.endDate) || "n/a"}</div>
        </div>
      ),
    },
    {
      key: "budget",
      header: "Budget / Spend",
      render: (campaign) => (
        <div>
          <div className="font-semibold text-slate-800">{formatMoney(campaign.approvedBudgetMyr)}</div>
          <div className="text-xs text-slate-500">Spend {formatMoney(campaign.actualSpendMyr)}</div>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      render: (campaign) => (
        <div className="text-xs text-slate-600">
          <div>{campaign.countries?.length || 0} countries</div>
          <div>{campaign.faculties?.length || 0} faculties</div>
          <div>{campaign.programmes?.length || 0} programmes</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cellClassName: "text-right",
      render: (campaign) => (
        <div className="flex justify-end gap-2">
          <Button className="px-2.5" onClick={() => openEdit(campaign)} variant="secondary">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button className="px-2.5" onClick={() => setDeleteTarget(campaign)} variant="secondary">
            <Trash2 className="h-4 w-4 text-red-700" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Campaign Management"
        title="Campaigns"
        description="Plan, monitor, and maintain international recruitment campaigns with audited create, edit, and delete flows."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Campaign
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
              placeholder="Search campaigns"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
        <label className="field-label lg:w-56">
          <span>Status</span>
          <select className="field-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {campaignStatuses.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label lg:w-64">
          <span>Type</span>
          <select className="field-control" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All types</option>
            {campaignTypes.map((type) => (
              <option key={type} value={type}>
                {humanize(type)}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>

      <DataTable
        columns={columns}
        emptyDescription="Create a campaign to begin recording recruitment activity."
        emptyTitle="No campaigns match the current view"
        error={campaignsQuery.error}
        isLoading={campaignsQuery.isLoading}
        rows={rows}
      />

      <SlideOver
        description="Campaign fields align with backend campaign validation and master-data mappings."
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        title={editingId ? "Edit Campaign" : "Create Campaign"}
      >
        <form className="grid gap-4" id="campaign-form" onSubmit={onSubmit}>
          <label className="field-label">
            <span>Campaign name</span>
            <input
              className="field-control"
              required
              minLength={2}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Type</span>
              <select
                className="field-control"
                value={form.campaignType}
                onChange={(event) => setForm((current) => ({ ...current, campaignType: event.target.value }))}
              >
                {campaignTypes.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Status</span>
              <select
                className="field-control"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {campaignStatuses.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Start date</span>
              <input
                className="field-control"
                required
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label className="field-label">
              <span>End date</span>
              <input
                className="field-control"
                required
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
          </div>
          <label className="field-label">
            <span>Approved budget</span>
            <input
              className="field-control"
              min="0"
              type="number"
              value={form.approvedBudgetMyr}
              onChange={(event) => setForm((current) => ({ ...current, approvedBudgetMyr: event.target.value }))}
            />
          </label>
          <label className="field-label">
            <span>Objective</span>
            <textarea
              className="field-control"
              rows={4}
              value={form.objective}
              onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
            />
          </label>
          <MultiSelect
            label="Countries"
            onChange={(countryIds) => setForm((current) => ({ ...current, countryIds }))}
            options={countries}
            value={form.countryIds}
          />
          <MultiSelect
            label="Faculties"
            onChange={(facultyIds) => setForm((current) => ({ ...current, facultyIds }))}
            options={faculties}
            value={form.facultyIds}
          />
          <MultiSelect
            label="Programmes"
            onChange={(programmeIds) => setForm((current) => ({ ...current, programmeIds }))}
            options={programmes}
            value={form.programmeIds}
          />
          {saveCampaign.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveCampaign.error.response?.data?.message || "Campaign could not be saved."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={saveCampaign.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={saveCampaign.isPending} type="submit">
              {editingId ? "Save Campaign" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        busy={deleteCampaign.isPending}
        confirmLabel="Delete Campaign"
        description={
          deleteTarget
            ? `This will soft-delete "${deleteTarget.name}" and remove it from active campaign lists.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteCampaign.mutate(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete campaign?"
      />
    </div>
  );
}
