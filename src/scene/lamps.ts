import { BLOCKS_PER_SIDE, type Layout, STREET } from "../utils/grid"

export const LAMP_SPACING = 1.5

export interface Lamp {
  key: string
  x: number
  z: number
}

/** Lamp posts down the middle of every street.
 *
 *  Shared between the posts themselves and the ground texture, which paints a
 *  pool of light under each one. Two independent copies of this maths drifted
 *  apart the moment the street spacing changed, and pools that don't sit under
 *  their lamp are worse than no pools at all. */
export function lampPositions(layout: Layout): Lamp[] {
  const { blockW, blockD, cityWidth, cityDepth } = layout
  const out: Lamp[] = []

  /** Centre line of the i-th vertical street. */
  const streetX = (i: number) => -cityWidth / 2 + i * (blockW + STREET) - STREET / 2

  for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
    const cx = streetX(i)
    for (let z = -cityDepth / 2 + LAMP_SPACING * 0.5; z < cityDepth / 2; z += LAMP_SPACING) {
      out.push({ key: `v${i}-${z.toFixed(2)}`, x: cx, z })
    }

    const cz = -cityDepth / 2 + i * (blockD + STREET) - STREET / 2
    for (let x = -cityWidth / 2 + LAMP_SPACING * 0.5; x < cityWidth / 2; x += LAMP_SPACING) {
      // Skip the crossroads so lamps don't stack on top of each other.
      let onVertical = false
      for (let j = 1; j < BLOCKS_PER_SIDE; j++) {
        if (Math.abs(x - streetX(j)) < 0.4) onVertical = true
      }
      if (onVertical) continue
      out.push({ key: `h${i}-${x.toFixed(2)}`, x, z: cz })
    }
  }
  return out
}
