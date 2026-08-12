#!/usr/bin/env node
// Screenshots the running preview server (ui=0 for a clean render, theme via
// CLI arg) to screenshot.png at the repo root. Used by the update-screenshot
// workflow to keep a static image in sync for embedding in READMEs.
//
// Usage: node scripts/screenshot.mjs [theme] [port]

import { chromium } from "playwright"

const theme = process.argv[2] ?? "singapore"
const port = process.argv[3] ?? "4173"
const url = `http://localhost:${port}/?theme=${theme}&ui=0`

const browser = await chromium.launch({
  // CI has no GPU, so WebGL runs on SwiftShader. Without this the page falls
  // back to a software path that refuses the context outright.
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
})
// Render at 2x and let the PNG carry the supersampled result: with the whole
// scene going through AO + bloom on a software rasterizer, 1x edges come out
// noticeably mushy.
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
})
await page.goto(url, { waitUntil: "networkidle" })
// Deliberately generous: the first frames include env-map baking, shadow map
// generation, AO, and a full reflection pass over the whole scene, and on
// SwiftShader a single frame can take seconds.
await page.waitForTimeout(45000)
await page.screenshot({ path: "screenshot.png", timeout: 240000 })
await browser.close()
console.log(`wrote screenshot.png (theme=${theme}, 2560x1440)`)
