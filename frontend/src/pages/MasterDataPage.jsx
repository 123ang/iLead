import React, { useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";

const resources = [
  { key: "countries", label: "Countries", fields: ["name", "iso2", "iso3", "region"] },
  { key: "faculties", label: "Faculties", fields: ["name", "code"] },
  { key: "programmes", label: "Programmes", fields: ["name", "code", "studyLevel", "facultyId"] },
  { key: "currencies", label: "Currencies", fields: ["code", "name", "symbol"] },
  { key: "scholarships", label: "Scholarships", fields: ["name", "type", "amountMyr"] },
  { key: "sponsors", label: "Sponsors", fields: ["name", "countryId"] },
];

const studyLevels = ["FOUNDATION", "BACHELOR", "MASTER", "PHD", "EXECUTIVE", "MOBILITY", "OTHER"];

function emptyFor(resource) {
  return Object.fromEntries(resource.fields.map((field) => [field, ""]));
}

function display(item) {
  return item.name || item.code || item.id;
}

export default function MasterDataPage() {
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState("countries");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const active = resources.find((resource) => resource.key === activeKey) || resources[0];
  const [form, setForm] = useState(emptyFor(active));

  const resourceQuery = useQuery({
    queryKey: ["master", active.key],
    queryFn: async () => (await api.get(`/master/${active.key}`)).data,
  });
  const { data: faculties = [] } = useQuery({
    queryKey: ["faculties"],
    queryFn: async () => (await api.get("/master/faculties")).data,
    enabled: active.key === "programmes",
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/master/countries")).data,
    enabled: active.key === "sponsors",
  });

  const createItem = useMutation({
    mutationFn: async (payload) => (await api.post(`/master/${active.key}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master", active.key] });
      qc.invalidateQueries({ queryKey: [active.key] });
      setDrawerOpen(false);
      setForm(emptyFor(active));
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
    setQuery("");
  }

  function openCreate() {
    setForm(emptyFor(active));
    setDrawerOpen(true);
  }

  function submit(event) {
    event.preventDefault();
    const payload = {};
    for (const [key, value] of Object.entries(form)) {
      if (value === "") continue;
      payload[key] = key.endsWith("Myr") ? Number(value) : value;
    }
    createItem.mutate(payload);
  }

  const columns = [
    {
      key: "name",
      header: active.label,
      render: (item) => (
        <div>
          <div className="font-semibold text-uum-navy">{display(item)}</div>
          <div className="mt-1 text-xs text-slate-500">{item.code || item.iso3 || item.type || item.region || item.id}</div>
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      render: (item) => (item.isActive === false ? <Badge tone="red">Inactive</Badge> : <Badge tone="green">Active</Badge>),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (item) => <span className="text-sm text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "n/a"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      cellClassName: "text-right",
      render: () => (
        <div className="flex justify-end gap-2">
          <Button disabled title="Backend update endpoint is not available yet." variant="secondary">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button disabled title="Backend delete/disable endpoint is not available yet." variant="secondary">
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
        description="Create supported reference records and review existing countries, faculties, programmes, currencies, scholarships, and sponsors."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New {active.label.slice(0, -1)}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <Button
            key={resource.key}
            onClick={() => selectResource(resource.key)}
            variant={resource.key === active.key ? "primary" : "secondary"}
          >
            {resource.label}
          </Button>
        ))}
      </div>

      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </label>
        <p className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Edit and delete are disabled until backend update/disable endpoints are implemented.
        </p>
      </Toolbar>

      <DataTable
        columns={columns}
        emptyDescription={`Create a ${active.label.toLowerCase()} record to populate this table.`}
        emptyTitle={`No ${active.label.toLowerCase()} found`}
        error={resourceQuery.error}
        isLoading={resourceQuery.isLoading}
        rows={rows}
      />

      <SlideOver onClose={() => setDrawerOpen(false)} open={drawerOpen} title={`Create ${active.label.slice(0, -1)}`}>
        <form className="grid gap-4" onSubmit={submit}>
          {active.fields.map((field) => (
            <label className="field-label" key={field}>
              <span>{field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</span>
              {field === "studyLevel" ? (
                <select className="field-control" value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                  <option value="">Select study level</option>
                  {studyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              ) : field === "facultyId" ? (
                <select className="field-control" value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                  <option value="">Select faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              ) : field === "countryId" ? (
                <select className="field-control" value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field-control"
                  required={["name", "code"].includes(field)}
                  type={field.endsWith("Myr") ? "number" : "text"}
                  value={form[field]}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                />
              )}
            </label>
          ))}
          {createItem.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createItem.error.response?.data?.message || "Record could not be created."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={createItem.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={createItem.isPending} type="submit">
              Create
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
