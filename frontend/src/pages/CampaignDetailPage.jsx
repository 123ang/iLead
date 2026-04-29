import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { StatusPill } from "../components/ui/Badge.jsx";
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
  const [deleteCostTarget, setDeleteCostTarget] = useState(null);

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
      setDeleteCostTarget(null);
    },
  });

  if (!campaign) return <p className="text-sm text-slate-500">Loading campaign...</p>;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Campaign Portfolio"
        title={campaign.name}
        description="Campaign performance, spend records, and ROI summary."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
      <Card title={campaign.name}>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Type</div>
            <div className="mt-1 font-semibold text-uum-navy">{campaign.campaignType.replaceAll("_", " ")}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-1"><StatusPill value={campaign.status} /></div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Budget</div>
            <div className="mt-1 font-semibold text-uum-navy">MYR {Number(campaign.approvedBudgetMyr || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Actual spend</div>
            <div className="mt-1 font-semibold text-uum-navy">MYR {Number(campaign.actualSpendMyr || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Funnel</div>
            <div className="mt-1 font-semibold text-uum-navy">{roi?.totalLeads ?? 0} leads / {roi?.totalApplications ?? 0} applications / {roi?.totalEnrolments ?? 0} enrolments</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">ROI</div>
            <div className="mt-1 font-semibold text-uum-navy">{roi?.roiRatio == null ? "n/a" : `${Number(roi.roiRatio).toFixed(2)}x`}</div>
          </div>
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
                    <Button
                      className="px-2 py-1 text-xs"
                      onClick={() => setDeleteCostTarget(cost)}
                      variant="secondary"
                    >
                      Delete
                    </Button>
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
            className="field-control"
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
            className="field-control"
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
            className="field-control"
            type="number"
            min="0"
            placeholder="Original amount"
            value={costForm.amountOriginal}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, amountOriginal: event.target.value }))
            }
          />
          <input
            className="field-control"
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
            className="field-control"
            type="date"
            value={costForm.costDate}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, costDate: event.target.value }))
            }
          />
          <textarea
            className="field-control"
            rows={3}
            placeholder="Description"
            value={costForm.description}
            onChange={(event) =>
              setCostForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <Button type="submit">
            Save Cost
          </Button>
        </form>
      </Card>
      </div>
      <ConfirmDialog
        busy={deleteCost.isPending}
        confirmLabel="Delete Cost"
        description={
          deleteCostTarget
            ? `This will permanently delete "${deleteCostTarget.description || deleteCostTarget.costType}" and refresh campaign spend.`
            : ""
        }
        onCancel={() => setDeleteCostTarget(null)}
        onConfirm={() => deleteCost.mutate(deleteCostTarget.id)}
        open={Boolean(deleteCostTarget)}
        title="Delete campaign cost?"
      />
    </div>
  );
}
