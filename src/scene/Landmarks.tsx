import type { Landmark } from "../themes/types"

/** Renders both theme-defined landmarks (Singapore's MBS towers, Paris's
 *  Eiffel Tower, ...) and user-added custom buildings -- same shape, same
 *  renderer, just a different source array. */
function LandmarkMesh({ landmark }: { landmark: Landmark }) {
  const { position, size, color, rotationY = 0, type } = landmark
  const centerY = position.y + size.y / 2

  return (
    <mesh position={[position.x, centerY, position.z]} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      {type === "box" && <boxGeometry args={[size.x, size.y, size.z]} />}
      {type === "cone" && <coneGeometry args={[size.x / 2, size.y, 4]} />}
      {type === "cylinder" && <cylinderGeometry args={[size.x / 2, size.x / 2, size.y, 12]} />}
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
    </mesh>
  )
}

export function Landmarks({ landmarks }: { landmarks: Landmark[] }) {
  return (
    <group>
      {landmarks.map((l) => (
        <LandmarkMesh key={l.id} landmark={l} />
      ))}
    </group>
  )
}
