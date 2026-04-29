import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toCsvRow(values) {
  return values
    .map((v) => {
      const s = v == null ? "" : String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replaceAll('"', '""')}"`;
      }
      return s;
    })
    .join(",");
}

test.describe("Upload + matching (local E2E)", () => {
  test("login -> upload applications CSV -> see report -> campaign ROI loads", async ({ page }) => {
    test.setTimeout(120_000);
    // 1) Login via UI (avoid relying on token capture for API calls in the test).
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("admin@ilead.local");
    await page.locator('input[type="password"]').fill("iLead2026!");
    await page.locator('button[type="submit"]').click();

    // Wait until authenticated navigation finishes.
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 60_000 });

    // Sanity check: dashboard ROI widget is visible post-login.
    await expect(page.getByText("ROI", { exact: true })).toBeVisible({ timeout: 60_000 });

    // 2) Generate CSV matching required upload headers.
    //    Note: Upload mapping guesses based on header names, so we use the exact expected headers.
    const headers = [
      "applicantName",
      "email",
      "phone",
      "passportNumber",
      "country",
      "programmeCode",
      "studyLevel",
      "applicationStatus",
      "applicationDate",
      "offerDate",
      "enrolmentDate",
      "sourceCampaign",
      "scholarshipMyr",
      "tuitionRevenueMyr",
    ];

    const todayISO = new Date().toISOString().slice(0, 10);

    // Intentionally blank identifiers: pipeline should still create the application and render a row.
    const row = [
      "E2E Test Applicant",
      "",
      "",
      "",
      "",
      "",
      "BACHELOR",
      "APPLIED",
      todayISO,
      "", // offerDate
      "", // enrolmentDate
      "", // sourceCampaign
      0, // scholarshipMyr
      0, // tuitionRevenueMyr
    ];

    const csv = `${headers.join(",")}\n${toCsvRow(row)}\n`;
    const csvPath = path.join(__dirname, "tmp-applications.csv");
    fs.writeFileSync(csvPath, csv, "utf8");

    // 4) Upload via UI (use SPA navigation to preserve in-memory auth store).
    await page.getByRole("link", { name: "Applications" }).click();
    await expect(page.getByText("Upload CSV / XLSX")).toBeVisible({ timeout: 60_000 });
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 60_000 });
    await fileInput.setInputFiles(csvPath);

    // Wait until the mapping UI is visible (headers detected).
    await expect(page.getByText("Column mapping")).toBeVisible();

    // Submit upload.
    const uploadResPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/applications/upload") &&
        r.request().method() === "POST",
      { timeout: 60_000 },
    );
    await page.getByRole("button", { name: "Upload" }).click();
    const uploadRes = await uploadResPromise;
    expect(uploadRes.status(), `upload failed with status ${uploadRes.status()}`).toBeGreaterThanOrEqual(200);
    const uploadText = await uploadRes.text();
    let uploadJson = null;
    try {
      uploadJson = JSON.parse(uploadText);
    } catch {
      uploadJson = null;
    }
    if (!uploadJson?.rows?.length) {
      throw new Error(
        `Upload response missing rows (status=${uploadRes.status()} url=${uploadRes.url()}): ${uploadText.slice(0, 300)}`,
      );
    }

    // Report renders (avoid strict-mode collisions with the "Rollback Batch" button).
    await expect(page.locator("p", { hasText: /Batch/i }).first()).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 30_000 });

    // Navigate back to dashboard and ensure ROI widget still exists (SPA navigation).
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByText("ROI", { exact: true })).toBeVisible({ timeout: 60_000 });
  });
});

