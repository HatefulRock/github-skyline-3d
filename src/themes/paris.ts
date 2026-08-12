import { LANDMARK_BLOCK, blockCenter } from "../utils/grid"
import type { Theme } from "./types"

const plot = blockCenter(LANDMARK_BLOCK)
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
    levels: ["#1c2531", "#0e4429", "#00873d", "#26a641", "#3fe356"],
  },
  landmarks: [
    // Eiffel Tower, approximated as three tapering segments + an antenna.
    // Simple primitives for now -- swap for a glTF model later if you want
    // more than a silhouette.
    { id: "eiffel-base", type: "cone", position: { x: plot.x, y: 0, z: plot.z }, size: { x: 3.6, y: 2.6, z: 3.6 }, color: iron },
    { id: "eiffel-mid", type: "cone", position: { x: plot.x, y: 2.6, z: plot.z }, size: { x: 1.8, y: 2.0, z: 1.8 }, color: iron },
    { id: "eiffel-top", type: "cone", position: { x: plot.x, y: 4.6, z: plot.z }, size: { x: 0.8, y: 1.7, z: 0.8 }, color: iron },
    { id: "eiffel-antenna", type: "cylinder", position: { x: plot.x, y: 6.3, z: plot.z }, size: { x: 0.14, y: 1.0, z: 0.14 }, color: iron },
  ],
  camera: {
    position: { x: 27, y: 20.5, z: 27 },
    target: { x: 0, y: 1.5, z: 0 },
  },
}
