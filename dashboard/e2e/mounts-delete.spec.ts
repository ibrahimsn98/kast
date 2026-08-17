import { expect, test } from "@playwright/test"
import { seedMount } from "./support/seed"

test("delete a mount from the Danger tab", async ({ page, request }) => {
  const { slug, name } = await seedMount(request, "delete")

  await page.goto(`/mounts/${slug}`)
  await page.getByRole("tab", { name: "Danger" }).click()

  await expect(page.getByText("Delete Mount", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Delete", exact: true }).click()

  await expect(page.getByRole("alertdialog")).toBeVisible()
  await expect(page.getByText(`Delete ${name}?`, { exact: true })).toBeVisible()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click()

  await page.waitForURL("**/mounts")
  await expect(page.getByText(`Mount ${name} deleted`)).toBeVisible()
  await expect(page.locator(".kast-row", { hasText: name })).toHaveCount(0)
})
