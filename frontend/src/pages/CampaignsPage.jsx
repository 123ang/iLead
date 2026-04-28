import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

const emptyForm = {
  name: "",
  campaignType: "EDUCATION_FAIR",
  startDate: "",
  endDate: "",
  objective: "",
  approvedBudgetMyr: 0,
  countryIds: [],
  facultyIds: [],
  programmeIds: [],
};

function MultiSelect({ label, value, onChange, options, labelKey = "name" }) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <select
        multiple
        className="min-h-28 rounded border border-slate-300 p-2"
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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const { data: campaigns = { items: [] } } = useQuery({
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

  const mutation = useMutation({
    mutationFn: async (payload) =>
      editingId
        ? (await api.patch(`/campaigns/${editingId}`, payload)).data
        : (await api.post("/campaigns", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const tableRows = useMemo(() => campaigns.items || [], [campaigns.items]);

  function editCampaign(campaign) {
    setEditingId(campaign.id);
    setForm({
      name: campaign.name,
      campaignType: campaign.campaignType,
      startDate: String(campaign.startDate).slice(0, 10),
      endDate: String(campaign.endDate).slice(0, 10),
      objective: campaign.objective || "",
      approvedBudgetMyr: Number(campaign.approvedBudgetMyr || 0),
      countryIds: campaign.countries.map((item) => item.countryId),
      facultyIds: campaign.faculties.map((item) => item.facultyId),
      programmeIds: campaign.programmes.map((item) => item.programmeId),
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    mutation.mutate({
      ...form,
      approvedBudgetMyr: Number(form.approvedBudgetMyr),
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card title="Campaigns">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Campaign</th>
                <th className="py-2">Type</th>
                <th className="py-2">Spend</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="py-2">
                    <Link className="text-uum-blue" to={`/campaigns/${campaign.id}`}>
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="py-2">{campaign.campaignType}</td>
                  <td className="py-2">MYR {Number(campaign.actualSpendMyr || 0).toFixed(2)}</td>
                  <td className="py-2">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => editCampaign(campaign)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={editingId ? "Edit Campaign" : "Create Campaign"}>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <input
            className="rounded border border-slate-300 p-2"
            placeholder="Campaign name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="rounded border border-slate-300 p-2"
            value={form.campaignType}
            onChange={(event) =>
              setForm((current) => ({ ...current, campaignType: event.target.value }))
            }
          >
            {[
              "EDUCATION_FAIR",
              "UNIVERSITY_VISIT",
              "ROADSHOW",
              "ACADEMIC_COLLABORATION",
              "CONFERENCE",
              "AGENT_EVENT",
              "DIGITAL_CAMPAIGN",
              "CIAC_UMBRELLA",
              "OTHER",
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded border border-slate-300 p-2"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, startDate: event.target.value }))
              }
            />
            <input
              className="rounded border border-slate-300 p-2"
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </div>
          <textarea
            className="rounded border border-slate-300 p-2"
            placeholder="Objective"
            rows={3}
            value={form.objective}
            onChange={(event) =>
              setForm((current) => ({ ...current, objective: event.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 p-2"
            type="number"
            min="0"
            value={form.approvedBudgetMyr}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                approvedBudgetMyr: event.target.value,
              }))
            }
          />
          <MultiSelect
            label="Countries"
            value={form.countryIds}
            onChange={(countryIds) => setForm((current) => ({ ...current, countryIds }))}
            options={countries}
          />
          <MultiSelect
            label="Faculties"
            value={form.facultyIds}
            onChange={(facultyIds) => setForm((current) => ({ ...current, facultyIds }))}
            options={faculties}
          />
          <MultiSelect
            label="Programmes"
            value={form.programmeIds}
            onChange={(programmeIds) => setForm((current) => ({ ...current, programmeIds }))}
            options={programmes}
          />
          <button className="rounded bg-uum-blue px-4 py-2 text-white" type="submit">
            {editingId ? "Save Campaign" : "Create Campaign"}
          </button>
        </form>
      </Card>
    </div>
  );
}

