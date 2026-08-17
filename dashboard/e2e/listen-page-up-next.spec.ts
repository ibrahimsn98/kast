import type { APIRequestContext } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { seedMount, seedPlaylist, seedTracks, startAutoDJ, stopAutoDJ } from "./support/seed"

// Regression coverage for the "Up Next shuffle — invert mode check, default
// to shuffle unless explicitly sequential" fix: the public listen page's Up
// Next panel shows a "Shuffle" badge for any playlist mode other than the
// literal "sequential", and hides it (tracks in original order) only when
// the mode is exactly "sequential".
//
// The public playlist endpoint only returns data while an AutoDJ session is
// live (GET /public/:mount/playlist short-circuits on no session), so each
// case spins up a real AutoDJ session — stopped again in the finally block
// so no ffmpeg process lingers past the test.

async function setupSession(request: APIRequestContext, mode: "shuffle" | "sequential") {
  const tracks = await seedTracks(request, {
    folder: `up-next-${mode}-${Math.random().toString(36).slice(2, 8)}`,
    titles: ["up-next-track-1", "up-next-track-2", "up-next-track-3"],
  })
  const playlist = await seedPlaylist(request, { mode, trackPaths: tracks.map((t) => t.path) })
  const { slug } = await seedMount(request, "upnext")
  await startAutoDJ(request, slug, playlist.id, mode)
  return slug
}

test("shuffle mode shows the Shuffle badge on Up Next", async ({ page, request }) => {
  const slug = await setupSession(request, "shuffle")
  try {
    await page.goto(`/listen/${slug}`)
    await expect(page.getByText("Up Next", { exact: true })).toBeVisible()
    await expect(page.getByText("Shuffle", { exact: true })).toBeVisible()
  } finally {
    await stopAutoDJ(request, slug)
  }
})

test("sequential mode hides the Shuffle badge and keeps track order", async ({ page, request }) => {
  const slug = await setupSession(request, "sequential")
  try {
    await page.goto(`/listen/${slug}`)
    await expect(page.getByText("Up Next", { exact: true })).toBeVisible()
    await expect(page.getByText("Shuffle", { exact: true })).not.toBeVisible()

    // Scope to the Up Next <section> itself — the now-playing marquee
    // ticker can coincidentally show the same track title elsewhere on the
    // page (plus an aria-hidden measurement-probe copy of its own text),
    // which would otherwise make this match ambiguous.
    const upNextSection = page.locator("section", { has: page.getByText("Up Next", { exact: true }) })
    await expect(upNextSection.getByText("up-next-track-1", { exact: true }).first()).toBeVisible()
  } finally {
    await stopAutoDJ(request, slug)
  }
})
