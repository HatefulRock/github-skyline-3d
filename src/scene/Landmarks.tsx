import type { Landmark } from "../themes/types"

/** Renders both theme-defined landmarks (Singapore's MBS towers, Paris's
 *  Eiffel Tower, ...) and user-added custom buildings -- same shape, same
 *  renderer, just a different source array. */
function LandmarkMesh({
  landmark,
  origin,
  scale,
}: {
  landmark: Landmark
  origin: { x: number; z: number }
  scale: number
}) {
  const { position, size, color, rotationY = 0, type } = landmark
  const s = { x: size.x * scale, y: size.y * scale, z: size.z * scale }
  const centerY = position.y * scale + s.y / 2

  return (
    <mesh
      position={[origin.x + position.x * scale, centerY, origin.z + position.z * scale]}
      rotation={[0, rotationY, 0]}
      castShadow
      receiveShadow
    >
      {type === "box" && <boxGeometry args={[s.x, s.y, s.z]} />}
      {type === "cone" && <coneGeometry args={[s.x / 2, s.y, 4]} />}
      {type === "cylinder" && <cylinderGeometry args={[s.x / 2, s.x / 2, s.y, 12]} />}
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
    </mesh>
  )
}

/** Theme landmarks are authored relative to their plot, so the same theme works
 *  whatever size the city ends up. Custom buildings pass no origin and stay in
 *  world space, matching what the editor's X/Z fields mean. */
export function Landmarks({
  landmarks,
  origin = { x: 0, z: 0 },
  scale = 1,
}: {
  landmarks: Landmark[]
  origin?: { x: number; z: number }
  /** Landmarks are authored against a reference block size; this keeps them
   *  proportional to their plot when the city shrinks or grows. */
  scale?: number
}) {
  return (
    <group>
      {landmarks.map((l) => (
        <LandmarkMesh key={l.id} landmark={l} origin={origin} scale={scale} />
      ))}
    </group>
  )
}
