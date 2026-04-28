import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { api } from "../services/api.js";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [costForm, setCostForm] = useState({
    currencyId: "",
    costType: "TRAVEL",
    amountOriginal: 0,
    fxRateToMyr: 1,
    description: "",
    costDate: "",
  });

  const { data: campaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => (await api.get(`/campaigns/${id}`)).data,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => (await api.get("/master/currencies")).data,
  });
  const { data: roi } = useQuery({
    queryKey: ["campaign-roi", id],
    queryFn: async () => (await api.get(`/campaigns/${id}/roi`)).data,
  });

  const createCost = useMutation({
    mutationFn: async (payload) => (await api.post(`/campaigns/${id}/costs`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign", id] });
      qc.invalidateQueries({ queryKey: ["campaign-roi", id] });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (costId) => api.delete(`/campaigns/${id}/costs/${costId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign", id] });
      qc.invalidateQueries({ queryKey: ["campaign-roi", id] });
    },
  });

  if (!campaign) return <p>Loading...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
      <Card title={campaign.name}>
        <div className="grid gap-2 text-sm">
          <p>Type: {campaign.campaignType}</p>
          <p>Budget: MYR {Number(campaign.approvedBudgetMyr || 0).toFixed(2)}</p>
          <p>Actual spend: MYR {Number(campaign.actualSpendMyr || 0).toFixed(2)}</p>
          <p>Leads: {roi?.totalLeads ?? 0}</p>
          <p>Applications: {roi?.totalApplications ?? 0}</p>
          <p>Enrolments: {roi?.totalEnrolments ?? 0}</p>
          <p>ROI: {roi?.roiRatio == null ? "n/a" : `${Number(roi.roiRatio).toFixed(2)}x`}</p>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Description</th>
                <th className="py-2">MYR</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {campaign.costs.map((cost) => (
                <tr key={cost.id} className="border-b">
                  <td className="py-2">{cost.description || cost.costType}</td>
                  <td className="py-2">{Number(cost.amountMyr).toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => deleteCost.mutate(cost.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Add Campaign Cost">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            createCost.mutate({
              ...costForm,
              amountOriginal: Number(costForm.amountOriginal),
              fxRateToMyr: Number(costForm.fxRateToMyr),
              costDate: costForm.costDate || null,
            });
          }}
        >
          <select
            className="rounded border border-slate-300 p-2"
            value={costForm.currencyId}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, currencyId: event.target.value }))
            }
          >
            <option value="">Select currency</option>
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.code}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 p-2"
            value={costForm.costType}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, costType: event.target.value }))
            }
          >
            {["TRAVEL", "ACCOMMODATION", "BOOTH", "MARKETING", "ALLOWANCE", "AGENCY", "DIGITAL", "OTHER"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
          <input
            className="rounded border border-slate-300 p-2"
            type="number"
            min="0"
            placeholder="Original amount"
            value={costForm.amountOriginal}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, amountOriginal: event.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 p-2"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="FX rate to MYR"
            value={costForm.fxRateToMyr}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, fxRateToMyr: event.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 p-2"
            type="date"
            value={costForm.costDate}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, costDate: event.target.value }))
            }
          />
          <textarea
            className="rounded border border-slate-300 p-2"
            rows={3}
            placeholder="Description"
            value={costForm.description}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <button className="rounded bg-uum-blue px-4 py-2 text-white" type="submit">
            Save Cost
          </button>
        </form>
      </Card>
    </div>
  );
}

