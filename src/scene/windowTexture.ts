import { CanvasTexture, Color, LinearFilter, RepeatWrapping, SRGBColorSpace } from "three"

/** How many distinct facade variants the city is rendered with. Instanced
 *  meshes share one material, so facade variety has to come from drawing the
 *  towers in a few groups with a different variant each -- which costs a draw
 *  call per group, so this stays small. */
export const WINDOW_VARIANTS = 3

/** One stacked cube is one storey, so the texture holds a single row of lit
 *  windows. Stacking cubes then tiles it vertically into a continuous facade.
 *
 *  Used as an emissiveMap, and it carries real colour rather than a greyscale
 *  mask: the material's `emissive` is left white so what reaches the screen is
 *  whatever gets painted here. That's what lets windows glow a warm interior
 *  amber while the wall colour underneath stays on the contribution ramp --
 *  tinting the emissive green instead put every lit surface in the render on a
 *  single hue, which is most of why the city read flat. */
export function makeWindowTexture(variant: number, warm: string, cool: string): CanvasTexture {
  const W = 128
  const H = 128
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, W, H)

  // Deterministic pseudo-random so the texture is identical every build --
  // the whole render needs to stay byte-reproducible for CI to skip no-op
  // commits.
  let seed = 1337 + variant * 7919
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  // Column count varies per variant, so neighbouring towers don't share a
  // facade rhythm. Identical window spacing everywhere is a strong "one
  // repeated asset" cue even when the colours differ.
  const cols = 4 + (variant % 3)
  const marginX = W * 0.12
  const usableW = W - marginX * 2
  const winW = (usableW / cols) * 0.6
  const gapX = cols > 1 ? (usableW - winW * cols) / (cols - 1) : 0
  const winH = H * 0.34
  const y = (H - winH) / 2

  const warmC = new Color(warm)
  const coolC = new Color(cool)
  const mix = new Color()

  for (let i = 0; i < cols; i++) {
    const x = marginX + i * (winW + gapX)
    // A few dark windows keep it from looking like a printed grid.
    if (rand() < 0.24) continue

    // Mostly warm, with a minority pulled toward the cool tint. A facade of
    // uniformly warm windows is only marginally better than a uniformly green
    // one; the spread is what sells it as many separate rooms.
    const towardCool = rand() < 0.22 ? 0.55 + rand() * 0.45 : rand() * 0.18
    mix.copy(warmC).lerp(coolC, towardCool)
    const lit = 0.5 + rand() * 0.5
    const r = Math.round(mix.r * 255 * lit)
    const g = Math.round(mix.g * 255 * lit)
    const b = Math.round(mix.b * 255 * lit)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, y, winW, winH)
  }

  // Faint spandrel line at the storey break. Reads as the floor slab between
  // levels, and carries the horizontal rhythm the fat voxel seams used to
  // provide before they were tightened into a continuous facade.
  ctx.fillStyle = "rgba(255,255,255,0.05)"
  ctx.fillRect(0, H - 3, W, 2)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.magFilter = LinearFilter
  tex.minFilter = LinearFilter
  return tex
}
