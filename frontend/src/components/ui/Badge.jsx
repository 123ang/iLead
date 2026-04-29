import React from "react";

const toneMap = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  gold: "border-yellow-200 bg-yellow-50 text-yellow-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  red: "border-red-200 bg-red-50 text-red-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export function Badge({ children, tone = "slate", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${toneMap[tone] || toneMap.slate} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ value }) {
  const key = String(value || "").toUpperCase();
  const tone = {
    HOT: "red",
    WARM: "gold",
    COLD: "blue",
    NEW: "blue",
    CONTACTED: "gold",
    INTERESTED: "green",
    APPLIED: "green",
    OFFERED: "green",
    ENROLLED: "green",
    LOST: "red",
    DUPLICATE: "red",
    PLANNED: "blue",
    ONGOING: "gold",
    COMPLETED: "green",
    CANCELLED: "red",
    PENDING: "gold",
    MERGED: "green",
  }[key] || "slate";

  return <Badge tone={tone}>{String(value || "n/a").replaceAll("_", " ")}</Badge>;
}
