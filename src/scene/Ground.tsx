import { GRID_DEPTH, GRID_WIDTH } from "../utils/grid"

export function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -0.01, 0]} receiveShadow>
      <planeGeometry args={[GRID_WIDTH + 40, GRID_DEPTH + 20]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
