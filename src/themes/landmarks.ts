import type { Landmark } from "./types"

// Landmark geometry, kept separate from the themes so several themes can
// compose the same buildings into different plots.

// ---------------------------------------------------------------- Marina Bay
const glass = "#aec3d8"
const gold = "#e8b44a"

const PODIUM_H = 0.5
const TOWER_LEG_H = 2.5
const TOWER_SLAB_H = 3.6
const TOWER_Z = 1.5

const SLAB_W = 1.0
const SLAB_D = 1.12
/** A 4-sided lathe puts its vertices at `radius`, so the axis-aligned face sits
 *  at radius/sqrt(2). Every measurement that has to line up against the slab --
 *  the legs especially -- has to go through this, or it silently overhangs. */
const SLAB_FACE_X = SLAB_W / (2 * Math.SQRT2)

const LEG_W = 0.34
const LEG_D = 0.78
/** Sunk into the podium. Rotating a box about its base tilts its bottom face,
 *  so a leg that starts exactly at ground level shows a wedge-shaped foot. */
const LEG_SINK = 0.28
const LEG_H = TOWER_LEG_H + LEG_SINK
/** The old lean was 7.7deg, which closed the atrium almost completely and left
 *  the towers reading as plain columns under a plank. The splayed void is the
 *  building's signature, so the legs now lean hard enough to open it. */
const LEG_LEAN = 0.192 // ~11deg
/** Legs meet the slab flush with its outer face, then splay out from there. */
const LEG_TOP_X = SLAB_FACE_X - LEG_W / 2 - 0.02
const LEG_BASE_X = LEG_TOP_X + LEG_H * Math.sin(LEG_LEAN)

const SLAB_Y = PODIUM_H + TOWER_LEG_H - 0.28
const DECK_Y = SLAB_Y + TOWER_SLAB_H
const DECK_W = 1.38
const DECK_L = 5.9
const DECK_Z = -0.6
const DECK_H = 0.3
const DECK_END = DECK_Z - DECK_L / 2

const glassMat = {
  color: glass,
  roughness: 0.1,
  metalness: 0.42,
  envMapIntensity: 1.15,
} as const

function mbsTower(plot: number, index: number, z: number): Landmark[] {
  return [
    // The signature inverted-V: two splayed legs merging into the slab above.
    {
      id: `mbs-${index}-leg-l`,
      type: "box",
      plot,
      position: { x: -LEG_BASE_X, y: PODIUM_H - LEG_SINK, z },
      size: { x: LEG_W, y: LEG_H, z: LEG_D },
      rotation: { x: 0, y: 0, z: -LEG_LEAN },
      // The legs are hotel floors too. Left blank they read as a
      // separate white structure propping up a lit tower.
      windows: { u: 2, v: 7, intensity: 0.7 },
      ...glassMat,
    },
    {
      id: `mbs-${index}-leg-r`,
      type: "box",
      plot,
      position: { x: LEG_BASE_X, y: PODIUM_H - LEG_SINK, z },
      size: { x: LEG_W, y: LEG_H, z: LEG_D },
      rotation: { x: 0, y: 0, z: LEG_LEAN },
      // The legs are hotel floors too. Left blank they read as a
      // separate white structure propping up a lit tower.
      windows: { u: 2, v: 7, intensity: 0.7 },
      ...glassMat,
    },
    // Slab, gently tapered rather than a straight prism.
    {
      id: `mbs-${index}-slab`,
      type: "frustum",
      plot,
      position: { x: 0, y: SLAB_Y, z },
      size: { x: SLAB_W, y: TOWER_SLAB_H + 0.1, z: SLAB_D },
      taper: 0.9,
      sides: 4,
      // One copy per face, roughly a storey per city voxel up the height.
      windows: { u: 5, v: 13, intensity: 0.8 },
      ...glassMat,
    },
  ]
}

