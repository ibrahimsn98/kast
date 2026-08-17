import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { APIRequestContext } from "@playwright/test"
import { E2E_DATA_DIR } from "./paths"

// package.json has "type": "module", so this file runs as ESM — use
// import.meta.url instead of __dirname to resolve the fixture path.
const dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_TRACK = path.join(dirname, "..", "fixtures", "e2e-fixture-track.mp3")

function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

// ── Mounts ──

export async function seedMount(request: APIRequestContext, namePrefix = "e2e") {
  const name = `/${namePrefix}-${uniqueSuffix()}`
  const res = await request.post("/api/mounts", {
    data: {
      name,
      source_password: "e2e-source-password",
      bitrate: "128k",
      codec: "AAC",
      protocol: "HLS",
      description: "",
      genre: "",
    },
  })
  if (!res.ok()) {
    throw new Error(`seedMount failed: ${res.status()} ${await res.text()}`)
  }
  const mount = await res.json()
  return { slug: name.replace(/^\//, ""), name, mount }
}

// ── Library (folder-tree fixtures) ──
//
// POST /api/library/upload always saves flat (server strips any directory
// component from the filename), so it cannot produce subfolders. To exercise
// the recursive folder-tree UI we write files straight onto disk, inside the
// backend's default scan dir ("./data/music", resolved relative to its CWD —
// which Playwright always points at E2E_DATA_DIR), then trigger a scan.
const musicDir = () => path.join(E2E_DATA_DIR, "data", "music")

export type SeededTrack = { title: string; folder: "FolderA" | "FolderB" }

export const FOLDER_FIXTURE_TRACKS: SeededTrack[] = [
  { title: "track-a1", folder: "FolderA" },
  { title: "track-a2", folder: "FolderA" },
  { title: "track-b1", folder: "FolderB" },
]

export async function seedLibraryFolders(request: APIRequestContext) {
  const fixtureBytes = fs.readFileSync(FIXTURE_TRACK)

  for (const track of FOLDER_FIXTURE_TRACKS) {
    const dir = path.join(musicDir(), track.folder)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `${track.title}.mp3`), fixtureBytes)
  }

  const scanRes = await request.post("/api/library/scan")
  if (!scanRes.ok()) {
    throw new Error(`library scan trigger failed: ${scanRes.status()} ${await scanRes.text()}`)
  }

  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const listRes = await request.get("/api/library")
    if (listRes.ok()) {
      const tracks: Array<{ title: string }> = await listRes.json()
      const titles = new Set(tracks.map((t) => t.title))
      if (FOLDER_FIXTURE_TRACKS.every((t) => titles.has(t.title))) return
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error("seedLibraryFolders: timed out waiting for scanned tracks to appear")
}

// Generalized variant of seedLibraryFolders: writes fixture copies under a
// caller-chosen (unique) folder name and returns the scanned {title, path}
// for each, in the order requested — for tests that just need N playable
// tracks in the library, not a specific folder-tree shape.
export async function seedTracks(request: APIRequestContext, opts: { folder: string; titles: string[] }) {
  const fixtureBytes = fs.readFileSync(FIXTURE_TRACK)
  const dir = path.join(musicDir(), opts.folder)
  fs.mkdirSync(dir, { recursive: true })
  for (const title of opts.titles) {
    fs.writeFileSync(path.join(dir, `${title}.mp3`), fixtureBytes)
  }

  const scanRes = await request.post("/api/library/scan")
  if (!scanRes.ok()) {
    throw new Error(`library scan trigger failed: ${scanRes.status()} ${await scanRes.text()}`)
  }

  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const listRes = await request.get("/api/library")
    if (listRes.ok()) {
      const tracks: Array<{ title: string; path: string }> = await listRes.json()
      const found = opts.titles.map((title) => tracks.find((t) => t.title === title))
      if (found.every(Boolean)) return found as Array<{ title: string; path: string }>
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error("seedTracks: timed out waiting for scanned tracks to appear")
}

// ── Playlists ──

export async function seedPlaylist(
  request: APIRequestContext,
  opts: { mode: "shuffle" | "sequential"; trackPaths: string[]; name?: string },
) {
  const name = opts.name ?? `E2E Playlist ${uniqueSuffix()}`
  const res = await request.post("/api/playlists", {
    data: { name, mode: opts.mode, crossfade_ms: 0, track_paths: opts.trackPaths },
  })
  if (!res.ok()) {
    throw new Error(`seedPlaylist failed: ${res.status()} ${await res.text()}`)
  }
  const playlist = await res.json()
  return { id: playlist.id as string, name, playlist }
}

// ── AutoDJ ──
// slug is the mount name WITHOUT the leading "/" (matches the :name URL
// param — the handler prepends "/" itself), same convention seedMount returns.

export async function startAutoDJ(
  request: APIRequestContext,
  slug: string,
  playlistId: string,
  mode: "shuffle" | "sequential" = "sequential",
) {
  const res = await request.post(`/api/mounts/${slug}/autodj`, {
    data: { playlist_id: playlistId, mode },
  })
  if (!res.ok()) {
    throw new Error(`startAutoDJ failed: ${res.status()} ${await res.text()}`)
  }
}

export async function stopAutoDJ(request: APIRequestContext, slug: string) {
  await request.delete(`/api/mounts/${slug}/autodj`).catch(() => {})
}
