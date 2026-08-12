import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { Color } from "three"
import type { ContributionData } from "../data/types"
import type { Palette } from "../themes/types"
import {
  BLOCK_ROWS,
  CELL_SIZE,
  MAX_VOXELS,
  VOXEL_FILL,
  VOXEL_H,
  bucket,
  cellPosition,
  voxelCount,
} from "../utils/grid"

interface Voxel {
  key: string
  position: [number, number, number]
  color: string
}

/** Rooftops catch the light, so the top cube of each stack is brightened --
 *  a cheap way to get the "lit city" read without per-face materials.
 *  Lifts HSL lightness rather than lerping toward white, which would wash the
 *  greens out to sage-grey. */
function brighten(hex: string, amount: number): string {
  const c = new Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.min(1, hsl.l + amount))
  return `#${c.getHexString()}`
}

export function DataBuildings({ data, palette }: { data: ContributionData; palette: Palette }) {
  const voxels = useMemo<Voxel[]>(() => {
    const counts = data.weeks.flatMap((w) => w.days.map((d) => d.count))
    const maxCount = counts.length ? Math.max(...counts) : 0

    const out: Voxel[] = []
    data.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, row) => {
        if (row >= BLOCK_ROWS) return
        const { x, z } = cellPosition(weekIndex, row)
        const base = palette.levels[bucket(day.count, maxCount)]
        const stack = voxelCount(day.count, maxCount)

        for (let i = 0; i < stack; i++) {
          const isTop = i === stack - 1 && day.count > 0
          out.push({
            key: `${weekIndex}-${row}-${i}`,
            position: [x, i * VOXEL_H + VOXEL_H / 2, z],
            color: isTop ? brighten(base, 0.25) : base,
          })
        }
      })
    })
    return out
  }, [data, palette])

  return (
    <Instances limit={53 * BLOCK_ROWS * MAX_VOXELS} castShadow receiveShadow>
      <boxGeometry args={[CELL_SIZE, VOXEL_H * VOXEL_FILL, CELL_SIZE]} />
      <meshStandardMaterial roughness={0.42} metalness={0.08} />
      {voxels.map((v) => (
        <Instance key={v.key} position={v.position} color={v.color} />
      ))}
    </Instances>
  )
}
