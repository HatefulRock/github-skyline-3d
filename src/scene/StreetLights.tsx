import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import { BLOCKS_PER_SIDE, type Layout, STREET } from "../utils/grid"

const POST_H = 0.42
const SPACING = 1.5

interface Lamp {
  key: string
  x: number
  z: number
}

/** Lamp posts down the middle of every street. Small, but they're what makes
 *  the streets read as streets at a glance rather than as empty gutters, and
 *  the emissive heads give bloom something warm to pick out against all the
 *  green. */
export function StreetLights({ layout, color }: { layout: Layout; color: string }) {
  const lamps = useMemo<Lamp[]>(() => {
    const { blockW, blockD, cityWidth, cityDepth } = layout
    const out: Lamp[] = []

    for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
      const cx = -cityWidth / 2 + i * (blockW + STREET) - STREET / 2
      for (let z = -cityDepth / 2 + SPACING * 0.5; z < cityDepth / 2; z += SPACING) {
        out.push({ key: `v${i}-${z.toFixed(2)}`, x: cx, z })
      }
      const cz = -cityDepth / 2 + i * (blockD + STREET) - STREET / 2
      for (let x = -cityWidth / 2 + SPACING * 0.5; x < cityWidth / 2; x += SPACING) {
        // Skip the crossroads so lamps don't stack on top of each other.
        const onVertical = Math.abs(x - (-cityWidth / 2 + 1 * (blockW + STREET) - STREET / 2)) < 0.4 ||
          Math.abs(x - (-cityWidth / 2 + 2 * (blockW + STREET) - STREET / 2)) < 0.4
        if (onVertical) continue
        out.push({ key: `h${i}-${x.toFixed(2)}`, x, z: cz })
      }
    }
    return out
  }, [layout])

  return (
    <group>
      <Instances limit={400} geometry={undefined} castShadow>
        <cylinderGeometry args={[0.022, 0.03, POST_H, 6]} />
        <meshStandardMaterial color="#2a3644" roughness={0.6} metalness={0.4} />
        {lamps.map((l) => (
          <Instance key={l.key} position={[l.x, POST_H / 2, l.z]} />
        ))}
      </Instances>

      <Instances limit={400}>
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
