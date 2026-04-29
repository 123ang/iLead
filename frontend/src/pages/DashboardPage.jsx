import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

function formatMoneyMyr(v) {
  if (v == null || v === "") return "n/a";
  const n = Number(v);
  if (Number.isNaN(n)) return "n/a";
  return `RM ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
}

function safeDiv(n, d) {
  const dn = Number(d);
  return !dn || dn === 0 ? 0 : Number(n) / dn;
}

const COLORS = {
  navy: "#071B3A",
  royal: "#123C69",
  blue: "#0B4F8A",
  gold: "#C9A227",
  red: "#B91C1C",
  mist: "#EEF4FA",
  amber: "#F4A300",
};

const LINE_COLORS = {
  leads: COLORS.blue,
  applications: COLORS.royal,
  offers: COLORS.gold,
  enrolments: COLORS.navy,
};

export default function DashboardPage() {
  const { data = {} } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/executive")).data,
  });

  // Existing current snapshot funnel (not yearly)
  const { data: funnel = [] } = useQuery({
    queryKey: ["funnel"],
    queryFn: async () => (await api.get("/dashboard/recruitment-funnel")).data,
  });

  const { data: pipelineByYear = [] } = useQuery({
    queryKey: ["dashboard", "pipelineByYear"],
    queryFn: async () => (await api.get("/dashboard/pipeline-by-year")).data,
  });

  const { data: roiByYear = [] } = useQuery({
    queryKey: ["dashboard", "roiByYear"],
    queryFn: async () => (await api.get("/dashboard/roi-by-year")).data,
  });

  const { data: overdueSlaByYear = [] } = useQuery({
    queryKey: ["dashboard", "overdueSlaByYear"],
    queryFn: async () => (await api.get("/dashboard/overdue-sla-by-year")).data,
  });

  const { data: enrolmentsByYear = [] } = useQuery({
    queryKey: ["dashboard", "enrolmentsByYear"],
    queryFn: async () => (await api.get("/dashboard/enrolments-by-year")).data,
  });

  const { data: enrolmentsByProgramme = null } = useQuery({
    queryKey: ["dashboard", "enrolmentsByProgramme"],
    queryFn: async () => (await api.get("/dashboard/enrolments-by-year-programme")).data,
  });

  const { data: enrolmentsByCountry = null } = useQuery({
    queryKey: ["dashboard", "enrolmentsByCountry"],
    queryFn: async () => (await api.get("/dashboard/enrolments-by-year-country")).data,
  });

  const { data: costBreakdownByYear = null } = useQuery({
    queryKey: ["dashboard", "costBreakdownByYear"],
    queryFn: async () => (await api.get("/dashboard/cost-breakdown-by-year")).data,
  });

  const yearlyConversion = useMemo(() => {
    if (!pipelineByYear?.length) return [];
    return pipelineByYear.map((row) => {
      const leads = Number(row.leads || 0);
      const applications = Number(row.applications || 0);
      const offers = Number(row.offers || 0);
      const enrolments = Number(row.enrolments || 0);

      return {
        year: row.year,
        leadToApplicationRate: safeDiv(applications, leads) * 100,
        applicationToOfferRate: safeDiv(offers, applications) * 100,
        offerToEnrolmentRate: safeDiv(enrolments, offers) * 100,
        applicationToEnrolmentRate: safeDiv(enrolments, applications) * 100,
      };
    });
  }, [pipelineByYear]);

  const enrolmentsOverallLine = useMemo(() => {
    // backend returns {year,enrolments}
    return (enrolmentsByYear || []).map((d) => ({ year: d.year, enrolments: d.enrolments ?? 0 }));
  }, [enrolmentsByYear]);

  const overdueChartData = useMemo(() => {
    return (overdueSlaByYear || []).map((d) => ({
      year: d.year,
      overdueHOT: d.overdueByQuality?.HOT ?? 0,
      overdueWARM: d.overdueByQuality?.WARM ?? 0,
      overdueCOLD: d.overdueByQuality?.COLD ?? 0,
      withinSlaTotal: d.withinSlaTotal ?? 0,
      overdueRate: d.overdueRate ?? 0,
    }));
  }, [overdueSlaByYear]);

  const programmeChartData = useMemo(() => {
    if (!enrolmentsByProgramme?.years) return [];
    const { years, programmes, otherValues } = enrolmentsByProgramme;
    return years.map((year, idx) => {
      const obj = { year };
      for (const p of programmes || []) obj[p.programmeId] = p.values?.[idx] ?? 0;
      obj.__other__ = otherValues?.[idx] ?? 0;
      return obj;
    });
  }, [enrolmentsByProgramme]);

  const countryChartData100 = useMemo(() => {
    if (!enrolmentsByCountry?.years) return [];
    const { years, countries, otherValues } = enrolmentsByCountry;

    return years.map((year, idx) => {
      const obj = { year };
      const series = (countries || []).map((c) => ({
        key: c.countryId,
        v: c.values?.[idx] ?? 0,
      }));
      const other = otherValues?.[idx] ?? 0;
      const total = series.reduce((s, x) => s + x.v, 0) + other;

      for (const s of series) obj[s.key] = total > 0 ? (s.v / total) * 100 : 0;
      obj.__other__ = total > 0 ? (other / total) * 100 : 0;
      return obj;
    });
  }, [enrolmentsByCountry]);

  const costChartData = useMemo(() => {
    if (!costBreakdownByYear?.years) return [];
    const { years, costTypes, valuesByCostType, otherValues } = costBreakdownByYear;
    return years.map((year, idx) => {
      const obj = { year };
      for (const t of costTypes || []) obj[t] = valuesByCostType?.[t]?.[idx] ?? 0;
      obj.__other__ = otherValues?.[idx] ?? 0;
      return obj;
    });
  }, [costBreakdownByYear]);

  const programmePalette = [COLORS.blue, COLORS.royal, COLORS.gold, "#1D4ED8", "#2563EB", "#0F766E", "#334155"];
  const countryPalette = [COLORS.royal, COLORS.gold, COLORS.blue, "#1D4ED8", "#16A34A", "#7C3AED", "#0F766E"];
  const costPalette = [COLORS.gold, COLORS.blue, COLORS.royal, COLORS.amber, "#0F766E", "#334155", "#1D4ED8"];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive Overview"
        title="Dashboard"
        description="Yearly trends and executive KPI context for recruitment performance and ROI."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Campaigns" value={data.campaigns} />
        <StatCard label="Leads" value={data.totalLeads} />
        <StatCard label="Enrolments" value={data.totalEnrolments} />
        <StatCard label="ROI" value={formatRoi(data.roiRatio)} />
      </div>

      <Card title="Recruitment Funnel (Current Snapshot)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.royal} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Pipeline Trend by Year">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pipelineByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke={LINE_COLORS.leads} strokeWidth={2} />
                <Line type="monotone" dataKey="applications" stroke={LINE_COLORS.applications} strokeWidth={2} />
                <Line type="monotone" dataKey="offers" stroke={LINE_COLORS.offers} strokeWidth={2} />
                <Line type="monotone" dataKey="enrolments" stroke={LINE_COLORS.enrolments} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="ROI by Year (Spend vs Net Revenue)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={roiByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" tickFormatter={(v) => `${Number(v).toFixed(1)}x`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "roiRatio") return formatRoi(value);
                    if (name === "spendMyr") return `Spend: ${formatMoneyMyr(value)}`;
                    if (name === "tuitionRevenueMyr") return `Tuition: ${formatMoneyMyr(value)}`;
                    return value;
                  }}
                />
                <Bar yAxisId="left" dataKey="roiRatio" name="ROI" fill={COLORS.gold} radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="spendMyr" name="Spend (MYR)" stroke={COLORS.royal} dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Overdue Follow-ups by Year (SLA Health)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overdueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="overdueHOT" stackId="overdue" fill={COLORS.red} name="Overdue HOT" />
                <Bar dataKey="overdueWARM" stackId="overdue" fill={COLORS.gold} name="Overdue WARM" />
                <Bar dataKey="overdueCOLD" stackId="overdue" fill={COLORS.blue} name="Overdue COLD" />
                <Bar dataKey="withinSlaTotal" stackId="within" fill={COLORS.navy} name="Within SLA" opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Enrolments by Year (Overall)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrolmentsOverallLine}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enrolments" stroke={COLORS.royal} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Enrolments by Programme (Top N)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programmeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                {enrolmentsByProgramme?.programmes?.map((p, idx) => (
                  <Bar
                    key={p.programmeId}
                    dataKey={p.programmeId}
                    name={p.name}
                    fill={programmePalette[idx % programmePalette.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
                <Bar dataKey="__other__" name="Other" fill={COLORS.mist} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Enrolments by Country (100% Stacked)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryChartData100}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
                {enrolmentsByCountry?.countries?.map((c, idx) => (
                  <Bar
                    key={c.countryId}
                    dataKey={c.countryId}
                    name={c.name}
                    stackId="country"
                    fill={countryPalette[idx % countryPalette.length]}
                  />
                ))}
                <Bar dataKey="__other__" name="Other" stackId="country" fill="#94A3B8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Cost Breakdown by Year (Top Cost Types)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                {(costBreakdownByYear?.costTypes || []).map((t, idx) => (
                  <Bar
                    key={t}
                    dataKey={t}
                    name={t}
                    stackId="costs"
                    fill={costPalette[idx % costPalette.length]}
                  />
                ))}
                <Bar dataKey="__other__" name="Other" stackId="costs" fill="#CBD5E1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Optional: Conversion Rates by Year">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyConversion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} domain={[0, "auto"]} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="leadToApplicationRate" stroke={COLORS.royal} strokeWidth={2} name="Lead→App" />
                <Line type="monotone" dataKey="applicationToOfferRate" stroke={COLORS.gold} strokeWidth={2} name="App→Offer" />
                <Line type="monotone" dataKey="offerToEnrolmentRate" stroke={COLORS.blue} strokeWidth={2} name="Offer→Enrol" />
                <Line type="monotone" dataKey="applicationToEnrolmentRate" stroke={COLORS.navy} strokeWidth={2} name="App→Enrol" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
