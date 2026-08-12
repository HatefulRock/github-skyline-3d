import { Environment, Lightformer, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import { ACESFilmicToneMapping } from "three"
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
  const shadowExtent = CITY_WIDTH * 0.7

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={[theme.background.sky[0]]} />
      <fog attach="fog" args={[theme.background.fogColor, theme.background.fogNear, theme.background.fogFar]} />
      <PerspectiveCamera makeDefault position={[camPos.x, camPos.y, camPos.z]} fov={33} />
      <OrbitControls
        target={[target.x, target.y, target.z]}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={90}
      />

      {/* Key light. Tight ortho frustum so the shadow map resolves crisp
          building-to-building shadows instead of smearing them. */}
      <directionalLight
        position={[16, 26, 12]}
        intensity={3.1}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
      {/* Cool rim from behind, kept low and desaturated -- a strong blue rim
          tints every rooftop lilac and the city stops reading as green. */}
      <directionalLight position={[-16, 8, -14]} intensity={0.35} color="#7ea6d8" />
      {/* Deliberately dim: the contrast comes from the key light and AO, and
          lifting ambient is what flattens a render into looking like a toy. */}
      <ambientLight intensity={0.12} />

      {/* Built from Lightformers rather than an HDRI preset so it needs no
          network fetch -- gives the materials something to actually reflect,
          which is what stops them reading as flat plastic. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[10, 12, 8]} scale={[12, 12, 1]} color="#dff0ff" />
        <Lightformer intensity={1.1} position={[-12, 6, -8]} scale={[10, 10, 1]} color="#93b8e8" />
        <Lightformer intensity={0.7} form="ring" position={[0, -6, 0]} scale={16} color="#1b3a2a" />
      </Environment>

      <Ground color={theme.palette.ground} edgeColor={theme.palette.plinth} />
      <DataBuildings data={data} palette={theme.palette} />
      <Landmarks landmarks={theme.landmarks} />
      <Landmarks landmarks={customBuildings} />

      <EffectComposer multisampling={0}>
        {/* Ambient occlusion is the single biggest step away from the "Roblox"
            look -- it darkens the crevices where buildings meet the ground and
            each other, which flat diffuse shading never does. */}
        {/* halfRes keeps this affordable on the software GL renderer CI uses --
            at full res a single frame can exceed the screenshot timeout. */}
        <N8AO aoRadius={1.1} intensity={3.2} distanceFalloff={0.8} quality="medium" halfRes />
        <Bloom intensity={0.26} luminanceThreshold={0.8} luminanceSmoothing={0.22} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.28} darkness={0.82} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}
