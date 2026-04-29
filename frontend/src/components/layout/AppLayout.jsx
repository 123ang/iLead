import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  Database,
  FileUp,
  Flag,
  Gauge,
  History,
  LogOut,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store.js";
import { api } from "../../services/api.js";

/** [path, label, icon, optional predicate(role) => boolean] */
const NAV = [
  ["/", "Dashboard", Gauge, null],
  ["/campaigns", "Campaigns", Flag, null],
  ["/leads", "Leads", Users, null],
  ["/follow-ups", "Follow-ups", MessageSquareWarning, null],
  [
    "/duplicates",
    "Duplicates",
    ShieldCheck,
    (r) =>
      ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN", "FACULTY_DEAN"].includes(r),
  ],
  ["/applications/upload", "Applications", FileUp, null],
  ["/reports", "Reports", BarChart3, null],
  ["/master-data", "Master Data", Database, (r) => ["SUPER_ADMIN", "CIAC_ADMIN"].includes(r)],
  ["/users", "Users", ClipboardList, (r) => r === "SUPER_ADMIN"],
  ["/settings", "Settings", Settings, null],
  [
    "/audit-logs",
    "Audit Logs",
    History,
    (r) => ["SUPER_ADMIN", "CIAC_ADMIN"].includes(r),
  ],
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.user?.role ?? "");
  const clearSession = useAuthStore((s) => s.logout);

  const visible = NAV.filter(([, , , pred]) =>
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
    <div className="min-h-screen bg-[#f4f7fb] lg:flex">
      <aside className="flex flex-col bg-uum-navy text-white lg:fixed lg:inset-y-0 lg:w-72">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-uum-gold/50 bg-white/10 text-lg font-black text-uum-gold">
              iL
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">iLead</div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-100">
                Executive Portal
              </p>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-4">
          {visible.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-uum-navy shadow-sm"
                    : "text-blue-50 hover:bg-white/10"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden p-4 lg:block">
          <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-blue-100">
            <div className="font-semibold text-white">Universiti Utara Malaysia</div>
            <div className="mt-1">Recruitment, ROI, and enrolment oversight</div>
          </div>
        </div>
      </aside>
      <main className="flex-1 lg:ml-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-uum-gold">
              University Executive Portal
            </p>
            <h1 className="mt-1 text-lg font-bold text-uum-navy">
              International Recruitment Management
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-semibold text-slate-800">{user?.name || "Session"}</div>
              <div className="text-slate-500">{user?.role || "Unknown role"}</div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:border-uum-blue/40 hover:text-uum-blue"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
