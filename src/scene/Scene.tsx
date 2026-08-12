import { Environment, Lightformer, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import { useMemo } from "react"
import { ACESFilmicToneMapping } from "three"
import type { ContributionData } from "../data/types"
import type { Landmark, Theme } from "../themes/types"
import { makeLayout, trimLeadingEmptyWeeks } from "../utils/grid"
import { DataBuildings } from "./DataBuildings"
import { Ground } from "./Ground"
import { Landmarks } from "./Landmarks"
import { Sky } from "./Sky"
import { StreetLights } from "./StreetLights"

interface Props {
  theme: Theme
  data: ContributionData
  customBuildings: Landmark[]
}

/** City width the theme cameras were authored against, and the block width
 *  landmarks were authored against. Both are scaled from these so framing and
 *  landmark proportions hold however large the city ends up. */
const REFERENCE_CITY_WIDTH = 22.3
const REFERENCE_BLOCK_W = 6.44

/** Narrower than the 33 this was framed at originally. The city occupied well
 *  under half the frame and the rest was empty background; the tighter lens
 *  fills it without having to move the authored camera positions. */
const FOV = 28

/** A couple of degrees of camera roll, applied through the up vector so
 *  OrbitControls keeps working. A dead-level horizon is one of the things that
 *  makes a 3/4 view read as a diagram rather than as a photograph. */
const ROLL = 0.045

export function Scene({ theme, data, customBuildings }: Props) {
  const weeks = useMemo(() => trimLeadingEmptyWeeks(data.weeks), [data])
  const layout = useMemo(() => makeLayout(weeks.length), [weeks])

  const { position: camPos, target } = theme.camera
  // Floored: towers keep their absolute height, so pulling the camera all the
  // way in on a narrow city crops them off the top and sides.
  const fit = Math.max(0.95, layout.cityWidth / REFERENCE_CITY_WIDTH)
  const landmarkScale = layout.blockW / REFERENCE_BLOCK_W
  const cam: [number, number, number] = [camPos.x * fit, camPos.y * fit, camPos.z * fit]
  const shadowExtent = layout.cityWidth * 0.7

  // Fog scaled to the city rather than fixed in world units. The old absolute
  // distances started further away than the whole city was wide, so fog was
  // switched off in practice and the back rows read as crisp as the front.
  const fogNear = layout.cityWidth * theme.background.fogNearFactor
  const fogFar = layout.cityWidth * theme.background.fogFarFactor

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.28 }}
    >
      <color attach="background" args={[theme.background.sky[0]]} />
      <fog attach="fog" args={[theme.background.fogColor, fogNear, fogFar]} />
      <PerspectiveCamera
        makeDefault
        position={cam}
        fov={FOV}
        up={[Math.sin(ROLL), Math.cos(ROLL), 0]}
      />
      <OrbitControls
        target={[target.x, target.y, target.z]}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={90}
      />

      <Sky top={theme.background.sky[0]} horizon={theme.background.sky[1]} />

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
      {/* Cool rim from behind. Kept low to the ground on purpose: at height it
          grazed every rooftop and tinted the whole skyline lilac, which is why
          it used to be dialled down to almost nothing. Low and strong instead,
          it catches the back edges of the towers and separates them from the
          sky, which is the whole point of a rim. */}
      <directionalLight position={[-18, 5, -16]} intensity={0.85} color="#7ea6d8" />
      {/* Warm fill from the camera side, just enough to keep the faces turned
          away from the key from crushing to solid black. */}
      <directionalLight position={[18, 7, 20]} intensity={0.2} color="#ffc089" />
      {/* Deliberately dim: the contrast comes from the key light and AO, and
          lifting ambient is what flattens a render into looking like a toy. */}
      <ambientLight intensity={0.16} />

      {/* Built from Lightformers rather than an HDRI preset so it needs no
          network fetch -- gives the materials something to actually reflect,
          which is what stops them reading as flat plastic. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} position={[10, 12, 8]} scale={[12, 12, 1]} color="#dff0ff" />
        <Lightformer intensity={1.2} position={[-12, 6, -8]} scale={[10, 10, 1]} color="#93b8e8" />
        <Lightformer intensity={0.9} position={[0, 3, 14]} scale={[10, 6, 1]} color="#ffbe86" />
        <Lightformer intensity={0.7} form="ring" position={[0, -6, 0]} scale={16} color="#1b3a2a" />
      </Environment>

      <Ground
        layout={layout}
        color={theme.palette.ground}
        edgeColor={theme.palette.plinth}
        podiumColor={theme.palette.podium}
        lampColor={theme.palette.lamp}
      />
      <DataBuildings weeks={weeks} layout={layout} palette={theme.palette} />
      <StreetLights layout={layout} color={theme.palette.lamp} />
      <Landmarks landmarks={theme.landmarks} plotCenter={layout.blockCenter} scale={landmarkScale} />
      <Landmarks landmarks={customBuildings} />

      <EffectComposer multisampling={0}>
        {/* Ambient occlusion is the single biggest step away from the "Roblox"
            look -- it darkens the crevices where buildings meet the ground and
            each other, which flat diffuse shading never does. */}
        <N8AO aoRadius={1.15} intensity={3.4} distanceFalloff={0.8} quality="high" />
        {/* Opened up now that the windows and the lamps are warm: bloom over a
            single hue just looks like haze, but bloom across a warm/cool split
            is what reads as a lit city. */}
        <Bloom intensity={0.46} luminanceThreshold={0.62} luminanceSmoothing={0.26} radius={0.7} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.28} darkness={0.82} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}
