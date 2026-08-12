import { useEffect, useMemo } from "react"
import { RepeatWrapping, type Texture } from "three"
import type { Landmark, Palette } from "../themes/types"
import { makeWindowTexture } from "./windowTexture"

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
  windowMap,
}: {
  landmark: Landmark
  origin: { x: number; z: number }
  scale: number
  windowMap: Texture
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
    envMapIntensity = 1.2,
    windows,
  } = landmark

  // Each piece needs its own repeat, so it gets its own view of the shared
  // canvas. A clone shares the underlying image and carries only a separate
  // transform, so this costs a texture handle rather than another bitmap.
  const facade = useMemo(() => {
    if (!windows) return null
    const t = windowMap.clone()
    t.needsUpdate = true
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.repeat.set(windows.u, windows.v)
    return t
  }, [windows, windowMap])
  useEffect(() => () => facade?.dispose(), [facade])

  const w = size.x * scale
  const h = size.y * scale
  const d = size.z * scale
  const rx = rotation?.x ?? 0
  const ry = rotation?.y ?? 0
  const rz = rotation?.z ?? 0

  // Round sections are generated square and squashed on z, so a "cylinder"
  // can still be a rectangular slab.
  const zSquash = type === "box" ? 1 : d / w
  // A 4-sided lathe generates as a diamond, so square sections need a 45deg
  // nudge to sit axis-aligned. Boxes are already axis-aligned -- applying it
  // to them too silently rotated every box landmark off the street grid.
  const lathePhase = type !== "box" && sides === 4 ? Math.PI / 4 : 0

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
          // The window map carries its own colour, so the emissive tint is left
          // white and the map alone decides what glows.
          emissive={facade ? "#ffffff" : (emissive ?? "#000000")}
          emissiveMap={facade}
          emissiveIntensity={facade ? (windows?.intensity ?? 1) : emissive ? emissiveIntensity : 0}
          envMapIntensity={envMapIntensity}
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
  palette,
  plotCenter,
  scale = 1,
}: {
  landmarks: Landmark[]
  palette: Palette
  /** Resolves a plot index to its world centre. Omitted for world-space pieces. */
  plotCenter?: (plot: number) => { x: number; z: number }
  scale?: number
}) {
  const windowMap = useMemo(
    () => makeWindowTexture(0, palette.window, palette.windowAlt),
    [palette.window, palette.windowAlt],
  )
  useEffect(() => () => windowMap.dispose(), [windowMap])

  return (
    <group>
      {landmarks.map((l) => (
        <LandmarkMesh
          key={l.id}
          landmark={l}
          origin={plotCenter ? plotCenter(l.plot ?? 0) : { x: 0, z: 0 }}
          scale={plotCenter ? scale : 1}
          windowMap={windowMap}
        />
      ))}
    </group>
  )
}
