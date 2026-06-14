function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePagination(
  query,
  { defaultPageSize = 50, maxPageSize = 100 } = {},
) {
  const page = parsePositiveInt(query?.page, 1);
  const requestedPageSize = parsePositiveInt(query?.pageSize, defaultPageSize);
  const pageSize = Math.min(maxPageSize, requestedPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}