export function makeMarinaBaySands(plot: number): Landmark[] {
  return [
  // Podium. The real thing sits on a mall the size of the towers' footprint,
  // and without it the legs spring straight out of bare paving -- the only
  // building in the city not planted on something.
  {
    id: "mbs-podium-base",
    type: "box",
    plot,
    position: { x: 0, y: 0, z: 0 },
    size: { x: 2.7, y: 0.28, z: 5.0 },
    color: "#333f4b",
    roughness: 0.72,
    metalness: 0.1,
  },
  {
    id: "mbs-podium-top",
    type: "box",
    plot,
    position: { x: 0, y: 0.28, z: 0 },
    size: { x: 2.25, y: 0.22, z: 4.5 },
    color: "#3e4b58",
    roughness: 0.68,
    metalness: 0.12,
  },
  ...mbsTower(plot, 1, -TOWER_Z),
  ...mbsTower(plot, 2, 0),
  ...mbsTower(plot, 3, TOWER_Z),
  // SkyPark: a long deck cantilevered well past the end tower.
  {
    id: "mbs-deck",
    type: "box",
    plot,
    position: { x: 0, y: DECK_Y, z: DECK_Z },
    size: { x: DECK_W, y: DECK_H, z: DECK_L },
    color: gold,
    roughness: 0.3,
    metalness: 0.45,
  },
  // Structure under the cantilever. At this camera angle the deck's underside
  // is fully visible, and a single flat slab reads as a plank.
  {
    id: "mbs-deck-soffit",
    type: "box",
    plot,
    position: { x: 0, y: DECK_Y - 0.15, z: DECK_Z },
    size: { x: DECK_W * 0.7, y: 0.15, z: DECK_L * 0.94 },
    color: "#8a6a28",
    roughness: 0.55,
    metalness: 0.3,
  },
  // The upturned prow at the cantilevered end -- after the atrium void, the
  // most recognisable thing about the building, and it was missing entirely.
  {
    id: "mbs-prow",
    type: "box",
    plot,
    position: { x: 0, y: DECK_Y + 0.02, z: DECK_END + 0.1 },
    size: { x: DECK_W * 0.92, y: 0.26, z: 1.0 },
    rotation: { x: 0.34, y: 0, z: 0 },
    color: gold,
    roughness: 0.3,
    metalness: 0.45,
  },
  // Infinity pool: a strip along the outer edge, not a slab across the whole
  // deck. At full width it stopped reading as water and became a lightbox.
  {
    id: "mbs-pool",
    type: "box",
    plot,
    position: { x: 0.4, y: DECK_Y + DECK_H, z: DECK_Z - 0.15 },
    size: { x: 0.42, y: 0.05, z: 3.9 },
    color: "#d8f4ff",
    roughness: 0.1,
    metalness: 0.2,
    emissive: "#8fe6ff",
    emissiveIntensity: 0.6,
  },
  // Garden strip opposite the pool.
  {
    id: "mbs-garden",
    type: "box",
    plot,
    position: { x: -0.42, y: DECK_Y + DECK_H, z: DECK_Z - 0.3 },
    size: { x: 0.34, y: 0.07, z: 3.3 },
    color: "#2f5f43",
    roughness: 0.8,
    metalness: 0.05,
  },
  {
    id: "mbs-mast",
    type: "cylinder",
    plot,
    position: { x: 0, y: DECK_Y + DECK_H, z: 1.9 },
    size: { x: 0.06, y: 0.72, z: 0.06 },
    sides: 8,
    color: "#cfe0ef",
    roughness: 0.3,
    metalness: 0.6,
    emissive: "#ffd9a0",
    emissiveIntensity: 0.5,
  },
  ]
}

