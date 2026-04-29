import { UploadStatus, UploadType } from "@prisma/client";
import * as XLSX from "xlsx";

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

export function parseXlsxBuffer(buffer) {
  // Reads the first worksheet and converts it into the same header→row format as CSV parsing.
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const headers = rows[0]
    .map((h) => String(h ?? "").trim())
    .filter((h) => h.length > 0);

  if (headers.length === 0) return [];

  return rows.slice(1).map((cells, idx) => {
    const rowData = {};
    headers.forEach((header, i) => {
      rowData[header] = cells?.[i] ?? "";
    });
    return { rowNumber: idx + 2, data: rowData };
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

