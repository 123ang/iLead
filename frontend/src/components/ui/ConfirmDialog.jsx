import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button.jsx";

export function ConfirmDialog({
  open,
  title = "Confirm action",
  description,
  confirmLabel = "Confirm",
  busy,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-uum-navy/50 p-4">
      <section className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-uum-navy">{title}</h2>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={busy} onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button disabled={busy} onClick={onConfirm} variant="danger">
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
