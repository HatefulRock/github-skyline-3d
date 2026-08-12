import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing"
import type { ContributionData } from "../data/types"
import type { Landmark, Theme } from "../themes/types"
import { CITY_WIDTH } from "../utils/grid"
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
  const shadowExtent = CITY_WIDTH * 0.75

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={[theme.background.sky[0]]} />
      <fog attach="fog" args={[theme.background.fogColor, theme.background.fogNear, theme.background.fogFar]} />
      <PerspectiveCamera makeDefault position={[camPos.x, camPos.y, camPos.z]} fov={35} />
      <OrbitControls
        target={[target.x, target.y, target.z]}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={90}
      />

      {/* Key light -- tight ortho shadow frustum so the shadow map is spent on
          the city rather than on empty space. */}
      <directionalLight
        position={[18, 30, 14]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
      {/* Cool rim from behind, to separate towers from the night background.
          Kept low and desaturated -- a strong blue rim tints every rooftop
          lilac and the city stops reading as green. */}
      <directionalLight position={[-16, 9, -14]} intensity={0.32} color="#7ea6d8" />
      <ambientLight intensity={0.3} />

      <Ground color={theme.palette.ground} edgeColor={theme.palette.plinth} />
      <DataBuildings data={data} palette={theme.palette} />
      <Landmarks landmarks={theme.landmarks} />
      <Landmarks landmarks={customBuildings} />

      <EffectComposer>
        {/* Shallow focus sells the "physical miniature" look -- but only just
            barely. Focus on the city center and keep the blur subtle; crank
            bokehScale and the whole render goes to mush. */}
        <DepthOfField target={[0, 1.5, 0]} focalLength={0.5} bokehScale={1.8} height={720} />
        <Bloom intensity={0.35} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
