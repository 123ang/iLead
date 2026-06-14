import { UploadStatus, UploadType } from "@prisma/client";
import { AppError } from "../utils/http.js";

export const MAX_UPLOAD_ROWS = 5000;
export const MAX_UPLOAD_COLUMNS = 100;
export const APPLICATION_UPLOAD_FILE_LIMIT_BYTES = 5 * 1024 * 1024;

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

export function parseCsvBuffer(
  buffer,
  { maxRows = MAX_UPLOAD_ROWS, maxColumns = MAX_UPLOAD_COLUMNS } = {},
) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  if (headers.length > maxColumns) {
    throw new AppError(400, `CSV upload exceeds the ${maxColumns} column limit.`);
  }
  if (lines.length - 1 > maxRows) {
    throw new AppError(400, `CSV upload exceeds the ${maxRows} row limit.`);
  }

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.length > maxColumns) {
      throw new AppError(
        400,
        `CSV row ${index + 2} exceeds the ${maxColumns} column limit.`,
      );
    }
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
