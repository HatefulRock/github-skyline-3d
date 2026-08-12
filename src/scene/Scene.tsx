import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import type { ContributionData } from "../data/types"
import type { Landmark, Theme } from "../themes/types"
import { DataBuildings } from "./DataBuildings"
import { Ground } from "./Ground"
import { Landmarks } from "./Landmarks"

interface Props {
  theme: Theme
  data: ContributionData
  customBuildings: Landmark[]
}

export function Scene({ theme, data, customBuildings }: Props) {
  const { position: camPos, target } = theme.camera

  return (
    <Canvas shadows dpr={[1, 2]}>
      <color attach="background" args={[theme.background.sky[0]]} />
      <fog attach="fog" args={[theme.background.fogColor, theme.background.fogNear, theme.background.fogFar]} />
      <PerspectiveCamera makeDefault position={[camPos.x, camPos.y, camPos.z]} fov={45} />
      <OrbitControls target={[target.x, target.y, target.z]} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={80} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[15, 25, 10]} intensity={1.2} castShadow />
      <Stars radius={80} depth={40} count={2000} factor={2} fade />
      <Ground color={theme.palette.ground} />
      <DataBuildings data={data} palette={theme.palette} />
      <Landmarks landmarks={theme.landmarks} />
      <Landmarks landmarks={customBuildings} />
    </Canvas>
  )
}
