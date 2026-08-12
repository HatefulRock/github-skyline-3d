import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { Color } from "three"
import { RoundedBoxGeometry } from "three-stdlib"
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
  heightScaleRef,
  voxelCount,
} from "../utils/grid"

interface Voxel {
  key: string
  position: [number, number, number]
  color: string
}

const BODY_H = VOXEL_H * VOXEL_FILL
/** A small bevel on every edge is most of what separates a "rendered" cube
 *  from a Minecraft block -- hard 90-degree edges catch no specular at all. */
const BEVEL = 0.055

const bodyGeometry = new RoundedBoxGeometry(CELL_SIZE, BODY_H, CELL_SIZE, 2, BEVEL)

/** Rooftops catch the light, so the top cube of each stack is brightened.
 *  Lifts HSL lightness rather than lerping toward white, which would wash the
 *  greens out to sage-grey. */
function brighten(hex: string, amount: number): string {
  const c = new Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(1, hsl.s * 1.15), Math.min(1, hsl.l + amount))
  return `#${c.getHexString()}`
}

export function DataBuildings({ data, palette }: { data: ContributionData; palette: Palette }) {
  const { bodies, caps } = useMemo(() => {
    const counts = data.weeks.flatMap((w) => w.days.map((d) => d.count))
    const scaleRef = heightScaleRef(counts)

    const bodies: Voxel[] = []
    const caps: Voxel[] = []

    data.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, row) => {
        if (row >= BLOCK_ROWS) return
        const { x, z } = cellPosition(weekIndex, row)
        const base = palette.levels[bucket(day.count, scaleRef)]
        const stack = voxelCount(day.count, scaleRef)

        for (let i = 0; i < stack; i++) {
          const v: Voxel = {
            key: `${weekIndex}-${row}-${i}`,
            position: [x, i * VOXEL_H + VOXEL_H / 2, z],
            color: base,
          }
          // Quiet days stay unlit low-rise; only real activity gets a lit roof.
          if (i === stack - 1 && day.count > 0) caps.push({ ...v, color: brighten(base, 0.06) })
          else bodies.push(v)
        }
      })
    })
    return { bodies, caps }
  }, [data, palette])

  const limit = 53 * BLOCK_ROWS * MAX_VOXELS

  return (
    <group>
      {/* Tower bodies */}
      <Instances limit={limit} geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.28} metalness={0.22} envMapIntensity={0.9} />
        {bodies.map((v) => (
          <Instance key={v.key} position={v.position} color={v.color} />
        ))}
      </Instances>

      {/* Rooftops -- gently emissive so bloom picks them out as city lights. */}
      <Instances limit={limit} geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.22}
          metalness={0.2}
          envMapIntensity={1.1}
          emissive={palette.glow}
          emissiveIntensity={0.11}
        />
        {caps.map((v) => (
          <Instance key={v.key} position={v.position} color={v.color} />
        ))}
      </Instances>
    </group>
  )
}
