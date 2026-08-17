import { expect, test } from "@playwright/test"
import { seedLibraryFolders } from "./support/seed"

// Seeds 3 tracks across two subfolders (FolderA: track-a1, track-a2;
// FolderB: track-b1) directly on disk, scans them into the library, then
// drives the real folder-tree "Add Tracks" UI: select all of FolderA via
// its recursive tri-state checkbox, then add one individual leaf track from
// FolderB — covering both selection paths the folder-tree feature supports.
test("add tracks to a playlist via the folder-tree Add Tracks dialog", async ({ page, request }) => {
  await seedLibraryFolders(request)

  const playlistName = `E2E Playlist ${Math.random().toString(36).slice(2, 8)}`

  await page.goto("/playlists")
  await page.getByTitle("New playlist").click()
  await page.getByPlaceholder("e.g. Morning Mix").fill(playlistName)
  await page.getByRole("button", { name: "Create", exact: true }).click()

  await expect(page.getByText("Playlist is empty")).toBeVisible()
  await page.getByRole("button", { name: "Add tracks" }).first().click()

  // Folder tree (search left empty) — both folders auto-expand on open.
  const folderARow = page.getByText("FolderA", { exact: true }).locator("xpath=ancestor::div[1]")
  const folderBRow = page.getByText("FolderB", { exact: true }).locator("xpath=ancestor::div[1]")
  await expect(folderARow).toContainText("2")
  await expect(folderBRow).toContainText("1")

  // Select all of FolderA via its tri-state checkbox: row buttons are
  // [expand, checkbox, name] in that fixed DOM order.
  await folderARow.getByRole("button").nth(1).click()
  await expect(page.getByText("2 tracks selected")).toBeVisible()

  // Add the one FolderB track individually — its whole leaf row is clickable.
  await page.getByText("track-b1", { exact: true }).click()
  await expect(page.getByText("3 tracks selected")).toBeVisible()

  await page.getByRole("button", { name: "Add (3)" }).click()

  await expect(page.getByText("3 tracks added")).toBeVisible()
  await expect(page.getByText("3 tracks", { exact: false }).first()).toBeVisible()
  for (const title of ["track-a1", "track-a2", "track-b1"]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible()
  }
})
