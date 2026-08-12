import type { Landmark } from "../themes/types"

/** Renders one landmark piece.
 *
 *  The mesh is offset half its height inside a group placed at the piece's
 *  base, so `rotation` pivots about the foot rather than the centre -- that's
 *  what lets legs splay outward from a common footing instead of sliding
 *  through the ground. */
function LandmarkMesh({
  landmark,
  origin,
  scale,
}: {
  landmark: Landmark
  origin: { x: number; z: number }
  scale: number
}) {
  const {
    position,
    size,
    color,
    rotation,
    type,
    taper = 0.6,
    sides = 4,
    roughness = 0.35,
    metalness = 0.25,
    emissive,
    emissiveIntensity = 0,
  } = landmark

  const w = size.x * scale
  const h = size.y * scale
  const d = size.z * scale
  const rx = rotation?.x ?? 0
  const ry = rotation?.y ?? 0
  const rz = rotation?.z ?? 0

  // Round sections are generated square and squashed on z, so a "cylinder"
  // can still be a rectangular slab.
  const zSquash = type === "box" ? 1 : d / w
  // A 4-sided lathe starts on a diagonal; nudge it so flats face the camera.
  const lathePhase = sides === 4 ? Math.PI / 4 : 0

  return (
    <group
      position={[origin.x + position.x * scale, position.y * scale, origin.z + position.z * scale]}
      rotation={[rx, ry, rz]}
    >
      <mesh
        position={[0, h / 2, 0]}
        rotation={[0, lathePhase, 0]}
        scale={[1, 1, zSquash]}
        castShadow
        receiveShadow
      >
        {type === "box" && <boxGeometry args={[w, h, d]} />}
        {type === "cylinder" && <cylinderGeometry args={[w / 2, w / 2, h, sides]} />}
        {type === "prism" && <cylinderGeometry args={[w / 2, w / 2, h, sides]} />}
        {type === "frustum" && <cylinderGeometry args={[(w / 2) * taper, w / 2, h, sides]} />}
        {type === "cone" && <cylinderGeometry args={[0, w / 2, h, sides]} />}
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? emissiveIntensity : 0}
          envMapIntensity={1.2}
        />
      </mesh>
    </group>
  )
}

/** Theme landmarks are authored relative to their plot, so the same theme works
 *  whatever size the city ends up. Custom buildings pass no resolver and stay
 *  in world space, matching what the editor's X/Z fields mean. */
export function Landmarks({
  landmarks,
  plotCenter,
  scale = 1,
}: {
  landmarks: Landmark[]
  /** Resolves a plot index to its world centre. Omitted for world-space pieces. */
  plotCenter?: (plot: number) => { x: number; z: number }
  scale?: number
}) {
  return (
    <group>
      {landmarks.map((l) => (
        <LandmarkMesh
          key={l.id}
          landmark={l}
          origin={plotCenter ? plotCenter(l.plot ?? 0) : { x: 0, z: 0 }}
          scale={plotCenter ? scale : 1}
        />
      ))}
    </group>
  )
}
