import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { CatmullRomCurve3, ExtrudeGeometry, Shape, TubeGeometry, Vector2, Vector3 } from "three"
import { DECK_END, DECK_H, DECK_L, DECK_W, DECK_Y } from "../themes/landmarks"

/** Marina Bay Sands' SkyPark: the 340 m "ship" across the three towers.
 *
 *  Proportions and layout follow the real building (Safdie Architects, Arup,
 *  CTBUH case study): a long, narrow deck about 340 x 40 m with near-parallel
 *  sides, a 66.5 m cantilever off the north tower that narrows to a rounded
 *  tip with the public observation deck on it, and a rounded hull clad in
 *  silver panels underneath -- the "platonic toroid" it started as, streamlined.
 *  On top: one long infinity pool (about 150 m) on the city side at the hotel
 *  end, the garden of ~250 trees, and white shade canopies. The deck's 8.5:1
 *  ratio is relaxed a little so it still reads at this scale. */
const START = DECK_END // the cantilevered (north) end
const END = DECK_END + DECK_L
const HULL_H = DECK_H * 0.55
const TOP = DECK_Y + HULL_H
/** Where the cantilever starts to narrow, as a fraction of the length. */
const TIP = 0.16
/** The infinity pool: ~150 of the 340 m, on the city side, at the hotel end
 *  away from the cantilever. Here the city lies to -x. */
const POOL_END = END - DECK_L * 0.06
const POOL_START = POOL_END - DECK_L * 0.44
const POOL_W = 0.2
const POOL_X = -(DECK_W / 2) + POOL_W / 2 + 0.02

/** Half-width along the deck, t = 0 at the cantilever tip, 1 at the far end. */
function halfWidth(t: number): number {
  const w = DECK_W / 2
  if (t < TIP) {
    // The cantilever narrows to a rounded nose.
    const u = t / TIP
    return w * (0.45 + 0.55 * Math.sqrt(1 - (1 - u) * (1 - u)))
  }
  if (t > 0.96) {
    // Blunt, rounded south end.
    const u = (t - 0.96) / 0.04
    return w * Math.sqrt(Math.max(0, 1 - u * u * 0.75))
  }
  return w
}

function outline(scale = 1, steps = 72): Vector2[] {
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
    bevelSegments: 4,
    curveSegments: 12,
  })
  // Shape space is (x, -z); extrusion runs up.
  g.rotateX(-Math.PI / 2)
  return g
}

function edgeTube(y: number, scale: number, radius: number): TubeGeometry {
  const pts = outline(scale, 90).map((p) => new Vector3(p.x, y, -p.y))
  return new TubeGeometry(new CatmullRomCurve3(pts, true, "centripetal"), 320, radius, 4, true)
}

function rand(i: number): number {
  const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return h - Math.floor(h)
}

