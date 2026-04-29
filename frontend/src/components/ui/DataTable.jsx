import React from "react";
import { EmptyState, ErrorState, LoadingState } from "./State.jsx";

export function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="align-top transition hover:bg-uum-mist/50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.cellClassName || ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
