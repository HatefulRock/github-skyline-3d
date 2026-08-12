import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { Color } from "three"
import { RoundedBoxGeometry } from "three-stdlib"
import type { ContributionWeek } from "../data/types"
import type { Palette } from "../themes/types"
import {
  BLOCK_ROWS,
  CELL_SIZE,
  type Layout,
  MAX_VOXELS,
  VOXEL_FILL,
  VOXEL_H,
  bucket,
  heightScaleRef,
  voxelCount,
} from "../utils/grid"
import { makeWindowTexture } from "./windowTexture"

interface Voxel {
  key: string
  position: [number, number, number]
  /** Footprint scale. Kept uniform across a stack so a tower stays coherent. */
  footprint: number
  color: string
}

const BODY_H = VOXEL_H * VOXEL_FILL
/** A small bevel on every edge is most of what separates a "rendered" cube
 *  from a Minecraft block -- hard 90-degree edges catch no specular at all. */
const BEVEL = 0.055
/** Rooftop masts, but only on the tallest towers. */
const SPIRE_MIN_STACK = 11
const SPIRE_H = 0.85

const bodyGeometry = new RoundedBoxGeometry(CELL_SIZE, BODY_H, CELL_SIZE, 2, BEVEL)
const setbackGeometry = new RoundedBoxGeometry(CELL_SIZE * 0.6, VOXEL_H * 0.7, CELL_SIZE * 0.6, 2, BEVEL)
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

export function DataBuildings({
  weeks,
  layout,
  palette,
}: {
  weeks: ContributionWeek[]
  layout: Layout
  palette: Palette
}) {
  const { bodies, caps, lowrise, spires, pyramidRoofs, setbacks } = useMemo(() => {
    const counts = weeks.flatMap((w) => w.days.map((d) => d.count))
    const scaleRef = heightScaleRef(counts)

    const bodies: Voxel[] = []
    const caps: Voxel[] = []
    const lowrise: Voxel[] = []
    const spires: Voxel[] = []
    const pyramidRoofs: Voxel[] = []
    const setbacks: Voxel[] = []

    weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, row) => {
        if (row >= BLOCK_ROWS) return
        const { x, z } = layout.cellPosition(weekIndex, row)
        const base = palette.levels[bucket(day.count, scaleRef)]
        const j = jitter(weekIndex, row)
        const tint = shiftLightness(base, j * 0.035)
        const footprint = 0.88 + Math.abs(j) * 0.12
        const stack = voxelCount(day.count, scaleRef)

        if (day.count <= 0) {
          // Unlit low-rise: no windows, no roof glow. Keeps quiet days quiet
          // while still giving the city continuous built texture.
          lowrise.push({
            key: `${weekIndex}-${row}-l`,
            position: [x, VOXEL_H / 2, z],
            footprint,
            color: tint,
          })
          return
        }

        for (let i = 0; i < stack; i++) {
          const v: Voxel = {
            key: `${weekIndex}-${row}-${i}`,
            position: [x, i * VOXEL_H + VOXEL_H / 2, z],
            footprint,
            color: tint,
          }
          // Only the topmost cube shows a roof; every cube below it has its top
          // and bottom faces hidden by neighbours, so the window map on those
          // is only ever seen on the four walls.
          if (i === stack - 1) {
            caps.push({ ...v, color: shiftLightness(tint, 0.06, 1.15) })
            // Only the genuine high-rises get a mast, so it stays a signal of
            // a standout day rather than visual noise on every rooftop.
            // Roof variety. A city where every tower ends in the same flat
            // prism reads as a chart; mixing in pitched roofs and setback
            // penthouses is what makes the skyline feel built.
            if (stack >= 4) {
              const style = Math.floor(Math.abs(jitter(weekIndex + 7, row + 3)) * 3)
              const roofY = stack * VOXEL_H
              if (style === 1) {
                pyramidRoofs.push({ ...v, position: [x, roofY, z], color: shiftLightness(tint, 0.1, 1.1) })
              } else if (style === 2) {
                setbacks.push({ ...v, position: [x, roofY + VOXEL_H * 0.35, z], color: shiftLightness(tint, 0.08, 1.1) })
              }
            }
            if (stack >= SPIRE_MIN_STACK) {
              spires.push({
                ...v,
                position: [x, stack * VOXEL_H + SPIRE_H / 2, z],
                color: tint,
              })
            }
          } else bodies.push(v)
        }
      })
    })
    return { bodies, caps, lowrise, spires, pyramidRoofs, setbacks }
  }, [weeks, layout, palette])

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
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
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
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>

      {/* Pitched roofs */}
      <Instances limit={800} castShadow receiveShadow>
        <coneGeometry args={[CELL_SIZE * 0.62, VOXEL_H * 1.5, 4]} />
        <meshStandardMaterial roughness={0.34} metalness={0.18} envMapIntensity={0.9} />
        {pyramidRoofs.map((v) => (
          <Instance
            key={v.key}
            position={[v.position[0], v.position[1] + VOXEL_H * 0.75, v.position[2]]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[v.footprint, 1, v.footprint]}
            color={v.color}
          />
        ))}
      </Instances>

      {/* Setback penthouses */}
      <Instances limit={800} geometry={setbackGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.28}
          metalness={0.2}
          envMapIntensity={1.0}
          emissive={palette.glow}
          emissiveIntensity={0.16}
        />
        {setbacks.map((v) => (
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>

      {/* Rooftop masts on the standout towers. */}
      <Instances limit={400} castShadow>
        <cylinderGeometry args={[0.018, 0.03, SPIRE_H, 6]} />
        <meshStandardMaterial
          color="#cfe6d6"
          roughness={0.35}
          metalness={0.5}
          emissive={palette.glow}
          emissiveIntensity={0.8}
        />
        {spires.map((v) => (
          <Instance key={v.key} position={v.position} />
        ))}
      </Instances>

      {/* Zero-contribution days: one dark unlit block. */}
      <Instances limit={53 * BLOCK_ROWS} geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.75} metalness={0.1} envMapIntensity={0.5} />
        {lowrise.map((v) => (
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>
    </group>
  )
}
