#!/usr/bin/env node
// Renders the koi's loop as frames of the whole skyline, for an animated README
// image. The scene's clock is pinned for every frame (window.__koi.setTime), so
// a slow software renderer still captures exactly the pose each frame asks for,
// and the last frame runs seamlessly into the first.
//
// Usage: node scripts/animate.mjs [theme] [port] [fps] [outDir]
// Then:  python3 scripts/encode-animation.py <outDir> skyline.webp <fps>

import { mkdir, rm } from "node:fs/promises"
import { chromium } from "playwright"

const theme = process.argv[2] ?? "singapore"
const port = process.argv[3] ?? "4173"
const fps = Number(process.argv[4] ?? "10")
const outDir = process.argv[5] ?? "frames"
const url = `http://localhost:${port}/?theme=${theme}&ui=0`

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
})
// 1x: the README shows it well under 1280 wide, and every frame is a full
// render on a software rasterizer.
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(url, { waitUntil: "networkidle" })
// Same warm-up as screenshot.mjs: env-map baking, shadows and AO on SwiftShader.
await page.waitForTimeout(45000)

const loopSeconds = await page.evaluate(() => window.__koi?.loopSeconds ?? null)
if (!loopSeconds) {
  console.error("No koi in the scene (public/koi/sheet.json missing?); nothing to animate.")
  await browser.close()
  process.exit(1)
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })
const frames = Math.round(loopSeconds * fps)
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.__koi.setTime(t), i / fps)
  // Two animation frames: one to apply the time, one to finish rendering it.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )
  await page.screenshot({ path: `${outDir}/${String(i).padStart(4, "0")}.png`, timeout: 120000 })
}
await browser.close()
console.log(`wrote ${frames} frames to ${outDir} (theme=${theme}, ${loopSeconds.toFixed(1)}s at ${fps} fps)`)
