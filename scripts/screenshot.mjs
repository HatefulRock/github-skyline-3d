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

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(url, { waitUntil: "networkidle" })
await page.waitForTimeout(1200) // let the scene settle/render a frame
await page.screenshot({ path: "screenshot.png" })
await browser.close()
console.log(`wrote screenshot.png (theme=${theme})`)
