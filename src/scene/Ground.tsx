import { RoundedBox } from "@react-three/drei"
import { useMemo } from "react"
import type { Layout } from "../utils/grid"
import { makeGroundTexture } from "./groundTexture"

const MARGIN = 1.6
const THICKNESS = 1.1

/** A thick beveled plinth the city sits on. This is most of what separates a
 *  render that reads as a designed object from one that reads as a chart
 *  floating on an infinite plane. */
export function Ground({
  layout,
  color,
  edgeColor,
}: {
  layout: Layout
  color: string
  edgeColor: string
}) {
  const planeW = layout.cityWidth + 0.5
  const planeD = layout.cityDepth + 0.5
  const w = layout.cityWidth + MARGIN * 2
  const d = layout.cityDepth + MARGIN * 2

  const surface = useMemo(
    () => makeGroundTexture(layout, planeW, planeD, color),
    [layout, planeW, planeD, color],
  )

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

      {/* Inset top face carrying the block pads and street markings. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[planeW, planeD]} />
        <meshStandardMaterial map={surface} roughness={0.88} metalness={0.05} />
      </mesh>
    </group>
  )
}
