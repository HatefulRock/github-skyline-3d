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
  envMapIntensity?: number
  /** Tiles the city's window texture over this piece as an emissive map.
   *
   *  Without this a landmark is the only thing in the city with a blank facade,
   *  which stops it reading as a building at all once every data tower around
   *  it is lit. `u` is how many times the texture wraps horizontally -- on a
   *  4-sided lathe u:4 puts one copy on each face -- and `v` how many storeys
   *  tall it tiles. The map carries its own colour, so the piece's `emissive`
   *  tint is ignored when this is set. */
  windows?: { u: number; v: number; intensity?: number }
}

export interface Palette {
  /** Top surface the blocks and streets sit on. */
  ground: string
  /** Side/rim of the plinth the whole city sits on. */
  plinth: string
  /** Raised pad each city block sits on -- between `ground` and `levels[0]`. */
  podium: string
  /** 5-step intensity ramp, low activity -> high activity. Step 0 is the empty
   *  plot low-rise, so keep it clearly lighter than `ground`. */
  levels: [string, string, string, string, string]
  /** Emissive tint on rooftops -- what bloom picks up as city lights. */
  glow: string
  /** Dominant interior-light colour behind the windows. Deliberately NOT the
   *  building hue: green windows on green walls is what collapses the city into
   *  a single-hue silhouette, and the warm/cool complement is most of what
   *  makes it read as lit rather than merely tinted. */
  window: string
  /** Minority window tint, mixed into a fraction of the windows so a facade
   *  isn't one flat colour. */
  windowAlt: string
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
    /** Fog distances as multiples of the city's width, not absolute world
     *  units. The city resizes with the data, and fixed distances tuned at one
     *  size silently switch fog off altogether at another. */
    fogNearFactor: number
    fogFarFactor: number
  }
  palette: Palette
  landmarks: Landmark[]
  camera: {
    position: Vec3
    target: Vec3
  }
}
