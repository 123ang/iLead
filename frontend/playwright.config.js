import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});

