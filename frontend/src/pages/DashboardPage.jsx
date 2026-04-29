import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { api } from "../services/api.js";
import { StatCard } from "../components/dashboard/StatCard.jsx";
import { Card } from "../components/ui/Card.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";

function formatRoi(val) {
  if (val == null || val === "") return "n/a";
  const n = Number(val);
  if (Number.isNaN(n)) return "n/a";
  return `${n.toFixed(2)}x`;
}

export default function DashboardPage() {
  const { data = {} } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/executive")).data,
  });
  const { data: funnel = [] } = useQuery({
    queryKey: ["funnel"],
    queryFn: async () => (await api.get("/dashboard/recruitment-funnel")).data,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive Overview"
        title="Dashboard"
        description="Recruitment portfolio totals, enrolment outcomes, and funnel progression for management review."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Campaigns" value={data.campaigns} />
        <StatCard label="Leads" value={data.totalLeads} />
        <StatCard label="Enrolments" value={data.totalEnrolments} />
        <StatCard label="ROI" value={formatRoi(data.roiRatio)} />
      </div>
      <Card title="Recruitment Funnel">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#005A9C" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
