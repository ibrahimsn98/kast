import { expect, test } from "@playwright/test"
import { seedMount, seedPlaylist } from "./support/seed"

test("jingle cadence settings save and persist across reload", async ({ page, request }) => {
  const { slug } = await seedMount(request, "jingle")
  const { name: playlistName } = await seedPlaylist(request, { mode: "sequential", trackPaths: [] })

  await page.goto(`/mounts/${slug}`)
  await page.getByRole("tab", { name: "AutoDJ" }).click()

  // Labels aren't wired to their controls (no htmlFor/id) — target the
  // adjacent control via the label's following sibling, same approach used
  // on the login page's unlabeled inputs.
  const sourcePlaylistTrigger = page
    .getByText("Source playlist", { exact: true })
    .locator("xpath=following-sibling::button[1]")
  const everyTracksInput = page
    .getByText("Every N tracks", { exact: true })
    .locator("xpath=following-sibling::input[1]")

  await sourcePlaylistTrigger.click()
  await page.getByRole("option", { name: playlistName }).click()
  await everyTracksInput.fill("5")

  await page.getByRole("button", { name: "Save jingle settings" }).click()
  await expect(page.getByText("Jingle settings saved")).toBeVisible()

  await page.reload()
  await page.getByRole("tab", { name: "AutoDJ" }).click()
  await expect(sourcePlaylistTrigger).toContainText(playlistName)
  await expect(everyTracksInput).toHaveValue("5")
})
