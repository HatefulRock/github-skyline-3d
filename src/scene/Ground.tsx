import { MeshReflectorMaterial, RoundedBox } from "@react-three/drei"
import { useMemo } from "react"
import { CanvasTexture, Color, LinearFilter } from "three"
import { BLOCKS_PER_SIDE, type Layout, PODIUM_H, STREET } from "../utils/grid"
import { makeGroundMaps } from "./groundTexture"

const MARGIN = 1.6
const THICKNESS = 1.1
const PODIUM_MARGIN = 0.22

/** Vertical gradient down the plinth's side, dark at the bottom. A flat-colour
 *  slab edge reads as a card the city is printed on; a graded one reads as a
 *  solid object with the light falling off down it. */
function makePlinthTexture(edgeColor: string): CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 4
  canvas.height = 128
  const ctx = canvas.getContext("2d")!
  const top = new Color(edgeColor)
  const bottom = top.clone().multiplyScalar(0.55)
  const g = ctx.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, `#${top.getHexString()}`)
  g.addColorStop(1, `#${bottom.getHexString()}`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 128)

  const tex = new CanvasTexture(canvas)
  tex.magFilter = LinearFilter
  tex.minFilter = LinearFilter
  return tex
}

/** A thick beveled plinth the city sits on. This is most of what separates a
 *  render that reads as a designed object from one that reads as a chart
 *  floating on an infinite plane. */
export function Ground({
  layout,
  color,
  edgeColor,
  podiumColor,
  lampColor,
}: {
  layout: Layout
  color: string
  edgeColor: string
  podiumColor: string
  lampColor: string
}) {
  const w = layout.cityWidth + MARGIN * 2
  const d = layout.cityDepth + MARGIN * 2
  // The wet surface runs right out to the plinth's bevel rather than stopping
  // at the city's edge. The apron around the city is the only large piece of
  // open ground in the frame, so it's where a reflection of the skyline is
  // actually legible -- confined to the streets it's just a sliver between
  // buildings and the effect goes unnoticed.
  const planeW = w - 0.34
  const planeD = d - 0.34

  const { surface, roughness } = useMemo(
    () => makeGroundMaps(layout, planeW, planeD, color, lampColor),
    [layout, planeW, planeD, color, lampColor],
  )
  const plinthMap = useMemo(() => makePlinthTexture(edgeColor), [edgeColor])

  const pads = useMemo(() => {
    const { blockW, blockD, cityWidth, cityDepth } = layout
    const out: { key: number; x: number; z: number }[] = []
    for (let b = 0; b < BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; b++) {
      const bx = b % BLOCKS_PER_SIDE
      const bz = Math.floor(b / BLOCKS_PER_SIDE)
      out.push({
        key: b,
        x: -cityWidth / 2 + bx * (blockW + STREET) + blockW / 2,
        z: -cityDepth / 2 + bz * (blockD + STREET) + blockD / 2,
      })
    }
    return out
  }, [layout])

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
        <meshStandardMaterial map={plinthMap} roughness={0.7} metalness={0.15} />
      </RoundedBox>

      {/* Street surface. Reflective, because in a night city the ground is
          where nearly all the perceived production value lives -- a matte plane
          throws away every one of the lit towers standing on it. The roughness
          map keeps the reflection to the roadway and the puddles, so it stays a
          wet street rather than a mirror the whole city floats on. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[planeW, planeD]} />
        <MeshReflectorMaterial
          map={surface}
          roughnessMap={roughness}
          resolution={1024}
          mixBlur={0.85}
          mixStrength={2.7}
          blur={[180, 50]}
          mirror={0.62}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Raised block pads. */}
      {pads.map((p) => (
        <RoundedBox
          key={p.key}
          args={[
            layout.blockW + PODIUM_MARGIN * 2,
            PODIUM_H,
            layout.blockD + PODIUM_MARGIN * 2,
          ]}
          radius={0.03}
          smoothness={2}
          position={[p.x, PODIUM_H / 2, p.z]}
          receiveShadow
          castShadow
        >
          <meshStandardMaterial color={podiumColor} roughness={0.82} metalness={0.08} />
        </RoundedBox>
      ))}
    </group>
  )
}
