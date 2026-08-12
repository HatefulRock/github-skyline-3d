export interface Vec3 {
  x: number
  y: number
  z: number
}

export type LandmarkKind = "box" | "cylinder" | "frustum" | "cone" | "prism"

/** A fixed decorative shape that isn't driven by contribution data --
 *  e.g. one Marina Bay Sands leg, or a section of the Eiffel Tower.
 *
 *  Positions are relative to the centre of the landmark's plot, and `y` is the
 *  base rather than the centre, so rotation happens about the foot of the
 *  piece. That's what makes splayed legs expressible. */
export interface Landmark {
  id: string
  type: LandmarkKind
  /** Which of the reserved block slots this piece belongs to. */
  plot?: number
  position: Vec3
  /** x = width (or base diameter), y = height, z = depth. Round shapes are
   *  built square and scaled on z, so they can be rectangular too. */
  size: Vec3
  /** frustum/cone: top width as a fraction of the base. */
  taper?: number
  /** Radial segments. 4 gives a square section, higher approaches a cylinder. */
  sides?: number
  /** Radians, applied about the piece's base. */
  rotation?: Vec3
  color: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
}

export interface Palette {
  /** Top surface the blocks and streets sit on. */
  ground: string
  /** Side/rim of the plinth the whole city sits on. */
  plinth: string
  /** 5-step intensity ramp, low activity -> high activity. Step 0 is the empty
   *  plot low-rise, so keep it clearly lighter than `ground`. */
  levels: [string, string, string, string, string]
  /** Emissive tint on rooftops -- what bloom picks up as city lights. */
  glow: string
  /** Warm point-light colour used for street lamps. */
  lamp: string
}

export interface Theme {
  id: string
  name: string
  background: {
    /** Sky gradient, top color -> horizon color. */
    sky: [string, string]
    fogColor: string
    fogNear: number
    fogFar: number
  }
  palette: Palette
  landmarks: Landmark[]
  camera: {
    position: Vec3
    target: Vec3
  }
}
