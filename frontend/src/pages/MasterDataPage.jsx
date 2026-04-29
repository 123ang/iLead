import React, { useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";

const studyLevels = ["FOUNDATION", "BACHELOR", "MASTER", "PHD", "EXECUTIVE", "MOBILITY", "OTHER"];

const resources = [
  { key: "countries", singular: "Country", label: "Countries", fields: ["name", "iso2", "iso3", "region"], canDelete: true },
  { key: "faculties", singular: "Faculty", label: "Faculties", fields: ["name", "code"], canDelete: true },
  { key: "programmes", singular: "Programme", label: "Programmes", fields: ["name", "code", "studyLevel", "facultyId", "durationYears"], canDelete: true },
  { key: "currencies", singular: "Currency", label: "Currencies", fields: ["code", "name", "symbol"], canDelete: false, note: "[~] Currency disable is not exposed because campaign costs can reference currencies." },
  { key: "fxRates", singular: "FX Rate", label: "FX Rates", fields: ["currencyId", "rateToMyr", "rateDate", "source"], canDelete: true, hardDelete: true },
  { key: "tuitionFees", singular: "Tuition Fee", label: "Tuition Fees", fields: ["programmeId", "studyLevel", "amountMyr", "academicYear", "annualFeeMyr", "fullProgrammeFeeMyr", "effectiveFrom", "effectiveTo"], canDelete: true },
  { key: "scholarships", singular: "Scholarship", label: "Scholarships", fields: ["name", "type", "discountPercent", "amountMyr", "valueMyr", "isPercent"], canDelete: true },
  { key: "sponsors", singular: "Sponsor", label: "Sponsors", fields: ["name", "countryId"], canDelete: true },
];

const numericFields = new Set(["durationYears", "rateToMyr", "amountMyr", "annualFeeMyr", "fullProgrammeFeeMyr", "discountPercent", "valueMyr"]);
const dateFields = new Set(["rateDate", "effectiveFrom", "effectiveTo"]);
const booleanFields = new Set(["isPercent"]);

function emptyFor(resource) {
  return Object.fromEntries(resource.fields.map((field) => [field, booleanFields.has(field) ? false : ""]));
}

function display(item) {
  return item.name || item.code || item.programme?.name || item.currency?.code || item.academicYear || item.id;
}

function formatDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function message(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.message || fallback;
}

export default function MasterDataPage() {
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState("countries");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const active = resources.find((resource) => resource.key === activeKey) || resources[0];
  const [form, setForm] = useState(emptyFor(active));

  const resourceQuery = useQuery({
    queryKey: ["master", active.key],
    queryFn: async () => (await api.get(`/master/${active.key}`)).data,
  });
  const { data: faculties = [] } = useQuery({
    queryKey: ["master", "faculties", "options"],
    queryFn: async () => (await api.get("/master/faculties")).data,
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["master", "countries", "options"],
    queryFn: async () => (await api.get("/master/countries")).data,
  });
  const { data: programmes = [] } = useQuery({
    queryKey: ["master", "programmes", "options"],
    queryFn: async () => (await api.get("/master/programmes")).data,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: ["master", "currencies", "options"],
    queryFn: async () => (await api.get("/master/currencies")).data,
  });

  const saveItem = useMutation({
    mutationFn: async (payload) => {
      const url = editing ? `/master/${active.key}/${editing.id}` : `/master/${active.key}`;
      const method = editing ? "patch" : "post";
      return (await api[method](url, payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master", active.key] });
      qc.invalidateQueries({ queryKey: ["master", active.key, "options"] });
      setDrawerOpen(false);
      setEditing(null);
      setForm(emptyFor(active));
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (item) => (await api.delete(`/master/${active.key}/${item.id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master", active.key] });
      setDeleteTarget(null);
    },
  });

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (resourceQuery.data || []).filter((item) => {
      if (!search) return true;
      return Object.values(item).some((value) => String(value || "").toLowerCase().includes(search));
    });
  }, [query, resourceQuery.data]);

  function selectResource(key) {
    const next = resources.find((resource) => resource.key === key) || resources[0];
    setActiveKey(next.key);
    setForm(emptyFor(next));
    setEditing(null);
    setDeleteTarget(null);
    setDrawerOpen(false);
    setQuery("");
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyFor(active));
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm(Object.fromEntries(active.fields.map((field) => [field, dateFields.has(field) ? formatDateInput(item[field]) : item[field] ?? (booleanFields.has(field) ? false : "")])));
    setDrawerOpen(true);
  }

  function payloadFromForm() {
    const payload = {};
    for (const [key, value] of Object.entries(form)) {
      if (value === "" || value == null) continue;
      if (numericFields.has(key)) payload[key] = Number(value);
      else if (booleanFields.has(key)) payload[key] = Boolean(value);
      else payload[key] = value;
    }
    return payload;
  }

  function submit(event) {
    event.preventDefault();
    saveItem.mutate(payloadFromForm());
  }

  function renderField(field) {
    const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
    const value = form[field];
    const onChange = (next) => setForm((current) => ({ ...current, [field]: next }));
    if (field === "studyLevel") {
      return (
        <select className="field-control" required value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select study level</option>
          {studyLevels.map((level) => <option key={level} value={level}>{level.replaceAll("_", " ")}</option>)}
        </select>
      );
    }
    if (field === "facultyId") {
      return <select className="field-control" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select faculty</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>;
    }
    if (field === "countryId") {
      return <select className="field-control" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select country</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>;
    }
    if (field === "programmeId") {
      return <select className="field-control" required value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select programme</option>{programmes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>;
    }
    if (field === "currencyId") {
      return <select className="field-control" required value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select currency</option>{currencies.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select>;
    }
    if (booleanFields.has(field)) {
      return <input checked={Boolean(value)} className="h-4 w-4 rounded border-slate-300 text-uum-blue" type="checkbox" onChange={(event) => onChange(event.target.checked)} />;
    }
    return (
      <input
        className="field-control"
        required={["name", "code", "rateToMyr", "rateDate", "amountMyr", "academicYear"].includes(field)}
        type={dateFields.has(field) ? "date" : numericFields.has(field) ? "number" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  const columns = [
    {
      key: "name",
      header: active.label,
      render: (item) => (
        <div>
          <div className="font-semibold text-uum-navy">{display(item)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {item.code || item.iso3 || item.type || item.region || item.currency?.name || item.programme?.code || item.id}
          </div>
        </div>
      ),
    },
    {
      key: "detail",
      header: "Detail",
      render: (item) => <span className="text-sm text-slate-600">{item.studyLevel || item.academicYear || item.rateToMyr || item.amountMyr || item.country?.name || "n/a"}</span>,
    },
    {
      key: "state",
      header: "State",
      render: (item) => (item.isActive === false ? <Badge tone="red">Inactive</Badge> : <Badge tone="green">Active</Badge>),
    },
    {
      key: "actions",
      header: "Actions",
      cellClassName: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => openEdit(item)} title={`Edit ${active.singular}`} variant="secondary">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button disabled={!active.canDelete} onClick={() => setDeleteTarget(item)} title={active.canDelete ? `${active.hardDelete ? "Delete" : "Disable"} ${active.singular}` : active.note} variant="secondary">
            <Trash2 className="h-4 w-4 text-red-700" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reference Data"
        title="Master Data"
        description="Maintain backend-supported countries, faculties, programmes, currencies, FX rates, tuition fees, scholarships, and sponsors."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New {active.singular}</Button>}
      />

      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => <Button key={resource.key} onClick={() => selectResource(resource.key)} variant={resource.key === active.key ? "primary" : "secondary"}>{resource.label}</Button>)}
      </div>

      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </label>
        {active.note ? <p className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{active.note}</p> : null}
      </Toolbar>

      <DataTable columns={columns} emptyDescription={`Create a ${active.label.toLowerCase()} record to populate this table.`} emptyTitle={`No ${active.label.toLowerCase()} found`} error={resourceQuery.error} isLoading={resourceQuery.isLoading} rows={rows} />

      <SlideOver onClose={() => setDrawerOpen(false)} open={drawerOpen} title={`${editing ? "Edit" : "Create"} ${active.singular}`}>
        <form className="grid gap-4" onSubmit={submit}>
          {active.fields.map((field) => (
            <label className={`field-label ${booleanFields.has(field) ? "flex-row items-center gap-3" : ""}`} key={field}>
              <span>{field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</span>
              {renderField(field)}
            </label>
          ))}
          {saveItem.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message(saveItem.error, "Record could not be saved.")}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={saveItem.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">Cancel</Button>
            <Button disabled={saveItem.isPending} type="submit">{editing ? "Save Changes" : "Create"}</Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        busy={deleteItem.isPending}
        confirmLabel={active.hardDelete ? "Delete" : "Disable"}
        description={deleteTarget ? `${active.hardDelete ? "Delete" : "Disable"} "${display(deleteTarget)}"? This action will be audit logged.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteItem.mutate(deleteTarget)}
        open={Boolean(deleteTarget)}
        title={`${active.hardDelete ? "Delete" : "Disable"} ${active.singular}`}
      />
    </div>
  );
}
