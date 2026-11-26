import { MeshReflectorMaterial } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { type Group, NearestFilter, SRGBColorSpace, type Texture, TextureLoader } from "three"
import { type Layout, PODIUM_H } from "../utils/grid"

/** What `koi/` (the koi-sprite program) writes next to `sheet.png`. */
interface KoiSheetMeta {
  frames: number
  cols: number
  rows: number
  frameMs: number
  /** Koi body lengths per second, from the day's behavior. */
  speed: number
  /** The day the koi was drawn for; it seeds the day's path. */
  observedOn: string
}

interface KoiSheet {
  texture: Texture
  meta: KoiSheetMeta
}

declare global {
  interface Window {
    /** Hooks for `scripts/animate.mjs`, which steps the koi one frame at a time
     *  so every captured frame is the koi pose it asked for. */
    __koi?: {
      /** Seconds for one seamless loop: the path and the swim cycle both close. */
      loopSeconds: number
      /** Pins the koi to this time in its loop, or `null` to follow the clock. */
      setTime(seconds: number | null): void
    }
  }
}

/** Water sits a hair above the pad so it never z-fights with it, and the koi a
 *  hair above the water. */
const WATER_Y = PODIUM_H + 0.012
const KOI_Y = WATER_Y + 0.01
/** Side of the square the koi sprite is drawn on. The koi fills about 60% of
 *  its frame, so this makes it about a third of the pond's width. */
const KOI_SPRITE = 3.6
const KOI_LENGTH = KOI_SPRITE * 0.6
/** Waypoints on the day's path. Enough to wander, few enough to stay smooth. */
const WAYPOINTS = 7

/** The stone edge around the water. */
const RIM = 0.16
const RIM_H = 0.09

/** Small seeded PRNG (mulberry32), so a day's path is the same on every load. */
function seededRandom(seedText: string): () => number {
  let seed = 0
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface SwimPath {
  /** Position and heading (radians about +y, 0 facing +x) at a distance along the path. */
  at(distance: number): { x: number; z: number; heading: number }
  length: number
}

/** A closed, smooth wander through random points in the pond, new each day.
 *  Catmull-Rom through the points, then sampled by arc length so the koi swims
 *  at an even speed. */
function makeSwimPath(seedText: string, halfW: number, halfD: number): SwimPath {
  const rand = seededRandom(seedText)
  // Points go round the pond in angle order, each at a random radius and with
  // jitter, so the path wanders across the water without tying itself in knots.
  const points: [number, number][] = []
  const start = rand() * Math.PI * 2
  for (let i = 0; i < WAYPOINTS; i++) {
    const a = start + ((i + 0.2 + rand() * 0.6) / WAYPOINTS) * Math.PI * 2
    const r = 0.25 + rand() * 0.75
    points.push([Math.cos(a) * r * halfW, Math.sin(a) * r * halfD])
  }
  const n = points.length
  const curve = (u: number): [number, number] => {
    const i = Math.floor(u)
    const f = u - i
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((k) => points[(((i + k) % n) + n) % n])
    const c = (k: 0 | 1) =>
      0.5 *
      (2 * p1[k] +
        (-p0[k] + p2[k]) * f +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f * f * f)
    return [c(0), c(1)]
  }
  const samples = 60 * n
  const xs: number[] = []
  const zs: number[] = []
  const dist: number[] = [0]
  for (let s = 0; s <= samples; s++) {
    const [px, pz] = curve((s / samples) * n)
    xs.push(px)
    zs.push(pz)
    if (s > 0) dist.push(dist[s - 1] + Math.hypot(px - xs[s - 1], pz - zs[s - 1]))
  }
  const length = dist[samples]
  return {
    length,
    at(distance) {
      const d = ((distance % length) + length) % length
      let lo = 0
      let hi = samples
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (dist[mid] <= d) lo = mid
        else hi = mid
      }
      const f = (d - dist[lo]) / (dist[hi] - dist[lo] || 1)
      const dx = xs[hi] - xs[lo]
      const dz = zs[hi] - zs[lo]
      return { x: xs[lo] + dx * f, z: zs[lo] + dz * f, heading: Math.atan2(-dz, dx) }
    },
  }
}

