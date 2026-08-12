import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Layout } from "../utils/grid"
import { lampPositions } from "./lamps"

const POST_H = 0.42

/** Lamp posts down the middle of every street. Small, but they're what makes
 *  the streets read as streets at a glance rather than as empty gutters, and
 *  the emissive heads give bloom something warm to pick out against all the
 *  green.
 *
 *  The pool of light each one throws is painted into the ground texture rather
 *  than lit for real -- a few hundred point lights would be unrenderable, and
 *  the pools are what the reflective street surface actually picks up. */
export function StreetLights({ layout, color }: { layout: Layout; color: string }) {
  const lamps = useMemo(() => lampPositions(layout), [layout])

  return (
    <group>
      <Instances limit={600} castShadow>
        <cylinderGeometry args={[0.022, 0.03, POST_H, 6]} />
        <meshStandardMaterial color="#2a3644" roughness={0.6} metalness={0.4} />
        {lamps.map((l) => (
          <Instance key={l.key} position={[l.x, POST_H / 2, l.z]} />
        ))}
      </Instances>

      <Instances limit={600}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3.2}
          roughness={0.3}
          toneMapped={false}
        />
        {lamps.map((l) => (
          <Instance key={l.key} position={[l.x, POST_H + 0.03, l.z]} />
        ))}
      </Instances>
    </group>
  )
}
