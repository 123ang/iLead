import { UploadStatus, UploadType } from "@prisma/client";

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map((value) => value.trim());
}

export function parseCsvBuffer(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return { rowNumber: index + 2, data: row };
  });
}

export function buildUploadBatchSummary(rows) {
  const successRows = rows.filter((row) => row.status !== "FAILED").length;
  const failedRows = rows.filter((row) => row.status === "FAILED").length;
  return {
    totalRows: rows.length,
    successRows,
    failedRows,
    status: failedRows > 0 ? UploadStatus.FAILED : UploadStatus.COMPLETED,
    errorLog: rows
      .filter((row) => Array.isArray(row.errors) && row.errors.length)
      .map((row) => ({
        rowNumber: row.rowNumber,
        errors: row.errors,
      })),
  };
}

export function assertUploadType(value) {
  if (!Object.values(UploadType).includes(value)) {
    throw new Error(`Unsupported upload type '${value}'.`);
  }
  return value;
}

