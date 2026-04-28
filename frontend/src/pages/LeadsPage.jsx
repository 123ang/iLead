import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

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
  source: "MANUAL_ENTRY",
  campaignId: "",
  assignedStaffId: "",
  notes: "",
};

export default function LeadsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyLead);
  const [editingId, setEditingId] = useState(null);

  const { data: leads = { items: [] } } = useQuery({
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
  });

  const saveLead = useMutation({
    mutationFn: async (payload) =>
      editingId
        ? (await api.patch(`/leads/${editingId}`, payload)).data
        : (await api.post("/leads", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
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

  function editLead(lead) {
    setEditingId(lead.id);
    setForm({
      fullName: lead.fullName,
      email: lead.email || "",
      phone: lead.phone || "",
      passportNumber: lead.passportNumber || "",
      externalLeadId: lead.externalLeadId || "",
      countryId: lead.countryId || "",
      interestedProgrammeId: lead.interestedProgrammeId || "",
      studyLevel: lead.studyLevel || "BACHELOR",
      leadQuality: lead.leadQuality || "WARM",
      source: lead.source || "MANUAL_ENTRY",
      campaignId: lead.touches[0]?.campaignId || "",
      assignedStaffId: lead.assignedStaffId || "",
      notes: lead.notes || "",
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <Card title="Leads">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Lead</th>
                <th className="py-2">Quality</th>
                <th className="py-2">Status</th>
                <th className="py-2">Assign</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {leads.items.map((lead) => (
                <tr key={lead.id} className="border-b align-top">
                  <td className="py-2">
                    <Link className="text-uum-blue" to={`/leads/${lead.id}`}>
                      {lead.fullName}
                    </Link>
                    <p className="text-xs text-slate-500">{lead.email || lead.phone || lead.passportNumber}</p>
                  </td>
                  <td className="py-2">{lead.leadQuality}</td>
                  <td className="py-2">
                    <select
                      className="rounded border border-slate-300 p-1 text-xs"
                      value={lead.status}
                      onChange={(event) =>
                        updateStatus.mutate({ leadId: lead.id, status: event.target.value })
                      }
                    >
                      {["NEW", "CONTACTED", "INTERESTED", "APPLIED", "OFFERED", "ENROLLED", "LOST", "DUPLICATE"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className="py-2">
                    <select
                      className="rounded border border-slate-300 p-1 text-xs"
                      value={lead.assignedStaffId || ""}
                      onChange={(event) =>
                        assignLead.mutate({
                          leadId: lead.id,
                          assignedStaffId: event.target.value,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter((user) => user.role === "STAFF")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => editLead(lead)}
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

      <Card title={editingId ? "Edit Lead" : "Create Lead"}>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveLead.mutate(form);
          }}
        >
          {[
            ["fullName", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["passportNumber", "Passport number"],
            ["externalLeadId", "External lead ID"],
          ].map(([key, label]) => (
            <input
              key={key}
              className="rounded border border-slate-300 p-2"
              placeholder={label}
              value={form[key]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          ))}

          <select
            className="rounded border border-slate-300 p-2"
            value={form.countryId}
            onChange={(event) => setForm((current) => ({ ...current, countryId: event.target.value }))}
          >
            <option value="">Select country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 p-2"
            value={form.interestedProgrammeId}
            onChange={(event) =>
              setForm((current) => ({ ...current, interestedProgrammeId: event.target.value }))
            }
          >
            <option value="">Select programme</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 p-2"
            value={form.campaignId}
            onChange={(event) => setForm((current) => ({ ...current, campaignId: event.target.value }))}
          >
            <option value="">Touch campaign</option>
            {campaigns.items.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 p-2"
            value={form.assignedStaffId}
            onChange={(event) =>
              setForm((current) => ({ ...current, assignedStaffId: event.target.value }))
            }
          >
            <option value="">Assign staff</option>
            {users
              .filter((user) => user.role === "STAFF")
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="rounded border border-slate-300 p-2"
              value={form.studyLevel}
              onChange={(event) =>
                setForm((current) => ({ ...current, studyLevel: event.target.value }))
              }
            >
              {["FOUNDATION", "BACHELOR", "MASTER", "PHD", "EXECUTIVE", "MOBILITY", "OTHER"].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
            <select
              className="rounded border border-slate-300 p-2"
              value={form.leadQuality}
              onChange={(event) =>
                setForm((current) => ({ ...current, leadQuality: event.target.value }))
              }
            >
              {["HOT", "WARM", "COLD"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-slate-300 p-2"
              value={form.source}
              onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
            >
              {["MANUAL_ENTRY", "EVENT_FORM", "CSV_UPLOAD", "QR_CODE", "WEBSITE", "AGENT_REFERRAL", "OTHER"].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </div>
          <textarea
            className="rounded border border-slate-300 p-2"
            rows={3}
            placeholder="Notes"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
          <button className="rounded bg-uum-blue px-4 py-2 text-white" type="submit">
            {editingId ? "Save Lead" : "Create Lead"}
          </button>
        </form>
      </Card>
    </div>
  );
}