function useKoiSheet(): KoiSheet | null {
  const [sheet, setSheet] = useState<KoiSheet | null>(null)
  useEffect(() => {
    let cancelled = false
    let loaded: Texture | null = null
    // The koi is optional: before the daily job has drawn one, or when running
    // locally without it, the pond is just water.
    fetch("/koi/sheet.json")
      .then((r) => (r.ok ? (r.json() as Promise<KoiSheetMeta>) : Promise.reject(new Error(String(r.status)))))
      .then((meta) =>
        new TextureLoader().loadAsync("/koi/sheet.png").then((texture) => {
          // Pixel art: sample it as pixels, never blur it.
          texture.magFilter = NearestFilter
          texture.minFilter = NearestFilter
          texture.generateMipmaps = false
          texture.colorSpace = SRGBColorSpace
          texture.repeat.set(1 / meta.cols, 1 / meta.rows)
          loaded = texture
          if (!cancelled) setSheet({ texture, meta })
        }),
      )
      .catch(() => console.info("No koi sheet in public/koi/; the pond stays empty."))
    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [])
  return sheet
}

/** A koi pond filling one city block: a stone rim, still reflective water, and
 *  the account's koi from git-koi wandering a new path across it every day. */
export function Pond({ layout, plot }: { layout: Layout; plot: number }) {
  const { x, z } = layout.blockCenter(plot)
  const w = layout.blockW
  const d = layout.blockD
  const sheet = useKoiSheet()
  const koi = useRef<Group>(null)
  const forcedTime = useRef<number | null>(null)
  const shownFrame = useRef(-1)

  // The day's path, and the speed that makes it close on a whole number of
  // swim cycles, so the loop is seamless (the README animation depends on it).
  const swim = useMemo(() => {
    if (!sheet) return null
    const { frames, frameMs, speed, observedOn } = sheet.meta
    // Keep the whole sprite, fins included, inside the rim.
    const margin = KOI_LENGTH * 0.55 + RIM
    const path = makeSwimPath(observedOn, w / 2 - margin, d / 2 - margin)
    const cycleSeconds = (frames * frameMs) / 1000
    const cycles = Math.max(1, Math.round(path.length / (speed * KOI_LENGTH) / cycleSeconds))
    const loopSeconds = cycles * cycleSeconds
    return { path, loopSeconds, unitsPerSecond: path.length / loopSeconds }
  }, [sheet, w, d])

  useEffect(() => {
    if (!swim) return
    window.__koi = {
      loopSeconds: swim.loopSeconds,
      setTime: (seconds) => {
        forcedTime.current = seconds
      },
    }
    return () => {
      delete window.__koi
    }
  }, [swim])

  useFrame(({ clock }) => {
    if (!sheet || !swim || !koi.current) return
    const { frames, cols, rows, frameMs } = sheet.meta
    const t = (forcedTime.current ?? clock.elapsedTime) % swim.loopSeconds
    const p = swim.path.at(t * swim.unitsPerSecond)
    koi.current.position.set(p.x, KOI_Y, p.z)
    koi.current.rotation.set(0, p.heading, 0)
    const frame = Math.floor((t * 1000) / frameMs) % frames
    if (frame === shownFrame.current) return
    shownFrame.current = frame
    // Row 0 of the sheet is the top of the image, and texture v runs upward.
    sheet.texture.offset.set((frame % cols) / cols, 1 - (Math.floor(frame / cols) + 1) / rows)
  })

  const rimPieces = useMemo(
    () => [
      { key: "n", pos: [0, -d / 2 + RIM / 2], size: [w, RIM] },
      { key: "s", pos: [0, d / 2 - RIM / 2], size: [w, RIM] },
      { key: "w", pos: [-w / 2 + RIM / 2, 0], size: [RIM, d - RIM * 2] },
      { key: "e", pos: [w / 2 - RIM / 2, 0], size: [RIM, d - RIM * 2] },
    ],
    [w, d],
  )

  return (
    <group position={[x, 0, z]}>
      {rimPieces.map((p) => (
        <mesh
          key={p.key}
          position={[p.pos[0], PODIUM_H + RIM_H / 2, p.pos[1]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[p.size[0], RIM_H, p.size[1]]} />
          <meshStandardMaterial color="#3a4652" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}

      {/* The bay. A near-mirror, so Marina Bay Sands and the towers behind it
          show in the water the way the real skyline does at night. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, 0]}>
        <planeGeometry args={[w - RIM * 2, d - RIM * 2]} />
        <MeshReflectorMaterial
          color="#16576b"
          resolution={1024}
          mixBlur={0.4}
          mixStrength={6}
          blur={[40, 12]}
          mirror={0.9}
          roughness={0.18}
          metalness={0}
          // A little light from below, so the water reads as water at night
          // rather than as a hole in the plinth.
          emissive="#0e4d5e"
          emissiveIntensity={0.7}
        />
      </mesh>

      {sheet && (
        <group ref={koi} position={[0, KOI_Y, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[KOI_SPRITE, KOI_SPRITE]} />
            <meshStandardMaterial
              map={sheet.texture}
              transparent
              alphaTest={0.5}
              depthWrite={false}
              roughness={0.6}
              // Lit from within a little, so the koi still reads at night under
              // the dim ambient light the rest of the city is tuned for.
              emissive="#ffffff"
              emissiveMap={sheet.texture}
              emissiveIntensity={0.55}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
