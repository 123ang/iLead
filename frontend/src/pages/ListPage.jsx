import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge, StatusPill } from "../components/ui/Badge.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { api } from "../services/api.js";

function labelFor(item) {
  return item.name || item.fullName || item.applicantName || item.key || item.action || item.id;
}

function secondaryFor(item) {
  return item.email || item.role || item.status || item.applicationStatus || item.value || item.entity || "";
}

function formatValue(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  if (String(value).match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(value).toLocaleString();
  return String(value);
}

export default function ListPage({ title, endpoint, detailBase, description }) {
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data,
  });
  const items = Array.isArray(data) ? data : data?.items || [];

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) =>
      [labelFor(item), secondaryFor(item), item.entityId, item.createdAt]
        .filter(Boolean)
        .some((value) => formatValue(value).toLowerCase().includes(search)),
    );
  }, [items, query]);

  const columns = [
    {
      key: "primary",
      header: "Record",
      render: (item) => (
        <div>
          {detailBase ? (
            <Link className="font-semibold text-uum-blue hover:underline" to={`${detailBase}/${item.id}`}>
              {labelFor(item)}
            </Link>
          ) : (
            <span className="font-semibold text-uum-navy">{labelFor(item)}</span>
          )}
          <div className="mt-1 text-xs text-slate-500">{formatValue(secondaryFor(item))}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status / Role",
      render: (item) =>
        item.isActive === false ? (
          <Badge tone="red">Inactive</Badge>
        ) : item.role ? (
          <Badge tone="blue">{item.role.replaceAll("_", " ")}</Badge>
        ) : item.status ? (
          <StatusPill value={item.status} />
        ) : item.action ? (
          <Badge tone="gold">{item.action.replaceAll("_", " ")}</Badge>
        ) : (
          <Badge tone="green">Active</Badge>
        ),
    },
    {
      key: "meta",
      header: "Metadata",
      render: (item) => (
        <div className="text-xs text-slate-500">
          {item.createdAt ? <div>Created {new Date(item.createdAt).toLocaleString()}</div> : null}
          {item.updatedAt ? <div>Updated {new Date(item.updatedAt).toLocaleString()}</div> : null}
          {item.lastLoginAt ? <div>Last login {new Date(item.lastLoginAt).toLocaleString()}</div> : null}
          {item.entityId ? <div>Entity ID {item.entityId}</div> : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title={title}
        description={description || "Read-only administrative view using current backend endpoint support."}
      />
      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="field-control pl-9"
              placeholder={`Search ${title.toLowerCase()}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
      </Toolbar>
      <DataTable
        columns={columns}
        emptyDescription="No records are available from this endpoint."
        emptyTitle={`No ${title.toLowerCase()} found`}
        error={error}
        isLoading={isLoading}
        rows={rows}
      />
    </div>
  );
}
