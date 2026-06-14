import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUploadBatchSummary,
  parseCsvBuffer,
} from "../src/services/upload.service.js";

test("parseCsvBuffer parses headers and quoted values", () => {
  const rows = parseCsvBuffer(
    Buffer.from('applicantName,email,sourceRaw\n"Jane Roe",jane@example.local,"fair, booth 2"\n'),
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].data.applicantName, "Jane Roe");
  assert.equal(rows[0].data.sourceRaw, "fair, booth 2");
});

test("buildUploadBatchSummary counts successes and failures", () => {
  const summary = buildUploadBatchSummary([
    { rowNumber: 2, status: "MATCHED", errors: [] },
    { rowNumber: 3, status: "FAILED", errors: ["missing applicant name"] },
  ]);

  assert.equal(summary.totalRows, 2);
  assert.equal(summary.successRows, 1);
  assert.equal(summary.failedRows, 1);
});

test("parseCsvBuffer rejects too many rows", () => {
  const csv = Buffer.from("applicantName\nA\nB\nC\n");

  assert.throws(
    () => parseCsvBuffer(csv, { maxRows: 2 }),
    /row limit/,
  );
});

test("parseCsvBuffer rejects too many columns", () => {
  const csv = Buffer.from("a,b,c\n1,2,3\n");

  assert.throws(
    () => parseCsvBuffer(csv, { maxColumns: 2 }),
    /column limit/,
  );
});
