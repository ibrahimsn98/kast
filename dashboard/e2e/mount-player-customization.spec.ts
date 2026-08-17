import { expect, test } from "@playwright/test"
import { seedMount } from "./support/seed"

test("custom station name saved on the Player tab shows up on the public listen page", async ({ page, request }) => {
  const { slug } = await seedMount(request, "player")
  const stationName = `E2E Station ${Math.random().toString(36).slice(2, 8)}`

  await page.goto(`/mounts/${slug}`)
  await page.getByRole("tab", { name: "Player" }).click()

  const stationNameInput = page
    .getByText("Display Name", { exact: true })
    .locator("xpath=following-sibling::input[1]")
  await stationNameInput.fill(stationName)
  await page.getByRole("button", { name: "Save Player Settings" }).click()
  await expect(page.getByText("Player settings saved")).toBeVisible()

  await page.goto(`/listen/${slug}`)
  await expect(page.getByText(stationName, { exact: true }).first()).toBeVisible()
})
