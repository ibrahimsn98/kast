import { expect, test } from "@playwright/test"

// Pure UI flow — no seeding. The "New Mount" dialog is a plain overlay
// <div>, not a Radix Dialog, so it has no role="dialog" to key off of;
// selectors below target visible text/labels instead.
test("create a mount and see it in the list and detail view", async ({ page }) => {
  const slug = `e2e-create-${Math.random().toString(36).slice(2, 8)}`

  await page.goto("/mounts")
  await page.getByRole("button", { name: "New Mount" }).click()

  await page.getByPlaceholder("/radio1").fill(slug)
  await page.getByPlaceholder("min 8 characters").fill("e2e-source-password")
  await page.getByRole("button", { name: "Create" }).click()

  const row = page.locator(".kast-row", { hasText: `/${slug}` })
  await expect(row).toBeVisible()

  await row.click()
  await page.waitForURL(`**/mounts/${slug}`)

  await expect(page.getByRole("heading", { name: `/${slug}` })).toBeVisible()
  await expect(page.getByText("idle", { exact: true })).toBeVisible()
})
