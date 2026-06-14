import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination } from "../src/utils/pagination.js";

test("parsePagination clamps pageSize and keeps positive page values", () => {
  assert.deepEqual(parsePagination({ page: "3", pageSize: "999" }), {
    page: 3,
    pageSize: 100,
    skip: 200,
  });
});

test("parsePagination falls back for invalid values", () => {
  assert.deepEqual(parsePagination({ page: "-2", pageSize: "abc" }), {
    page: 1,
    pageSize: 50,
    skip: 0,
  });
});
