import { RoundedBox } from "@react-three/drei"
import { CITY_DEPTH, CITY_WIDTH } from "../utils/grid"

const MARGIN = 1.6
const THICKNESS = 1.1

/** A thick beveled plinth the city sits on. This is most of what separates a
 *  render that reads as a designed object from one that reads as a chart
 *  floating on an infinite plane. */
export function Ground({ color, edgeColor }: { color: string; edgeColor: string }) {
  const w = CITY_WIDTH + MARGIN * 2
  const d = CITY_DEPTH + MARGIN * 2

  return (
    <group>
      {/* plinth */}
      <RoundedBox
        args={[w, THICKNESS, d]}
        radius={0.16}
        smoothness={4}
        position={[0, -THICKNESS / 2, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={edgeColor} roughness={0.7} metalness={0.15} />
      </RoundedBox>

      {/* inset top face, so the streets and empty plots read against the rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[CITY_WIDTH + 0.5, CITY_DEPTH + 0.5]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}
