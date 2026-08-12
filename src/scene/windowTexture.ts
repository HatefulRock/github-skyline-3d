import { CanvasTexture, LinearFilter, RepeatWrapping } from "three"

/** One stacked cube is one storey, so the texture holds a single row of lit
 *  windows. Stacking cubes then tiles it vertically into a continuous facade.
 *
 *  Used as an emissiveMap: black emits nothing, bright pixels glow. That way
 *  only the windows light up, and the wall colour still comes from the
 *  per-instance colour. */
export function makeWindowTexture(): CanvasTexture {
  const W = 128
  const H = 128
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, W, H)

  const cols = 4
  const marginX = W * 0.14
  const usableW = W - marginX * 2
  const winW = (usableW / cols) * 0.62
  const gapX = (usableW - winW * cols) / (cols - 1)
  const winH = H * 0.34
  const y = (H - winH) / 2

  // Deterministic pseudo-random so the texture is identical every build --
  // the whole render needs to stay byte-reproducible for CI to skip no-op
  // commits.
  let seed = 1337
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  for (let i = 0; i < cols; i++) {
    const x = marginX + i * (winW + gapX)
    const r = rand()
    // A few dark windows keep it from looking like a printed grid.
    if (r < 0.22) continue
    const lit = 0.55 + rand() * 0.45
    const v = Math.round(255 * lit)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(x, y, winW, winH)
  }

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.magFilter = LinearFilter
  tex.minFilter = LinearFilter
  return tex
}
