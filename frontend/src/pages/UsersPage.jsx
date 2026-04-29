import React, { useMemo, useState } from "react";
import { Edit2, Plus, Search, UserX } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { PageHeader, Toolbar } from "../components/ui/PageHeader.jsx";
import { SlideOver } from "../components/ui/SlideOver.jsx";
import { api } from "../services/api.js";

const roles = ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN", "FACULTY_DEAN", "PROGRAMME_COORDINATOR", "STAFF", "REGISTRAR", "FINANCE"];
const emptyUser = { name: "", email: "", role: "STAFF", facultyId: "", temporaryPassword: "", isActive: true };

function message(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.message || fallback;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users")).data });
  const { data: faculties = [] } = useQuery({ queryKey: ["master", "faculties", "options"], queryFn: async () => (await api.get("/master/faculties")).data });

  const saveUser = useMutation({
    mutationFn: async (payload) => {
      const url = editing ? `/users/${editing.id}` : "/users";
      const method = editing ? "patch" : "post";
      return (await api[method](url, payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDrawerOpen(false);
      setEditing(null);
      setForm(emptyUser);
    },
  });

  const deactivateUser = useMutation({
    mutationFn: async (user) => (await api.delete(`/users/${user.id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeactivateTarget(null);
    },
  });

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (usersQuery.data || []).filter((user) => {
      if (!search) return true;
      return [user.name, user.email, user.role, user.faculty?.name].filter(Boolean).some((value) => value.toLowerCase().includes(search));
    });
  }, [query, usersQuery.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyUser);
    setDrawerOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "STAFF",
      facultyId: user.facultyId || "",
      temporaryPassword: "",
      isActive: user.isActive !== false,
    });
    setDrawerOpen(true);
  }

  function submit(event) {
    event.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      facultyId: form.facultyId || null,
      isActive: form.isActive,
    };
    if (form.temporaryPassword) payload.temporaryPassword = form.temporaryPassword;
    saveUser.mutate(payload);
  }

  const columns = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div>
          <div className="font-semibold text-uum-navy">{user.name}</div>
          <div className="mt-1 text-xs text-slate-500">{user.email}</div>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (user) => <Badge tone="blue">{user.role.replaceAll("_", " ")}</Badge> },
    { key: "faculty", header: "Faculty", render: (user) => <span className="text-sm text-slate-600">{user.faculty?.name || "All faculties"}</span> },
    { key: "state", header: "State", render: (user) => (user.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>) },
    {
      key: "actions",
      header: "Actions",
      cellClassName: "text-right",
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => openEdit(user)} title="Edit user" variant="secondary"><Edit2 className="h-4 w-4" /></Button>
          <Button disabled={!user.isActive} onClick={() => setDeactivateTarget(user)} title="Deactivate user" variant="secondary"><UserX className="h-4 w-4 text-red-700" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administration" title="Users" description="Create, update, and deactivate portal users without exposing password hashes." actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New User</Button>} />
      <Toolbar>
        <label className="field-label flex-1">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </label>
        <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-uum-blue">New and reset passwords are temporary; users must change them on next login.</p>
      </Toolbar>
      <DataTable columns={columns} emptyDescription="Create a user to populate this table." emptyTitle="No users found" error={usersQuery.error} isLoading={usersQuery.isLoading} rows={rows} />

      <SlideOver onClose={() => setDrawerOpen(false)} open={drawerOpen} title={`${editing ? "Edit" : "Create"} User`}>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="field-label"><span>Name</span><input className="field-control" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="field-label"><span>Email</span><input className="field-control" required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label"><span>Role</span><select className="field-control" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>
            <label className="field-label"><span>Faculty</span><select className="field-control" value={form.facultyId} onChange={(event) => setForm((current) => ({ ...current, facultyId: event.target.value }))}><option value="">All faculties</option>{faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select></label>
          </div>
          <label className="field-label"><span>{editing ? "Reset temporary password" : "Temporary password"}</span><input className="field-control" required={!editing} minLength={8} type="password" value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} /></label>
          <label className="field-label flex-row items-center gap-3"><input checked={form.isActive} className="h-4 w-4 rounded border-slate-300 text-uum-blue" type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /><span>Active account</span></label>
          {saveUser.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message(saveUser.error, "User could not be saved.")}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button disabled={saveUser.isPending} onClick={() => setDrawerOpen(false)} variant="secondary">Cancel</Button>
            <Button disabled={saveUser.isPending} type="submit">{editing ? "Save Changes" : "Create User"}</Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog busy={deactivateUser.isPending} confirmLabel="Deactivate" description={deactivateTarget ? `Deactivate "${deactivateTarget.name}" and revoke active sessions?` : ""} onCancel={() => setDeactivateTarget(null)} onConfirm={() => deactivateUser.mutate(deactivateTarget)} open={Boolean(deactivateTarget)} title="Deactivate User" />
    </div>
  );
}
