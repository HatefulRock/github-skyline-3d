export interface Vec3 {
  x: number
  y: number
  z: number
}

/** A fixed decorative shape that isn't driven by contribution data --
 *  e.g. one Marina Bay Sands tower, or the Eiffel Tower silhouette. */
export interface Landmark {
  id: string
  type: "box" | "cone" | "cylinder"
  /** Ground-anchored position -- y is the base, not the center. */
  position: Vec3
  size: Vec3
  color: string
  rotationY?: number
}

export interface Palette {
  /** Top surface the blocks and streets sit on. */
  ground: string
  /** Side/rim of the plinth the whole city sits on. */
  plinth: string
  /** 5-step intensity ramp, low activity -> high activity. Step 0 must stay
   *  clearly lighter than `ground`, or zero-contribution days disappear. */
  levels: [string, string, string, string, string]
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
