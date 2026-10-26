import { defineConfig } from "playwright/test";

const testPort = process.env.PLAYWRIGHT_PORT || "4322";
const testUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/**/*.spec.ts"],
  use: {
    baseURL: testUrl,
  },
  webServer: {
    // Keep Astro 7's agent-aware dev server attached so Playwright owns cleanup.
    command: `npm run dev -- --ignore-lock --host 127.0.0.1 --port ${testPort}`,
    url: testUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
