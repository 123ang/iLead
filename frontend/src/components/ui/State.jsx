import React from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading records..." }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title = "No records found", description = "Adjust filters or create a new record." }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
      <Inbox className="h-8 w-8 text-slate-400" />
      <p className="mt-2 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorState({ title = "Could not load records", message }) {
  return (
    <div className="flex min-h-24 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <p className="font-semibold">{title}</p>
        {message ? <p className="mt-1 text-red-700">{message}</p> : null}
      </div>
    </div>
  );
}