export function SkyPark({ center, scale }: { center: { x: number; z: number }; scale: number }) {
  const geo = useMemo(
    () => ({
      // A thin deck edge over a rounded silver belly, built from stepped
      // bevelled layers so the underside curves in like a hull.
      hull: slab(1, HULL_H - 0.06, 0.03),
      belly1: slab(0.84, 0.06, 0.03),
      belly2: slab(0.6, 0.05, 0.03),
      deck: slab(0.97, 0.015, 0),
      topEdge: edgeTube(TOP - 0.005, 1.0 + 0.03 / (DECK_W / 2), 0.011),
      bellyEdge: edgeTube(DECK_Y - 0.03, 0.84 + 0.03 / (DECK_W / 2), 0.008),
    }),
    [],
  )

  const { trees, uplights, canopies } = useMemo(() => {
    const trees: { key: string; p: [number, number, number]; s: number }[] = []
    const uplights: { key: string; p: [number, number, number] }[] = []
    const canopies: { key: string; p: [number, number, number]; r: number }[] = []
    let i = 0
    for (let z = START + DECK_L * TIP + 0.15; z < END - 0.2; z += 0.13) {
      const t = (z - START) / DECK_L
      const hw = halfWidth(t) * 0.9
      const inPool = z > POOL_START - 0.05 && z < POOL_END + 0.05
      // Trees fill the deck; along the pool they keep to the inland half.
      for (const f of [0.75, 0.35, -0.05, -0.45]) {
        i++
        if (inPool && f < 0.2) continue
        if (rand(i) < 0.35) continue
        const x = hw * f + (rand(i + 99) - 0.5) * 0.05
        const s = 0.035 + rand(i + 7) * 0.025
        trees.push({ key: `t${i}`, p: [x, TOP + 0.015 + s * 0.9, z + (rand(i + 3) - 0.5) * 0.05], s })
        if (rand(i + 11) > 0.6) uplights.push({ key: `u${i}`, p: [x + 0.03, TOP + 0.02, z] })
      }
      // White shade canopies dotted along the middle.
      if (rand(i + 500) > 0.8) {
        canopies.push({ key: `c${i}`, p: [hw * 0.1, TOP + 0.07, z], r: 0.06 + rand(i + 501) * 0.03 })
      }
    }
    return { trees, uplights, canopies }
  }, [])

  const poolLen = POOL_END - POOL_START

  return (
    <group position={[center.x, 0, center.z]} scale={scale}>
      {/* Hull and belly. */}
      <mesh geometry={geo.hull} position={[0, DECK_Y + 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c9ced4" roughness={0.24} metalness={0.6} envMapIntensity={1.4} />
      </mesh>
      <mesh geometry={geo.belly1} position={[0, DECK_Y - 0.06, 0]} castShadow>
        <meshStandardMaterial color="#b9bfc6" roughness={0.3} metalness={0.6} envMapIntensity={1.3} />
      </mesh>
      <mesh geometry={geo.belly2} position={[0, DECK_Y - 0.14, 0]} castShadow>
        <meshStandardMaterial color="#a3a9b0" roughness={0.35} metalness={0.6} envMapIntensity={1.2} />
      </mesh>
      <mesh geometry={geo.deck} position={[0, TOP, 0]} receiveShadow>
        <meshStandardMaterial color="#26392c" roughness={0.9} metalness={0} />
      </mesh>

      {/* Lit edges: warm along the top rail, cooler under the belly. */}
      <mesh geometry={geo.topEdge}>
        <meshBasicMaterial color="#ffd38a" toneMapped={false} />
      </mesh>
      <mesh geometry={geo.bellyEdge}>
        <meshBasicMaterial color="#e8f4ff" toneMapped={false} />
      </mesh>

      {/* Infinity pool on the city side, its vanishing edge flush with the
          hull, with a lit coping along it. */}
      <mesh position={[POOL_X, TOP + 0.012, (POOL_START + POOL_END) / 2]}>
        <boxGeometry args={[POOL_W, 0.02, poolLen]} />
        <meshStandardMaterial
          color="#0d4f78"
          roughness={0.04}
          metalness={0.2}
          emissive="#1a86d8"
          emissiveIntensity={1.0}
        />
      </mesh>
      <mesh position={[POOL_X + POOL_W / 2 + 0.008, TOP + 0.02, (POOL_START + POOL_END) / 2]}>
        <boxGeometry args={[0.012, 0.018, poolLen]} />
        <meshBasicMaterial color="#bff0ff" toneMapped={false} />
      </mesh>

      {/* Observation deck on the cantilever: open paving. */}
      <mesh position={[0, TOP + 0.01, START + DECK_L * TIP * 0.55]}>
        <boxGeometry args={[DECK_W * 0.55, 0.012, DECK_L * TIP * 0.8]} />
        <meshStandardMaterial color="#8f8a80" roughness={0.6} />
      </mesh>

      {/* White shade canopies. */}
      {canopies.map((c) => (
        <mesh key={c.key} position={c.p}>
          <coneGeometry args={[c.r, 0.05, 6]} />
          <meshStandardMaterial color="#f1efe9" roughness={0.5} emissive="#ffe6c4" emissiveIntensity={0.25} />
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
