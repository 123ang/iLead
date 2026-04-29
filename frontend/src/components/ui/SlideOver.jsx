import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button.jsx";

export function SlideOver({ open, title, description, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop (click to close) */}
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-uum-navy/45"
        onClick={onClose}
        type="button"
      />

      {/* Centered modal container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <aside className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl max-h-[85vh]">
          <header className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-uum-navy">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                ) : null}
              </div>
              <Button aria-label="Close" className="px-2" onClick={onClose} variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer ? (
            <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</footer>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
