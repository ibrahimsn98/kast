import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"
import {
  E2E_BACKEND_URL,
  E2E_BASE_URL,
  E2E_BIN_PATH,
  E2E_DATA_DIR,
  E2E_FRONTEND_PORT,
} from "./e2e/support/paths"

const dashboardDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dashboardDir, "..")
const serverDir = path.join(repoRoot, "server")
const e2eToml = path.join(serverDir, "kast.e2e.toml")

// Build the backend once, reset its ephemeral data dir, then run it with
// that dir as CWD — the Go binary hardcodes "./data" for its SQLite DB and
// (by default) its library scan dir, so redirecting CWD is how we isolate
// test data from a developer's real server/data/ without touching Go code.
const backendCommand = [
  `go build -o "${E2E_BIN_PATH}" ./cmd/kast`,
  `rm -rf "${E2E_DATA_DIR}"`,
  // The binary never creates its own "./data" dir before opening the SQLite
  // DB there (server/cmd/kast/main.go doesn't MkdirAll it) — pre-create it
  // ourselves, same as a real first-time setup would need to.
  `mkdir -p "${E2E_DATA_DIR}/data"`,
  `cd "${E2E_DATA_DIR}" && "${E2E_BIN_PATH}" -config "${e2eToml}"`,
].join(" && ")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // junit output feeds the Qualflare CI reporting step; kept alongside html
  // so a plain local run always produces the file the workflow expects.
  reporter: [["html"], ["junit", { outputFile: "e2e-results.xml" }]],

  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
  },

  webServer: [
    {
      command: backendCommand,
      cwd: serverDir,
      // Health-check against a public, always-200 endpoint. /api/status is
      // bearer-gated and would 401, which Playwright treats as "not ready".
      url: `${E2E_BACKEND_URL}/api/auth/setup`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `npx next dev --turbopack -p ${E2E_FRONTEND_PORT}`,
      cwd: dashboardDir,
      env: { ...process.env, API_URL: E2E_BACKEND_URL },
      url: `${E2E_BASE_URL}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],

  projects: [
    {
      name: "setup-ui",
      testMatch: /auth-flow\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["setup-ui"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: /(auth-flow|auth\.setup)\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
    },
  ],
})
