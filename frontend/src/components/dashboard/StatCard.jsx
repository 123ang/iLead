import React from "react";

export function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-executive">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-uum-navy">{value ?? 0}</p>
      <div className="mt-3 h-1 w-12 rounded-full bg-uum-gold" />
      {helper ? (
        <p className="mt-1 text-xs text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}
