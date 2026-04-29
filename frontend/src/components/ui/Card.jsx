import React from "react";

export function Card({ title, subtitle, children, className = "", actions }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-executive ${className}`}
    >
      {title || actions ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="font-bold text-uum-navy">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
