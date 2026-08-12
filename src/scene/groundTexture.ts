import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three"
import { BLOCKS_PER_SIDE, type Layout, STREET } from "../utils/grid"

/** Paints the plinth's top surface: a slightly lighter pad under each of the 9
 *  blocks, with dashed centre lines down the streets between them. Without this
 *  the "streets" are just empty gaps and the layout reads as a spreadsheet
 *  rather than a city. */
export function makeGroundTexture(
  layout: Layout,
  planeW: number,
  planeD: number,
  base: string,
): CanvasTexture {
  const PX_PER_UNIT = 36
  const W = Math.round(planeW * PX_PER_UNIT)
  const H = Math.round(planeD * PX_PER_UNIT)
  const { blockW, blockD, cityWidth, cityDepth } = layout

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)

  // World -> pixel. World x/z run [-planeW/2, planeW/2].
  const px = (x: number) => ((x + planeW / 2) / planeW) * W
  const py = (z: number) => ((z + planeD / 2) / planeD) * H

  ctx.fillStyle = "rgba(255,255,255,0.045)"
  for (let b = 0; b < BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; b++) {
    const bx = b % BLOCKS_PER_SIDE
    const bz = Math.floor(b / BLOCKS_PER_SIDE)
    const x0 = -cityWidth / 2 + bx * (blockW + STREET)
    const z0 = -cityDepth / 2 + bz * (blockD + STREET)
    const pad = 0.22
    ctx.fillRect(
      px(x0 - pad),
      py(z0 - pad),
      ((blockW + pad * 2) / planeW) * W,
      ((blockD + pad * 2) / planeD) * H,
    )
  }

  ctx.strokeStyle = "rgba(190,215,255,0.13)"
  ctx.lineWidth = Math.max(1, PX_PER_UNIT * 0.045)
  ctx.setLineDash([PX_PER_UNIT * 0.5, PX_PER_UNIT * 0.42])

  for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
    const cx = -cityWidth / 2 + i * (blockW + STREET) - STREET / 2
    ctx.beginPath()
    ctx.moveTo(px(cx), py(-cityDepth / 2))
    ctx.lineTo(px(cx), py(cityDepth / 2))
    ctx.stroke()

    const cz = -cityDepth / 2 + i * (blockD + STREET) - STREET / 2
    ctx.beginPath()
    ctx.moveTo(px(-cityWidth / 2), py(cz))
    ctx.lineTo(px(cityWidth / 2), py(cz))
    ctx.stroke()
  }

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.magFilter = LinearFilter
  tex.minFilter = LinearFilter
  return tex
}
