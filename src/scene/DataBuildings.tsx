import { Instance, Instances } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import { Color } from "three"
import { RoundedBoxGeometry } from "three-stdlib"
import type { ContributionWeek } from "../data/types"
import type { Palette } from "../themes/types"
import {
  BLOCK_ROWS,
  CAP_FILL,
  CELL_SIZE,
  type Layout,
  PODIUM_H,
  VOXEL_FILL,
  VOXEL_H,
  bucket,
  heightScaleRef,
  voxelCount,
} from "../utils/grid"
import { WINDOW_VARIANTS, makeWindowTexture } from "./windowTexture"

interface Voxel {
  key: string
  position: [number, number, number]
  /** Footprint scale. Kept uniform across a stack so a tower stays coherent. */
  footprint: number
  /** Vertical scale, for pieces whose geometry is reused at several heights. */
  scaleY?: number
  color: string
}

const BODY_H = VOXEL_H * VOXEL_FILL
const CAP_H = VOXEL_H * CAP_FILL
const BASE_H = VOXEL_H * 0.94

/** A small bevel on every edge is most of what separates a "rendered" cube from
 *  a Minecraft block -- hard 90-degree edges catch no specular at all. The
 *  mid-facade bevel is deliberately much tighter than the cap's: at the cap's
 *  size it drew a heavy dark line at every single storey, which re-introduced
 *  exactly the stacked-cube read it was there to avoid. */
const BODY_BEVEL = 0.016
const CAP_BEVEL = 0.055

/** Rooftop masts, but only on the tallest towers. */
const SPIRE_MIN_STACK = 11
const SPIRE_H = 0.85
/** Below this a building is too short to carry a distinct base and roofscape;
 *  it just gets a body and a cap. */
const DETAIL_MIN_STACK = 3

const ROOF_PYRAMID = 1
const ROOF_SETBACK = 2
const ROOF_TANK = 3
const ROOF_ANTENNA = 4
const ROOF_STYLES = 5

/** Activity level drives material, not just colour. A lightness ramp on one
 *  material makes a busy day a brighter shade of a quiet one; making busy days
 *  *glass* and quiet ones *concrete* makes them a different kind of building. */
const GLASS_MIN_BUCKET = 3

const bodyGeometry = new RoundedBoxGeometry(CELL_SIZE, BODY_H, CELL_SIZE, 2, BODY_BEVEL)
const capGeometry = new RoundedBoxGeometry(CELL_SIZE, CAP_H, CELL_SIZE, 2, CAP_BEVEL)
const baseGeometry = new RoundedBoxGeometry(CELL_SIZE, BASE_H, CELL_SIZE, 2, 0.05)
const setbackGeometry = new RoundedBoxGeometry(CELL_SIZE * 0.6, VOXEL_H * 0.7, CELL_SIZE * 0.6, 2, CAP_BEVEL)
/** Parapet: a square ring, not a slab.
 *
 *  A full-footprint box laid on the roof covers the entire cap, so an emissive
 *  one doesn't read as a lit roof edge at all -- it turns every rooftop into a
 *  solid glowing tile and erases the roofscape underneath it. A torus with four
 *  tubular segments traces a square path instead, leaving the roof open. The
 *  path radius reaches the ring's corners, so it's scaled by root-2 to put the
 *  straight runs on the cell edge. */
const PARAPET_R = (CELL_SIZE / 2) * Math.SQRT2
const lowriseGeometry = new RoundedBoxGeometry(CELL_SIZE, VOXEL_H, CELL_SIZE, 2, 0.05)

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

