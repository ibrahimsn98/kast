import { expect, test } from "@playwright/test"
import { seedMount } from "./support/seed"

test("RTC listen page shows offline state and links back to the standard player", async ({ page, request }) => {
  const { slug } = await seedMount(request, "rtc")

  await page.goto(`/listen/${slug}/rtc`)
  await expect(page.getByText("Offline", { exact: true }).first()).toBeVisible()

  await page.getByRole("link", { name: "Standard player" }).click()
  await page.waitForURL(`**/listen/${slug}`)
  await expect(page.getByText("Offline", { exact: true }).first()).toBeVisible()
})
