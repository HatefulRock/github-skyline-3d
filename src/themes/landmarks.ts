import type { Landmark } from "./types"

// Landmark geometry, kept separate from the themes so several themes can
// compose the same buildings into different plots.

// ---------------------------------------------------------------- Marina Bay
const glass = "#aec3d8"
const gold = "#e8b44a"
const TOWER_LEG_H = 2.5
const TOWER_SLAB_H = 3.6
const DECK_Y = TOWER_LEG_H + TOWER_SLAB_H
/** Legs converge from +-LEG_X to roughly nothing over their height. */
const LEG_X = 0.34
const LEG_LEAN = Math.atan(LEG_X / TOWER_LEG_H)

const glassMat = {
  color: glass,
  roughness: 0.12,
  metalness: 0.72,
  emissive: "#7fd8ff",
  emissiveIntensity: 0.05,
} as const

function mbsTower(plot: number, index: number, z: number): Landmark[] {
  return [
    // The signature inverted-V: two splayed legs merging into the slab above.
    {
      id: `mbs-${index}-leg-l`,
      type: "box",
      plot,
      position: { x: -LEG_X, y: 0, z },
      size: { x: 0.4, y: TOWER_LEG_H, z: 0.98 },
      rotation: { x: 0, y: 0, z: -LEG_LEAN },
      ...glassMat,
    },
    {
      id: `mbs-${index}-leg-r`,
      type: "box",
      plot,
      position: { x: LEG_X, y: 0, z },
      size: { x: 0.4, y: TOWER_LEG_H, z: 0.98 },
      rotation: { x: 0, y: 0, z: LEG_LEAN },
      ...glassMat,
    },
    // Slab, gently tapered rather than a straight prism.
    {
      id: `mbs-${index}-slab`,
      type: "frustum",
      plot,
      position: { x: 0, y: TOWER_LEG_H - 0.1, z },
      size: { x: 1.0, y: TOWER_SLAB_H + 0.1, z: 1.12 },
      taper: 0.88,
      sides: 4,
      ...glassMat,
    },
  ]
}

export function makeMarinaBaySands(plot: number): Landmark[] {
  return [
  ...mbsTower(plot, 1, -1.4),
  ...mbsTower(plot, 2, 0),
  ...mbsTower(plot, 3, 1.4),
  // SkyPark: a long deck cantilevered well past the end tower.
  {
    id: "mbs-deck",
    type: "box",
    plot,
    position: { x: 0, y: DECK_Y, z: -0.55 },
    size: { x: 1.62, y: 0.34, z: 5.7 },
    color: gold,
    roughness: 0.3,
    metalness: 0.45,
  },
  // Infinity-pool edge, picked up by bloom as a bright rim.
  {
    id: "mbs-pool",
    type: "box",
    plot,
    position: { x: 0, y: DECK_Y + 0.34, z: -0.55 },
    size: { x: 1.2, y: 0.06, z: 4.9 },
    color: "#d8f4ff",
    roughness: 0.1,
    metalness: 0.2,
    emissive: "#8fe6ff",
    emissiveIntensity: 0.9,
  },
  {
    id: "mbs-mast",
    type: "cylinder",
    plot,
    position: { x: 0, y: DECK_Y + 0.38, z: 1.95 },
    size: { x: 0.07, y: 1.1, z: 0.07 },
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