/** 0..n-1 off the same hash, for choosing one of a set of variants. */
function pick(week: number, row: number, n: number): number {
  return Math.min(n - 1, Math.floor(Math.abs(jitter(week, row)) * n))
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
  // One texture per facade variant. Instanced meshes share a material, so the
  // towers are drawn in a few groups and the facade variety comes from which
  // group a building lands in.
  const windowMaps = useMemo(
    () =>
      Array.from({ length: WINDOW_VARIANTS }, (_, i) =>
        makeWindowTexture(i, palette.window, palette.windowAlt),
      ),
    [palette.window, palette.windowAlt],
  )
  useEffect(() => () => windowMaps.forEach((t) => t.dispose()), [windowMaps])

  const built = useMemo(() => {
    const counts = weeks.flatMap((w) => w.days.map((d) => d.count))
    const scaleRef = heightScaleRef(counts)

    // Bodies split by material class and facade variant; everything else is a
    // single group.
    const bodies: Record<string, Voxel[]> = {}
    for (const cls of ["glass", "concrete"]) {
      for (let v = 0; v < WINDOW_VARIANTS; v++) bodies[`${cls}-${v}`] = []
    }

    const bases: Voxel[] = []
    const caps: Voxel[] = []
    const roofEdges: Voxel[] = []
    const lowrise: Voxel[] = []
    const spires: Voxel[] = []
    const antennas: Voxel[] = []
    const tanks: Voxel[] = []
    const pyramidRoofs: Voxel[] = []
    const setbacks: Voxel[] = []

    weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, row) => {
        if (row >= BLOCK_ROWS) return
        const { x, z } = layout.cellPosition(weekIndex, row)
        const level = bucket(day.count, scaleRef)
        const base = palette.levels[level]
        const j = jitter(weekIndex, row)
        const tint = shiftLightness(base, j * 0.035)
        const footprint = 0.88 + Math.abs(j) * 0.12
        const stack = voxelCount(day.count, scaleRef)
        const y = (i: number) => i * VOXEL_H + VOXEL_H / 2 + PODIUM_H

        if (day.count <= 0) {
          // Unlit low-rise: no windows, no roof glow. Keeps quiet days quiet
          // while still giving the city continuous built texture.
          //
          // Three shapes plus the occasional empty lot rather than one block
          // repeated: identical dark cubes on every quiet plot tiled into a
          // literal checkerboard, which read as a chart legend more than as a
          // neighbourhood.
          const variant = pick(weekIndex + 13, row + 5, 4)
          if (variant === 3) return // empty lot
          const h = variant === 0 ? 0.45 : variant === 1 ? 1 : 1.55
          const fp = variant === 0 ? 1.02 : variant === 1 ? footprint : 0.78
          // Nudged off the exact cell centre. Height variety alone wasn't
          // enough: dark blocks sitting on a perfect lattice still resolve into
          // a checkerboard at a glance, and breaking the alignment is what
          // stops the quiet plots reading as a chart legend.
          const ox = jitter(weekIndex + 31, row + 17) * 0.075
          const oz = jitter(weekIndex + 19, row + 43) * 0.075
          lowrise.push({
            key: `${weekIndex}-${row}-l`,
            position: [x + ox, (VOXEL_H * h) / 2 + PODIUM_H, z + oz],
            footprint: fp,
            scaleY: h,
            color: shiftLightness(tint, 0.035),
          })
          return
        }

        const cls = level >= GLASS_MIN_BUCKET ? "glass" : "concrete"
        const group = bodies[`${cls}-${pick(weekIndex + 3, row + 11, WINDOW_VARIANTS)}`]
        const detailed = stack >= DETAIL_MIN_STACK

        for (let i = 0; i < stack - 1; i++) {
          const v: Voxel = {
            key: `${weekIndex}-${row}-${i}`,
            position: [x, y(i), z],
            footprint,
            color: tint,
          }
          // A wider, darker ground floor. Cheap, and it's what makes a tower
          // look planted on the pad rather than dropped onto it.
          if (i === 0 && detailed) {
            bases.push({ ...v, footprint: footprint * 1.13, color: shiftLightness(tint, -0.07, 0.9) })
          } else {
            group.push(v)
          }
        }

        // Only the topmost cube shows a roof; every cube below it has its top
        // and bottom faces hidden by neighbours.
        const capY = y(stack - 1)
        const capTop = capY + CAP_H / 2
        const capColor = shiftLightness(tint, 0.04, 1.12)
        caps.push({ key: `${weekIndex}-${row}-cap`, position: [x, capY, z], footprint, color: capColor })

        if (!detailed) return

        // Roof variety. A city where every tower ends in the same flat prism
        // reads as a chart; mixing pitched roofs, penthouses, tanks and masts
        // is what makes a skyline feel built.
        const style = pick(weekIndex + 7, row + 3, ROOF_STYLES)
        const roofKey = `${weekIndex}-${row}-r`

        if (style === ROOF_PYRAMID) {
          pyramidRoofs.push({
            key: roofKey,
            position: [x, capTop + VOXEL_H * 0.75, z],
            footprint,
            color: shiftLightness(tint, 0.1, 1.1),
          })
        } else if (style === ROOF_SETBACK) {
          setbacks.push({
            key: roofKey,
            position: [x, capTop + VOXEL_H * 0.35, z],
            footprint,
            color: shiftLightness(tint, 0.08, 1.1),
          })
        } else {
          // Lit roof line. Rooftop edge lighting is one of the strongest night
          // city signals there is, and it gives bloom a crisp horizontal to
          // catch instead of a soft wash off the whole cap.
          // Sat proud of the cap rather than sunk into it -- at the cap's own
          // height a strip centred on the roof line is almost entirely buried,
          // and only a hairline of it ever reaches the screen.
          roofEdges.push({
            key: roofKey,
            position: [x, capTop + 0.02, z],
            footprint,
            color: capColor,
          })
          if (style === ROOF_TANK) {
            tanks.push({
              key: `${roofKey}-t`,
              position: [x + CELL_SIZE * 0.17, capTop + VOXEL_H * 0.26, z - CELL_SIZE * 0.13],
              footprint,
              // Desaturated and lifted, not darkened. A tank tinted down from
              // an already-dark facade colour just reads as a black pill
              // punched into the roof.
              color: shiftLightness(tint, 0.06, 0.3),
            })
          } else if (style === ROOF_ANTENNA) {
            antennas.push({
              key: `${roofKey}-a1`,
              position: [x - CELL_SIZE * 0.16, capTop + VOXEL_H * 0.55, z + CELL_SIZE * 0.12],
              footprint,
              color: tint,
            })
            antennas.push({
              key: `${roofKey}-a2`,
              position: [x + CELL_SIZE * 0.14, capTop + VOXEL_H * 0.4, z - CELL_SIZE * 0.15],
              footprint,
              color: tint,
            })
          }
        }

        // Only the genuine high-rises get a mast, so it stays a signal of a
        // standout day rather than visual noise on every rooftop. Skipped on
        // pitched roofs, where it would spear straight through the cone.
        if (stack >= SPIRE_MIN_STACK && style !== ROOF_PYRAMID) {
          spires.push({
            key: `${weekIndex}-${row}-s`,
            position: [x, capTop + SPIRE_H / 2, z],
            footprint,
            color: tint,
          })
        }
      })
    })

    return { bodies, bases, caps, roofEdges, lowrise, spires, antennas, tanks, pyramidRoofs, setbacks }
  }, [weeks, layout, palette])

  const { bodies, bases, caps, roofEdges, lowrise, spires, antennas, tanks, pyramidRoofs, setbacks } = built
  /** drei allocates the instance buffer up front and rejects a limit of 0. */
  const cap = (n: number) => Math.max(1, n)

  return (
    <group>
      {/* Tower walls. Two material classes x a few facade variants. The
          emissive is left white because the window map carries its own colour,
          which is what lets warm interiors sit behind green glass. */}
      {(["glass", "concrete"] as const).map((cls) =>
        windowMaps.map((map, v) => {
          const list = bodies[`${cls}-${v}`]
          if (!list.length) return null
          const glass = cls === "glass"
          return (
            <Instances
              key={`${cls}-${v}`}
              limit={list.length}
              range={list.length}
              geometry={bodyGeometry}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                roughness={glass ? 0.13 : 0.68}
                metalness={glass ? 0.55 : 0.06}
                envMapIntensity={glass ? 1.35 : 0.7}
                emissive="#ffffff"
                emissiveMap={map}
                emissiveIntensity={glass ? 1 : 0.72}
              />
              {list.map((b) => (
                <Instance key={b.key} position={b.position} scale={[b.footprint, 1, b.footprint]} color={b.color} />
              ))}
            </Instances>
          )
        }),
      )}

      {/* Ground floors. */}
      <Instances limit={cap(bases.length)} range={bases.length} geometry={baseGeometry} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.72} metalness={0.12} envMapIntensity={0.7} />
        {bases.map((v) => (
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>

      {/* Rooftops -- smooth, gently emissive so bloom reads them as city lights. */}
      <Instances limit={cap(caps.length)} range={caps.length} geometry={capGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.22}
          metalness={0.3}
          envMapIntensity={1.2}
          emissive={palette.glow}
          emissiveIntensity={0.07}
        />
        {caps.map((v) => (
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>

      {/* Lit roof lines. */}
      <Instances limit={cap(roofEdges.length)} range={roofEdges.length} castShadow>
        <torusGeometry args={[PARAPET_R, 0.021, 4, 4]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.3}
          emissive={palette.glow}
          emissiveIntensity={1.5}
        />
        {roofEdges.map((v) => (
          <Instance
            key={v.key}
            position={v.position}
            rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            scale={[v.footprint, v.footprint, 1]}
            color={v.color}
          />
        ))}
      </Instances>

      {/* Pitched roofs */}
      <Instances limit={cap(pyramidRoofs.length)} range={pyramidRoofs.length} castShadow receiveShadow>
        <coneGeometry args={[CELL_SIZE * 0.62, VOXEL_H * 1.5, 4]} />
        <meshStandardMaterial roughness={0.34} metalness={0.18} envMapIntensity={0.9} />
        {pyramidRoofs.map((v) => (
          <Instance
            key={v.key}
            position={v.position}
            rotation={[0, Math.PI / 4, 0]}
            scale={[v.footprint, 1, v.footprint]}
            color={v.color}
          />
        ))}
      </Instances>

      {/* Setback penthouses */}
      <Instances
        limit={cap(setbacks.length)}
        range={setbacks.length}
        geometry={setbackGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          roughness={0.28}
          metalness={0.2}
          envMapIntensity={1}
          emissive={palette.glow}
          emissiveIntensity={0.16}
        />
        {setbacks.map((v) => (
          <Instance key={v.key} position={v.position} scale={[v.footprint, 1, v.footprint]} color={v.color} />
        ))}
      </Instances>

      {/* Rooftop water tanks */}
      <Instances limit={cap(tanks.length)} range={tanks.length} castShadow receiveShadow>
        <cylinderGeometry args={[CELL_SIZE * 0.115, CELL_SIZE * 0.115, VOXEL_H * 0.5, 8]} />
        <meshStandardMaterial roughness={0.62} metalness={0.25} envMapIntensity={0.8} />
        {tanks.map((v) => (
          <Instance key={v.key} position={v.position} color={v.color} />
        ))}
      </Instances>

      {/* Rooftop antenna clusters */}
      <Instances limit={cap(antennas.length)} range={antennas.length} castShadow>
        <cylinderGeometry args={[0.012, 0.02, VOXEL_H * 1.1, 5]} />
        <meshStandardMaterial color="#9fb4c6" roughness={0.4} metalness={0.6} />
        {antennas.map((v) => (
          <Instance key={v.key} position={v.position} />
        ))}
      </Instances>

      {/* Rooftop masts on the standout towers. */}
      <Instances limit={cap(spires.length)} range={spires.length} castShadow>
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

      {/* Zero-contribution days: dark unlit low-rise, in a few shapes. */}
      <Instances
        limit={cap(lowrise.length)}
        range={lowrise.length}
        geometry={lowriseGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.78} metalness={0.1} envMapIntensity={0.5} />
        {lowrise.map((v) => (
          <Instance
            key={v.key}
            position={v.position}
            scale={[v.footprint, v.scaleY ?? 1, v.footprint]}
            color={v.color}
          />
        ))}
      </Instances>
    </group>
  )
}
