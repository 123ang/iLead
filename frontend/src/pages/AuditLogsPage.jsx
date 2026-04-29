import React, { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { api } from "../services/api.js";

const emptyFilters = { search: "", action: "", entity: "", userId: "", from: "", to: "", take: "200" };

export default function AuditLogsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);
  const logsQuery = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => (await api.get("/audit-logs", { params })).data,
  });

  const rows = Array.isArray(logsQuery.data) ? logsQuery.data : [];
  const actions = [...new Set(rows.map((row) => row.action).filter(Boolean))].sort();
  const entities = [...new Set(rows.map((row) => row.entity).filter(Boolean))].sort();

  const columns = [
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <div>
          <Badge tone="gold">{log.action?.replaceAll("_", " ")}</Badge>
          <div className="mt-2 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (log) => (
        <div>
          <div className="font-semibold text-uum-navy">{log.entity}</div>
          <div className="mt-1 text-xs text-slate-500">{log.entityId || "No entity id"}</div>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (log) => <span className="text-sm text-slate-600">{log.user?.name || log.userId || "System"}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (log) => <span className="text-xs text-slate-500">{log.ipAddress || "n/a"}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Governance" title="Audit Logs" description="Filter recorded administrative and workflow activity by action, entity, user, and date range." />
      <Toolbar>
        <label className="field-label min-w-[220px] flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field-control pl-9" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          </div>
        </label>
        <label className="field-label min-w-[160px]"><span>Action</span><select className="field-control" value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select></label>
        <label className="field-label min-w-[160px]"><span>Entity</span><select className="field-control" value={filters.entity} onChange={(event) => setFilters((current) => ({ ...current, entity: event.target.value }))}><option value="">All entities</option>{entities.map((entity) => <option key={entity} value={entity}>{entity}</option>)}</select></label>
        <label className="field-label w-32"><span>Take</span><input className="field-control" min="1" max="500" type="number" value={filters.take} onChange={(event) => setFilters((current) => ({ ...current, take: event.target.value }))} /></label>
      </Toolbar>
      <Toolbar>
        <label className="field-label"><span>User ID</span><input className="field-control" value={filters.userId} onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))} /></label>
        <label className="field-label"><span>From</span><input className="field-control" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label className="field-label"><span>To</span><input className="field-control" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <Button onClick={() => setFilters(emptyFilters)} variant="secondary"><Filter className="h-4 w-4" />Reset</Button>
      </Toolbar>
      <DataTable columns={columns} emptyDescription="No audit log rows match the current filters." emptyTitle="No audit logs found" error={logsQuery.error} isLoading={logsQuery.isLoading} rows={rows} />
    </div>
  );
}
