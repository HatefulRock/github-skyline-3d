import { DoubleSide } from "three"

/** Gardens by the Bay's Supertree Grove, beside Marina Bay Sands.
 *
 *  Each tree is a tapering trunk under an open funnel canopy, lit violet with a
 *  bright rim -- at night the silhouette and the glow are the whole of what
 *  makes them recognisable, so there's no attempt at the steel lattice. */
const TREES: { x: number; z: number; h: number }[] = [
  { x: -2.55, z: 1.05, h: 1.75 },
  { x: -2.05, z: 1.75, h: 2.25 },
  { x: -2.75, z: 2.2, h: 1.35 },
  { x: -1.95, z: 2.75, h: 1.55 },
  { x: -2.6, z: 0.15, h: 1.25 },
  { x: -2.15, z: 0.6, h: 2.0 },
  { x: -2.85, z: 2.95, h: 1.1 },
  { x: -1.75, z: 0.05, h: 1.45 },
  { x: -1.7, z: 2.15, h: 1.2 },
]

const TRUNK = "#2c2238"
const GLOW = "#9b3df0"
const RIM = "#ff8be6"
const RIBS = 10

export function Supertrees({ center, scale }: { center: { x: number; z: number }; scale: number }) {
  // The two tallest are joined by the OCBC Skyway.
  const [a, b] = [...TREES].sort((p, q) => q.h - p.h)
  const skyY = Math.min(a.h, b.h) * 0.72
  const dx = b.x - a.x
  const dz = b.z - a.z
  const span = Math.hypot(dx, dz)

  return (
    <group position={[center.x, 0, center.z]} scale={scale}>
      {TREES.map((t, i) => {
        const k = 0.55 + t.h * 0.22
        const trunkH = t.h * 0.84
        const canopyH = 0.3 * k
        const canopyR = 0.36 * k
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <mesh position={[0, trunkH / 2, 0]} castShadow>
              <cylinderGeometry args={[0.035 * k, 0.09 * k, trunkH, 8]} />
              <meshStandardMaterial color={TRUNK} roughness={0.7} emissive={GLOW} emissiveIntensity={0.12} />
            </mesh>
            {/* Funnel canopy, dark, with the light carried by ribs and rims
                rather than by the whole surface -- lit solid it reads as a
                purple dish. */}
            <mesh position={[0, trunkH + canopyH / 2 - 0.02, 0]} castShadow>
              <cylinderGeometry args={[canopyR, 0.05 * k, canopyH, 18, 1, true]} />
              <meshStandardMaterial
                color="#1d1526"
                roughness={0.6}
                emissive={GLOW}
                emissiveIntensity={0.18}
                side={DoubleSide}
              />
            </mesh>
            {Array.from({ length: RIBS }, (_, r) => {
              const a = (r / RIBS) * Math.PI * 2
              const lean = Math.atan2(canopyR - 0.05 * k, canopyH)
              return (
                <mesh
                  key={r}
                  position={[Math.cos(a) * (canopyR * 0.55), trunkH + canopyH / 2 - 0.02, Math.sin(a) * (canopyR * 0.55)]}
                  rotation={[0, -a, -lean]}
                >
                  <boxGeometry args={[0.012 * k, Math.hypot(canopyH, canopyR), 0.012 * k]} />
                  <meshBasicMaterial color={GLOW} toneMapped={false} />
                </mesh>
              )
            })}
            <mesh position={[0, trunkH + canopyH - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[canopyR, 0.014 * k, 6, 36]} />
              <meshBasicMaterial color={RIM} toneMapped={false} />
            </mesh>
            {/* Light bands up the trunk. */}
            {[0.3, 0.55, 0.78].map((f) => (
              <mesh key={f} position={[0, trunkH * f, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[(0.09 - 0.055 * f) * k + 0.006, 0.008 * k, 4, 16]} />
                <meshBasicMaterial color={GLOW} toneMapped={false} />
              </mesh>
            ))}
          </group>
        )
      })}
      <mesh position={[(a.x + b.x) / 2, skyY, (a.z + b.z) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
        <boxGeometry args={[span, 0.022, 0.04]} />
        <meshStandardMaterial color="#2c2238" emissive="#c79bff" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
