import { expect, test } from "@playwright/test"
import { seedMount } from "./support/seed"

// The public /listen/[mount] page for a freshly created (never-started)
// mount. Deliberately avoids anything requiring a live HLS stream — no
// ffmpeg/source connection involved, just the offline UI state.
test("public listen page renders offline state for an idle mount", async ({ page, request }) => {
  const { slug, name } = await seedMount(request, "listen")

  await page.goto(`/listen/${slug}`)

  await expect(page.getByText("Offline", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("On Air", { exact: true })).not.toBeVisible()

  // The page renders two "Play" buttons (an AlbumArt hover overlay and the
  // main transport control) — only the transport control is disabled while
  // offline, so filter on that to get a unique match.
  const playButton = page.getByRole("button", { name: "Play", disabled: true })
  await expect(playButton).toBeVisible()

  // Station name falls back to a title-cased version of the slug when no
  // player_station_name is set (see slugToName in listen/[mount]/page.tsx).
  const expectedName = name
    .replace(/^\//, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
  await expect(page.getByText(expectedName, { exact: false }).first()).toBeVisible()
})
