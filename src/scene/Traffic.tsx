// Cars driving the streets: a white headlight and a red tail light each, which
// is all that reads of a car at this scale at night.
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { type InstancedMesh, Object3D } from "three"
import { BLOCKS_PER_SIDE, type Layout, STREET } from "../utils/grid"
import { sceneClock } from "./sceneClock"

const LANE = STREET * 0.2
const CAR_Y = 0.06
/** Roughly how fast traffic moves, in world units per second. Each car's real
 *  speed is rounded so it drives a whole number of laps per scene loop, which
 *  keeps the README animation seamless. */
const SPEED = 1.6

interface Car {
  axis: "x" | "z"
  line: number
  lane: number
  dir: 1 | -1
  offset: number
  length: number
}

export function Traffic({ layout }: { layout: Layout }) {
  const { blockW, blockD, cityWidth, cityDepth } = layout
  const cars = useMemo(() => {
    let seed = 11
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const out: Car[] = []
    for (let i = 1; i < BLOCKS_PER_SIDE; i++) {
      const vx = -cityWidth / 2 + i * (blockW + STREET) - STREET / 2
      const hz = -cityDepth / 2 + i * (blockD + STREET) - STREET / 2
      for (const dir of [1, -1] as const) {
        for (let c = 0; c < 6; c++) {
          out.push({ axis: "z", line: vx, lane: dir * LANE, dir, offset: rand() * cityDepth, length: cityDepth })
          out.push({ axis: "x", line: hz, lane: -dir * LANE, dir, offset: rand() * cityWidth, length: cityWidth })
        }
      }
    }
    return out
  }, [blockW, blockD, cityWidth, cityDepth])

  const heads = useRef<InstancedMesh>(null)
  const tails = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    if (!heads.current || !tails.current) return
    const t = sceneClock.now(clock.elapsedTime)
    const loop = sceneClock.loopSeconds
    cars.forEach((c, i) => {
      const laps = Math.max(1, Math.round((SPEED * loop) / c.length))
      const speed = (laps * c.length) / loop
      const s = ((c.offset + t * speed * c.dir) % c.length + c.length) % c.length - c.length / 2
      for (const [mesh, back] of [[heads.current!, 0], [tails.current!, 1]] as const) {
        const along = s - (back ? 0.26 * c.dir : 0)
        if (c.axis === "z") dummy.position.set(c.line + c.lane, CAR_Y, along)
        else dummy.position.set(along, CAR_Y, c.line + c.lane)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
    })
    heads.current.instanceMatrix.needsUpdate = true
    tails.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={heads} args={[undefined, undefined, cars.length]}>
        <boxGeometry args={[0.11, 0.06, 0.11]} />
        <meshBasicMaterial color="#fff3d6" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={tails} args={[undefined, undefined, cars.length]}>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshBasicMaterial color="#ff3b30" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