// ------------------------------------------------------------- Eiffel Tower
const iron = "#c8913f"
const ironMat = {
  color: iron,
  roughness: 0.42,
  metalness: 0.55,
  emissive: "#a8641f",
  emissiveIntensity: 0.3,
} as const
const EIFFEL_LEG_H = 3.1
const EIFFEL_LEG_X = 0.92
/** Legs converge inward to about a third of their spread by the first deck. */
const EIFFEL_LEAN = Math.atan((EIFFEL_LEG_X * 0.55) / EIFFEL_LEG_H)

function eiffelLeg(plot: number, sx: number, sz: number): Landmark {
  return {
    id: `eiffel-leg-${sx > 0 ? "e" : "w"}${sz > 0 ? "s" : "n"}`,
    type: "frustum",
    plot,
    position: { x: EIFFEL_LEG_X * sx, y: 0, z: EIFFEL_LEG_X * sz },
    size: { x: 0.46, y: EIFFEL_LEG_H, z: 0.46 },
    taper: 0.72,
    sides: 4,
    // Tilt toward the centre on both axes. Leaving air between the legs is the
    // whole point -- a solid pyramid is what made this read as a blocky spike.
    rotation: { x: -EIFFEL_LEAN * sz, y: 0, z: EIFFEL_LEAN * sx },
    ...ironMat,
  }
}

export function makeEiffelTower(plot: number): Landmark[] {
  return [
  eiffelLeg(plot, 1, 1),
  eiffelLeg(plot, 1, -1),
  eiffelLeg(plot, -1, 1),
  eiffelLeg(plot, -1, -1),
  // Arch ring tying the legs together, as on the real first level.
  { id: "eiffel-arch-n", type: "box", plot, position: { x: 0, y: 1.2, z: -0.74 }, size: { x: 1.55, y: 0.14, z: 0.16 }, ...ironMat },
  { id: "eiffel-arch-s", type: "box", plot, position: { x: 0, y: 1.2, z: 0.74 }, size: { x: 1.55, y: 0.14, z: 0.16 }, ...ironMat },
  { id: "eiffel-arch-e", type: "box", plot, position: { x: 0.74, y: 1.2, z: 0 }, size: { x: 0.16, y: 0.14, z: 1.55 }, ...ironMat },
  { id: "eiffel-arch-w", type: "box", plot, position: { x: -0.74, y: 1.2, z: 0 }, size: { x: 0.16, y: 0.14, z: 1.55 }, ...ironMat },
  // First platform
  { id: "eiffel-deck-1", type: "box", plot, position: { x: 0, y: EIFFEL_LEG_H, z: 0 }, size: { x: 2.15, y: 0.22, z: 2.15 }, ...ironMat },
  // Second stage, tapering
  { id: "eiffel-mid", type: "frustum", plot, position: { x: 0, y: EIFFEL_LEG_H + 0.26, z: 0 }, size: { x: 1.5, y: 2.3, z: 1.5 }, taper: 0.46, sides: 4, ...ironMat },
  // Second platform
  { id: "eiffel-deck-2", type: "box", plot, position: { x: 0, y: 5.62, z: 0 }, size: { x: 1.05, y: 0.18, z: 1.05 }, ...ironMat },
  // Upper shaft
  { id: "eiffel-shaft", type: "frustum", plot, position: { x: 0, y: 5.8, z: 0 }, size: { x: 0.68, y: 2.5, z: 0.68 }, taper: 0.24, sides: 4, ...ironMat },
  // Antenna + beacon
  { id: "eiffel-antenna", type: "cylinder", plot, position: { x: 0, y: 8.3, z: 0 }, size: { x: 0.08, y: 1.1, z: 0.08 }, sides: 8, ...ironMat },
  {
    id: "eiffel-beacon",
    type: "cylinder",
    plot,
    position: { x: 0, y: 9.4, z: 0 },
    size: { x: 0.18, y: 0.18, z: 0.18 },
    sides: 8,
    color: "#fff3d0",
    roughness: 0.2,
    metalness: 0.1,
    emissive: "#ffd98a",
    emissiveIntensity: 2.4,
  },
  ]
}
