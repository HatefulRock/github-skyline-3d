import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three"
import { BLOCKS_PER_SIDE, type Layout, STREET } from "../utils/grid"
import { lampPositions } from "./lamps"

const PX_PER_UNIT = 48

export interface GroundMaps {
  /** Albedo: block pads, street markings, lamp pools. */
  surface: CanvasTexture
  /** Drives how mirror-like each patch of ground is. Green channel, 0 = smooth.
   *  Streets are wet and reflective, block pads are dry and matte. */
  roughness: CanvasTexture
}

/** Deterministic pseudo-random. The render has to stay byte-reproducible so CI
 *  can skip no-op screenshot commits. */
function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Paints the plinth's top surface: a slightly lighter pad under each of the 9
 *  blocks, dashed centre lines and crosswalks down the streets between them,
 *  and a pool of warm light under every lamp post. Without this the "streets"
 *  are just empty gaps and the layout reads as a spreadsheet rather than a
 *  city.
 *
 *  Returns a matching roughness map as well. The street surface is the one
 *  place a night city gets to show off everything above it, so it's painted
 *  wet -- smooth in the roadway, smoother still in scattered puddles, matte on
 *  the pads where the buildings actually sit. */
export function makeGroundMaps(
  layout: Layout,
  planeW: number,
  planeD: number,
  base: string,
  lampColor: string,
): GroundMaps {
  const W = Math.round(planeW * PX_PER_UNIT)
  const H = Math.round(planeD * PX_PER_UNIT)
  const { blockW, blockD, cityWidth, cityDepth } = layout

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  const rough = document.createElement("canvas")
  rough.width = W
  rough.height = H
  const rctx = rough.getContext("2d")!

  // Lifted off the raw ground colour. The roadway is the one surface that has
  // to carry a reflection, and a reflection painted into pure black has nothing
  // to be brighter than.
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = "rgba(150,180,220,0.07)"
  ctx.fillRect(0, 0, W, H)

  // Streets: fairly smooth, so the towers smear down them.
  rctx.fillStyle = "rgb(90,90,90)"
  rctx.fillRect(0, 0, W, H)

  // World -> pixel. World x/z run [-planeW/2, planeW/2].
  const px = (x: number) => ((x + planeW / 2) / planeW) * W
  const py = (z: number) => ((z + planeD / 2) / planeD) * H
  const su = (u: number) => (u / planeW) * W
  const sv = (v: number) => (v / planeD) * H

  const blockX = (bx: number) => -cityWidth / 2 + bx * (blockW + STREET)
  const blockZ = (bz: number) => -cityDepth / 2 + bz * (blockD + STREET)
  const streetX = (i: number) => blockX(i) - STREET / 2
  const streetZ = (i: number) => blockZ(i) - STREET / 2

  // --- Block pads -----------------------------------------------------------
  const pad = 0.22
  for (let b = 0; b < BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; b++) {
    const x0 = blockX(b % BLOCKS_PER_SIDE)
    const z0 = blockZ(Math.floor(b / BLOCKS_PER_SIDE))
    ctx.fillStyle = "rgba(255,255,255,0.045)"
    ctx.fillRect(px(x0 - pad), py(z0 - pad), su(blockW + pad * 2), sv(blockD + pad * 2))
    // Dry, matte concrete under the buildings. Reflecting the towers in the
    // ground directly beneath them just produces mush; the reflection needs
    // open street to be legible.
    rctx.fillStyle = "rgb(185,185,185)"
    rctx.fillRect(px(x0 - pad), py(z0 - pad), su(blockW + pad * 2), sv(blockD + pad * 2))
  }

  // --- Puddles --------------------------------------------------------------
  // Only in the streets, and only ever smoother than the road around them.
  const rand = makeRand(20240117)
  for (let i = 0; i < 90; i++) {
    const alongVertical = rand() < 0.5
    const lane = 1 + Math.floor(rand() * (BLOCKS_PER_SIDE - 1))
    const x = alongVertical
      ? streetX(lane) + (rand() - 0.5) * STREET * 0.8
      : (rand() - 0.5) * cityWidth
    const z = alongVertical
      ? (rand() - 0.5) * cityDepth
      : streetZ(lane) + (rand() - 0.5) * STREET * 0.8
    const r = 0.18 + rand() * 0.4
    const g = rctx.createRadialGradient(px(x), py(z), 0, px(x), py(z), su(r))
    g.addColorStop(0, "rgba(20,20,20,0.85)")
    g.addColorStop(1, "rgba(20,20,20,0)")
    rctx.fillStyle = g
    rctx.beginPath()
    rctx.arc(px(x), py(z), su(r), 0, Math.PI * 2)
    rctx.fill()
  }

  // --- Street markings ------------------------------------------------------
  ctx.strokeStyle = "rgba(190,215,255,0.26)"
  ctx.lineWidth = Math.max(1, PX_PER_UNIT * 0.045)
  ctx.setLineDash([PX_PER_UNIT * 0.5, PX_PER_UNIT * 0.42])

  for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
    ctx.beginPath()
    ctx.moveTo(px(streetX(i)), py(-cityDepth / 2))
    ctx.lineTo(px(streetX(i)), py(cityDepth / 2))
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(px(-cityWidth / 2), py(streetZ(i)))
    ctx.lineTo(px(cityWidth / 2), py(streetZ(i)))
    ctx.stroke()
  }
  ctx.setLineDash([])

  // --- Crosswalks -----------------------------------------------------------
  // Laid on each approach to every intersection. Tiny at final render size, but
  // they're the difference between "gaps between blocks" and "junctions".
  const STRIPES = 5
  ctx.fillStyle = "rgba(200,220,255,0.24)"
  for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
    for (let j = 1; j < BLOCKS_PER_SIDE; j++) {
      const cx = streetX(i)
      const cz = streetZ(j)
      for (let s = 0; s < STRIPES; s++) {
        const t = (s + 0.5) / STRIPES - 0.5
        const stripeW = (STREET * 0.62) / STRIPES
        // North/south approaches: stripes run across the vertical street.
        for (const dz of [-1, 1]) {
          ctx.fillRect(
            px(cx + t * STREET * 0.78) - su(stripeW) / 2,
            py(cz + dz * STREET * 0.62) - sv(0.16),
            su(stripeW),
            sv(0.32),
          )
        }
        // East/west approaches.
        for (const dx of [-1, 1]) {
          ctx.fillRect(
            px(cx + dx * STREET * 0.62) - su(0.16),
            py(cz + t * STREET * 0.78) - sv(stripeW) / 2,
            su(0.32),
            sv(stripeW),
          )
        }
      }
    }
  }

  // --- Lamp pools -----------------------------------------------------------
  // Several hundred real point lights would be unrenderable, so the light each
  // lamp throws is painted. On a reflective street this reads as genuinely lit
  // rather than as a decal.
  ctx.globalCompositeOperation = "lighter"
  for (const l of lampPositions(layout)) {
    const r = 0.62
    const g = ctx.createRadialGradient(px(l.x), py(l.z), 0, px(l.x), py(l.z), su(r))
    g.addColorStop(0, hexToRgba(lampColor, 0.5))
    g.addColorStop(0.45, hexToRgba(lampColor, 0.16))
    g.addColorStop(1, hexToRgba(lampColor, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(px(l.x), py(l.z), su(r), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = "source-over"

  const surface = new CanvasTexture(canvas)
  surface.colorSpace = SRGBColorSpace
  surface.magFilter = LinearFilter
  surface.minFilter = LinearMipmapLinearFilter
  surface.anisotropy = 8

  const roughness = new CanvasTexture(rough)
  roughness.magFilter = LinearFilter
  roughness.minFilter = LinearMipmapLinearFilter

  return { surface, roughness }
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const n = Number.parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}
