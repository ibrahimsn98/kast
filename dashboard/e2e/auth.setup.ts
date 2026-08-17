import { test as setup } from "@playwright/test"
import { E2E_ADMIN } from "./support/constants"

const authFile = "playwright/.auth/admin.json"

// By the time this runs, auth-flow.spec.ts (project "setup-ui") has already
// claimed the one-shot admin setup via the real UI. Log in via the API here
// — faster and just as valid for a fixture, since the UI login path is
// already covered by that spec.
setup("authenticate as e2e admin", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: { username: E2E_ADMIN.username, password: E2E_ADMIN.password },
  })
  if (!res.ok()) {
    throw new Error(`auth.setup: login failed: ${res.status()} ${await res.text()}`)
  }
  // Persist cookies collected by this APIRequestContext for reuse by the
  // "chromium" project's storageState.
  await request.storageState({ path: authFile })
})
