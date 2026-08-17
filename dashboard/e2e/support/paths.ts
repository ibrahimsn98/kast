import os from "node:os"
import path from "node:path"

// Shared by playwright.config.ts (to start/reset the backend) and
// e2e/support/seed.ts (to write library fixtures directly to disk).
// The backend is always launched with this directory as its CWD, so its
// default-relative paths ("./data/kast.db", "./data/music") resolve here.
export const E2E_DATA_DIR = path.join(os.tmpdir(), "kast-e2e-data")
export const E2E_BIN_PATH = path.join(os.tmpdir(), "kast-e2e-bin")

export const E2E_BACKEND_PORT = 8081
export const E2E_FRONTEND_PORT = 3100

export const E2E_BASE_URL = `http://localhost:${E2E_FRONTEND_PORT}`
export const E2E_BACKEND_URL = `http://localhost:${E2E_BACKEND_PORT}`
