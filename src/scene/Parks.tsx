import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { CELL_SIZE, PODIUM_H } from "../utils/grid"

export interface ParkPlot {
  key: string
  x: number
  z: number
  seed: number
}

interface Piece {
  key: string
  position: [number, number, number]
  scale: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}

const LAWN_H = 0.05
const TRUNK_H = 0.2
const BOLLARD_H = 0.1

const LEAF = ["#1c4a2c", "#24583a", "#2f6a3f", "#1a3f30", "#3c7a44"]

function rand(seed: number, k: number): number {
  const h = Math.sin(seed * 91.17 + k * 37.31) * 43758.5453
  return h - Math.floor(h)
}

/** Zero-contribution days drawn as pocket parks: a lawn, a few round trees and
 *  sometimes a lit path. Neighbouring quiet days run together into green
 *  strips, which is what a run of days off should look like. */
export function Parks({ plots, lamp }: { plots: ParkPlot[]; lamp: string }) {
  const { lawns, trunks, crowns, paths, bollards } = useMemo(() => {
    const lawns: Piece[] = []
    const trunks: Piece[] = []
    const crowns: Piece[] = []
    const paths: Piece[] = []
    const bollards: Piece[] = []
    const top = PODIUM_H + LAWN_H

    for (const p of plots) {
      const r = (k: number) => rand(p.seed, k)
      lawns.push({
        key: p.key,
        position: [p.x, PODIUM_H + LAWN_H / 2, p.z],
        scale: [CELL_SIZE * 1.02, LAWN_H, CELL_SIZE * 1.02],
        color: r(1) > 0.5 ? "#17331f" : "#1a3a22",
      })

      const hasPath = r(2) > 0.45
      const alongX = r(3) > 0.5
      if (hasPath) {
        paths.push({
          key: p.key,
          position: [p.x, top + 0.004, p.z],
          scale: alongX ? [CELL_SIZE * 1.02, 0.008, 0.1] : [0.1, 0.008, CELL_SIZE * 1.02],
        })
        if (r(4) > 0.35) {
          const o = (r(5) - 0.5) * CELL_SIZE * 0.6
          bollards.push({
            key: p.key,
            position: alongX ? [p.x + o, top + BOLLARD_H / 2, p.z + 0.09] : [p.x + 0.09, top + BOLLARD_H / 2, p.z + o],
            scale: [1, 1, 1],
          })
        }
      }

      // One big shade tree, or a cluster of two or three smaller ones.
      const count = r(6) > 0.55 ? 1 : 2
      for (let t = 0; t < count; t++) {
        const size = count === 1 ? 0.27 + r(8) * 0.05 : 0.15 + r(10 + t) * 0.08
        // Kept off the path's line, so trees and path don't overlap.
        let ox = (r(20 + t) - 0.5) * CELL_SIZE * 0.55
        let oz = (r(30 + t) - 0.5) * CELL_SIZE * 0.55
        if (hasPath) {
          if (alongX) oz = Math.sign(oz || 1) * Math.max(Math.abs(oz), 0.17)
          else ox = Math.sign(ox || 1) * Math.max(Math.abs(ox), 0.17)
        }
        if (count === 1) {
          ox *= 0.4
          oz *= 0.4
        }
        const trunkH = TRUNK_H * (0.7 + size * 1.6)
        trunks.push({
          key: `${p.key}-${t}`,
          position: [p.x + ox, top + trunkH / 2, p.z + oz],
          scale: [1, trunkH / TRUNK_H, 1],
        })
        crowns.push({
          key: `${p.key}-${t}`,
          position: [p.x + ox, top + trunkH + size * 0.55, p.z + oz],
          scale: [size, size * (0.85 + r(40 + t) * 0.3), size],
          rotation: [r(50 + t) * 3, r(60 + t) * 3, 0],
          color: LEAF[Math.floor(r(70 + t) * LEAF.length)],
        })
      }
    }
    return { lawns, trunks, crowns, paths, bollards }
  }, [plots])

  const cap = (n: number) => Math.max(1, n)

  return (
    <group>
      <Instances limit={cap(lawns.length)} range={lawns.length} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} envMapIntensity={0.3} />
        {lawns.map((l) => (
          <Instance key={l.key} position={l.position} scale={l.scale} color={l.color} />
        ))}
      </Instances>

      <Instances limit={cap(paths.length)} range={paths.length} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a5148" roughness={0.8} metalness={0} />
        {paths.map((l) => (
          <Instance key={l.key} position={l.position} scale={l.scale} />
        ))}
      </Instances>

      <Instances limit={cap(trunks.length)} range={trunks.length} castShadow>
        <cylinderGeometry args={[0.014, 0.022, TRUNK_H, 5]} />
        <meshStandardMaterial color="#3b2f25" roughness={0.9} />
        {trunks.map((l) => (
          <Instance key={l.key} position={l.position} scale={l.scale} />
        ))}
      </Instances>

      {/* Low-poly crowns. Flat-shaded on purpose: the facets catch the key
          light and read as foliage, where a smooth sphere reads as a ball. */}
      <Instances limit={cap(crowns.length)} range={crowns.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.85} metalness={0} flatShading envMapIntensity={0.5} />
        {crowns.map((l) => (
          <Instance key={l.key} position={l.position} scale={l.scale} rotation={l.rotation} color={l.color} />
        ))}
      </Instances>

      <Instances limit={cap(bollards.length)} range={bollards.length}>
        <cylinderGeometry args={[0.018, 0.018, BOLLARD_H, 6]} />
        <meshStandardMaterial color={lamp} emissive={lamp} emissiveIntensity={2.6} toneMapped={false} />
        {bollards.map((l) => (
          <Instance key={l.key} position={l.position} />
        ))}
      </Instances>
    </group>
  )
}
