import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { CatmullRomCurve3, ExtrudeGeometry, Shape, TubeGeometry, Vector2, Vector3 } from "three"
import { DECK_END, DECK_H, DECK_L, DECK_W, DECK_Y } from "../themes/landmarks"

/** Marina Bay Sands' SkyPark: the ship-shaped deck across the three towers.
 *
 *  Drawn as real curved geometry rather than landmark boxes: a hull that
 *  swells in the middle and narrows to its ends, a light belly, a garden deck
 *  with trees and pavilions, the infinity pool down the city-facing side, and
 *  lit edges -- at night, the lights along the hull are most of what makes the
 *  top of the building read. Authored in the plot's own units, like the
 *  landmarks it sits on. */
const START = DECK_END // the cantilevered end
const END = DECK_END + DECK_L
const HULL_H = DECK_H * 0.8
const TOP = DECK_Y + HULL_H

/** Half-width along the deck, t = 0 at the cantilever, 1 at the far end. */
function halfWidth(t: number): number {
  const swell = Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
  return (DECK_W / 2) * (0.62 + 0.38 * Math.sqrt(swell))
}

function outline(scale = 1, steps = 48): Vector2[] {
  const right: Vector2[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const z = START + t * DECK_L
    right.push(new Vector2(halfWidth(t) * scale, -z))
  }
  const left = right.map((p) => new Vector2(-p.x, p.y)).reverse()
  return [...right, ...left]
}

function slab(scale: number, depth: number, bevel: number): ExtrudeGeometry {
  const g = new ExtrudeGeometry(new Shape(outline(scale)), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  })
  // Shape space is (x, -z); extrusion runs up.
  g.rotateX(-Math.PI / 2)
  return g
}

function edgeTube(y: number, scale: number, radius: number): TubeGeometry {
  const pts = outline(scale, 64).map((p) => new Vector3(p.x, y, -p.y))
  return new TubeGeometry(new CatmullRomCurve3(pts, true, "centripetal"), 260, radius, 4, true)
}

function rand(i: number): number {
  const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return h - Math.floor(h)
}

export function SkyPark({ center, scale }: { center: { x: number; z: number }; scale: number }) {
  const geo = useMemo(
    () => ({
      hull: slab(1, HULL_H - 0.08, 0.04),
      belly: slab(0.82, 0.08, 0.02),
      deck: slab(0.93, 0.02, 0),
      topEdge: edgeTube(TOP - 0.01, 1.075, 0.014),
      bellyEdge: edgeTube(DECK_Y - 0.02, 0.9, 0.01),
    }),
    [],
  )

  const { trees, uplights } = useMemo(() => {
    const trees: { key: string; p: [number, number, number]; s: number }[] = []
    const uplights: { key: string; p: [number, number, number] }[] = []
    let i = 0
    for (let z = START + 0.45; z < END - 0.35; z += 0.17) {
      const t = (z - START) / DECK_L
      const hw = halfWidth(t) * 0.9
      // Garden on the inland half; the pool takes the outer strip.
      for (const f of [0.82, 0.55, 0.28]) {
        i++
        if (rand(i) < 0.3) continue
        const x = -hw * f + (rand(i + 99) - 0.5) * 0.06
        const s = 0.045 + rand(i + 7) * 0.03
        trees.push({ key: `t${i}`, p: [x, TOP + 0.02 + s * 0.9, z + (rand(i + 3) - 0.5) * 0.06], s })
        if (rand(i + 11) > 0.55) uplights.push({ key: `u${i}`, p: [x + 0.04, TOP + 0.025, z] })
      }
    }
    return { trees, uplights }
  }, [])

  const poolStart = START + 0.55
  const poolEnd = END - 0.55
  const poolLen = poolEnd - poolStart
  const poolX = DECK_W / 2 - 0.28

  return (
    <group position={[center.x, 0, center.z]} scale={scale}>
      {/* Hull and belly. */}
      <mesh geometry={geo.hull} position={[0, DECK_Y + 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cfd3d8" roughness={0.26} metalness={0.55} envMapIntensity={1.3} />
      </mesh>
      <mesh geometry={geo.belly} position={[0, DECK_Y - 0.08, 0]} castShadow>
        <meshStandardMaterial color="#8d949c" roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh geometry={geo.deck} position={[0, TOP, 0]} receiveShadow>
        <meshStandardMaterial color="#1f3a2b" roughness={0.9} metalness={0} />
      </mesh>

      {/* Lit edges: warm along the top rail, cooler under the belly. */}
      <mesh geometry={geo.topEdge}>
        <meshBasicMaterial color="#ffd38a" toneMapped={false} />
      </mesh>
      <mesh geometry={geo.bellyEdge}>
        <meshBasicMaterial color="#e8f4ff" toneMapped={false} />
      </mesh>

      {/* Infinity pool down the city side, with its lit coping. */}
      <mesh position={[poolX, TOP + 0.025, (poolStart + poolEnd) / 2]}>
        <boxGeometry args={[0.36, 0.03, poolLen]} />
        <meshStandardMaterial
          color="#0d4f78"
          roughness={0.04}
          metalness={0.2}
          emissive="#1478c8"
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh position={[poolX + 0.19, TOP + 0.035, (poolStart + poolEnd) / 2]}>
        <boxGeometry args={[0.018, 0.02, poolLen]} />
        <meshBasicMaterial color="#bff0ff" toneMapped={false} />
      </mesh>

      {/* Pavilions and the restaurant at the far end. */}
      {[
        { z: START + 0.9, w: 0.3, l: 0.42 },
        { z: START + 2.6, w: 0.26, l: 0.3 },
        { z: END - 2.0, w: 0.26, l: 0.3 },
        { z: END - 0.75, w: 0.5, l: 0.55 },
      ].map((p, i) => (
        <mesh key={i} position={[-0.05, TOP + 0.06, p.z]} castShadow>
          <boxGeometry args={[p.w * 0.8, 0.08, p.l * 0.8]} />
          <meshStandardMaterial
            color="#3a3632"
            roughness={0.2}
            metalness={0.3}
            emissive="#ffb35c"
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}

      {/* Garden trees. */}
      <Instances limit={trees.length} range={trees.length} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2c6a40" roughness={0.85} flatShading />
        {trees.map((t) => (
          <Instance key={t.key} position={t.p} scale={[t.s, t.s * 0.9, t.s]} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, uplights.length)} range={uplights.length}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffe0a0" toneMapped={false} />
        {uplights.map((u) => (
          <Instance key={u.key} position={u.p} />
        ))}
      </Instances>
    </group>
  )
}
