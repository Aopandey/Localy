import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  projects: [
    { name: "mock", testMatch: "demo.spec.ts" },
    { name: "supabase", testMatch: "supabase.spec.ts" },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: "chrome" },
    trace: "retain-on-failure",
  },
});
