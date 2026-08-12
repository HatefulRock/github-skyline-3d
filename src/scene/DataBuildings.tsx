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
import { makeWindowTexture } from "./windowTexture"

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
const windowMap = makeWindowTexture()

function shiftLightness(hex: string, amount: number, satMul = 1): string {
  const c = new Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(1, hsl.s * satMul), Math.max(0, Math.min(1, hsl.l + amount)))
  return `#${c.getHexString()}`
}

/** Deterministic per-cell jitter so neighbouring towers aren't identical
 *  prisms. Hash-based rather than Math.random so the render stays
 *  byte-reproducible across CI runs. */
function jitter(week: number, row: number): number {
  const h = Math.sin(week * 127.1 + row * 311.7) * 43758.5453
  return (h - Math.floor(h) - 0.5) * 2 // -1..1
}

export function DataBuildings({ data, palette }: { data: ContributionData; palette: Palette }) {
  const { bodies, caps, lowrise } = useMemo(() => {
    const counts = data.weeks.flatMap((w) => w.days.map((d) => d.count))
    const scaleRef = heightScaleRef(counts)

    const bodies: Voxel[] = []
    const caps: Voxel[] = []
    const lowrise: Voxel[] = []

    data.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, row) => {
        if (row >= BLOCK_ROWS) return
        const { x, z } = cellPosition(weekIndex, row)
        const base = palette.levels[bucket(day.count, scaleRef)]
        const tint = shiftLightness(base, jitter(weekIndex, row) * 0.035)
        const stack = voxelCount(day.count, scaleRef)

        if (day.count <= 0) {
          // Unlit low-rise: no windows, no roof glow. Keeps quiet days quiet
          // while still giving the city continuous built texture.
          lowrise.push({ key: `${weekIndex}-${row}-l`, position: [x, VOXEL_H / 2, z], color: tint })
          return
        }

        for (let i = 0; i < stack; i++) {
          const v: Voxel = {
            key: `${weekIndex}-${row}-${i}`,
            position: [x, i * VOXEL_H + VOXEL_H / 2, z],
            color: tint,
          }
          // Only the topmost cube shows a roof; every cube below it has its top
          // and bottom faces hidden by neighbours, so the window map on those
          // is only ever seen on the four walls.
          if (i === stack - 1) caps.push({ ...v, color: shiftLightness(tint, 0.06, 1.15) })
          else bodies.push(v)
        }
      })
    })
    return { bodies, caps, lowrise }
  }, [data, palette])

  const limit = 53 * BLOCK_ROWS * MAX_VOXELS

  return (
    <group>
      {/* Tower walls, with lit windows via an emissive map. */}
      <Instances limit={limit} geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.2}
          envMapIntensity={0.9}
          emissive={palette.glow}
          emissiveMap={windowMap}
          emissiveIntensity={0.85}
        />
        {bodies.map((v) => (
          <Instance key={v.key} position={v.position} color={v.color} />
        ))}
      </Instances>

      {/* Rooftops -- smooth, gently emissive so bloom reads them as city lights. */}
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

      {/* Zero-contribution days: one dark unlit block. */}
      <Instances limit={53 * BLOCK_ROWS} geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.75} metalness={0.1} envMapIntensity={0.5} />
        {lowrise.map((v) => (
          <Instance key={v.key} position={v.position} color={v.color} />
        ))}
      </Instances>
    </group>
  )
}
