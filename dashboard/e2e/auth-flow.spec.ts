import { expect, test } from "@playwright/test"
import { E2E_ADMIN } from "./support/constants"

// Runs in the "setup-ui" project with no storageState — the only test
// allowed to hit /login while the backend might still be in first-run
// "setup" mode. On a fresh backend this exercises "Create admin account";
// on a reused local backend (a second `npm run test:e2e` run) the account
// already exists, so it exercises "Sign in" instead — either way it's a
// real UI auth flow ending in a working dashboard session.
test("first-run setup or sign-in reaches the dashboard", async ({ page }) => {
  await page.goto("/login")

  const setupHeading = page.getByRole("heading", { name: "Create admin account" })
  const signInHeading = page.getByRole("heading", { name: "Sign in" })
  await expect(setupHeading.or(signInHeading)).toBeVisible()

  const isSetup = await setupHeading.isVisible()

  // The form's <label> elements aren't wired to their inputs (no htmlFor/id,
  // no wrapping), so getByLabel can't resolve them — target by input type
  // and position instead.
  const passwordInputs = page.locator('input[type="password"]')
  await page.locator('input[type="text"]').fill(E2E_ADMIN.username)
  await passwordInputs.nth(0).fill(E2E_ADMIN.password)

  if (isSetup) {
    await passwordInputs.nth(1).fill(E2E_ADMIN.password)
    await page.getByRole("button", { name: "Create account & sign in" }).click()
  } else {
    await page.getByRole("button", { name: "Sign in" }).click()
  }

  await page.waitForURL("**/dashboard")
  await expect(page.getByText(E2E_ADMIN.username, { exact: true })).toBeVisible()
})
