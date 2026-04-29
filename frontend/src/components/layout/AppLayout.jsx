import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store.js";
import { api } from "../../services/api.js";

/** [, , optional predicate(role)→boolean] */
const NAV = [
  ["/", "Dashboard", null],
  ["/campaigns", "Campaigns", null],
  ["/leads", "Leads", null],
  [
    "/duplicates",
    "Duplicates",
    (r) =>
      ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN", "FACULTY_DEAN"].includes(r),
  ],
  ["/applications/upload", "Applications", null],
  ["/reports", "Reports", null],
  ["/master-data", "Master Data", (r) => ["SUPER_ADMIN", "CIAC_ADMIN"].includes(r)],
  ["/users", "Users", (r) => r === "SUPER_ADMIN"],
  ["/settings", "Settings", null],
  [
    "/audit-logs",
    "Audit Logs",
    (r) => ["SUPER_ADMIN", "CIAC_ADMIN"].includes(r),
  ],
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.user?.role ?? "");
  const clearSession = useAuthStore((s) => s.logout);

  const visible = NAV.filter(([, , pred]) =>
    typeof pred !== "function" ? true : Boolean(pred(role)),
  );

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear local session even if the refresh cookie is already invalid.
    } finally {
      clearSession();
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-uum-blue text-white lg:w-72 p-5">
        <div className="text-2xl font-bold">iLead</div>
        <p className="text-sm text-blue-100">UUM Recruitment ROI</p>
        <nav className="mt-8 grid gap-1">
          {visible.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm ${
                  isActive
                    ? "bg-white text-uum-blue"
                    : "text-blue-50 hover:bg-white/10"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              International Lead Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Campaign → Lead → Follow-up → Application → Enrolment → ROI
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-medium text-slate-700">{user?.name || "Session"}</div>
              <div className="text-slate-500">{user?.role || "Unknown role"}</div>
            </div>
            <button
              className="rounded border border-slate-300 px-3 py-2 text-slate-700"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
