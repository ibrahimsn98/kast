import { expect, test } from "@playwright/test"

test("listeners page shows the empty state when nothing is connected", async ({ page }) => {
  await page.goto("/listeners")

  await expect(page.getByText("No active listeners", { exact: true })).toBeVisible()
  await expect(page.getByText("Listeners appear when someone is actively streaming")).toBeVisible()
})
