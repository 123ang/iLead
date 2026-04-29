import React, { useMemo, useState } from "react";
import { Edit2, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";
import { useAuthStore } from "../store/auth.store.js";

function stringify(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function parseValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const role = useAuthStore((state) => state.user?.role ?? "");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/settings")).data,
  });

  const saveSetting = useMutation({
    mutationFn: async () => (await api.patch(`/settings/${editing.key}`, { value: parseValue(value) })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setEditing(null);
      setValue("");
    },
  });

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (settingsQuery.data || []).filter((setting) => {
      if (!search) return true;
      return [setting.key, stringify(setting.value), setting.description]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(search));
    });
  }, [query, settingsQuery.data]);

  function openEdit(setting) {
    setEditing(setting);
    setValue(stringify(setting.value));
  }

  const columns = [
    {
      key: "key",
      header: "Setting",
      render: (setting) => (
        <div>
          <div className="font-semibold text-uum-navy">{setting.key}</div>
          <div className="mt-1 text-xs text-slate-500">{setting.description || "System setting"}</div>
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (setting) => <code className="text-xs text-slate-700">{stringify(setting.value)}</code>,
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (setting) => <span className="text-sm text-slate-600">{new Date(setting.updatedAt).toLocaleString()}</span>,
    },
    {
      key: "actions",
      header: "",
      cellClassName: "text-right",
      render: (setting) => (
        <Button
          className="px-2.5"
          disabled={role !== "SUPER_ADMIN"}
          onClick={() => openEdit(setting)}
          title={role === "SUPER_ADMIN" ? "Edit setting" : "Only SUPER_ADMIN can edit settings."}
          variant="secondary"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Review and update backend-supported system settings. Values are saved as JSON where valid."
      />
      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </label>
      </Toolbar>
      <DataTable columns={columns} error={settingsQuery.error} isLoading={settingsQuery.isLoading} rows={rows} />
      <SlideOver onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.key || "Edit setting"}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveSetting.mutate();
          }}
        >
          <label className="field-label">
            <span>Value</span>
            <textarea className="field-control font-mono" rows={10} value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          {saveSetting.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveSetting.error.response?.data?.message || "Setting could not be saved."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={saveSetting.isPending} onClick={() => setEditing(null)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={saveSetting.isPending} type="submit">
              Save Setting
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
