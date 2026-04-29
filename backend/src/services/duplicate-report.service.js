export function buildDuplicateReport(candidates) {
  const summary = {
    total: candidates.length,
    pending: 0,
    merged: 0,
    notDuplicate: 0,
    ignored: 0,
    exact: 0,
    possible: 0,
    byReason: {},
  };

  for (const candidate of candidates) {
    const status = String(candidate.status || "").toUpperCase();
    if (status === "PENDING") summary.pending += 1;
    if (status === "MERGED") summary.merged += 1;
    if (status === "NOT_DUPLICATE") summary.notDuplicate += 1;
    if (status === "IGNORED") summary.ignored += 1;

    const reason = String(candidate.reason || "unknown");
    summary.byReason[reason] = (summary.byReason[reason] || 0) + 1;
    if (reason.startsWith("exact_")) {
      summary.exact += 1;
    } else {
      summary.possible += 1;
    }
  }

  return summary;
}
