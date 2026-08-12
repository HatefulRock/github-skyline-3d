import type { Theme } from "./types"

// Warm lit-limestone, the way the tower actually looks floodlit at night.
const iron = "#b98f52"

export const paris: Theme = {
  id: "paris",
  name: "Paris",
  background: {
    sky: ["#070d16", "#0a1830"],
    fogColor: "#070d16",
    fogNear: 45,
    fogFar: 130,
  },
  palette: {
    ground: "#0b1219",
    plinth: "#161f2a",
    levels: ["#26333f", "#0e5c36", "#00a447", "#2ad35f", "#4df07c"],
    glow: "#37e06a",
  },
  landmarks: [
    // Eiffel Tower, approximated as three tapering segments + an antenna.
    // Simple primitives for now -- swap for a glTF model later if you want
    // more than a silhouette.
    { id: "eiffel-base", type: "cone", position: { x: 0, y: 0, z: 0 }, size: { x: 3.6, y: 3.8, z: 3.6 }, color: iron },
    { id: "eiffel-mid", type: "cone", position: { x: 0, y: 3.8, z: 0 }, size: { x: 1.8, y: 3.0, z: 1.8 }, color: iron },
    { id: "eiffel-top", type: "cone", position: { x: 0, y: 6.8, z: 0 }, size: { x: 0.8, y: 2.4, z: 0.8 }, color: iron },
    { id: "eiffel-antenna", type: "cylinder", position: { x: 0, y: 9.2, z: 0 }, size: { x: 0.15, y: 1.4, z: 0.15 }, color: iron },
  ],
  camera: {
    position: { x: 23, y: 27, z: 23 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
