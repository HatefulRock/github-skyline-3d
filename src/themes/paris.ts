import { GRID_WIDTH } from "../utils/grid"
import type { Theme } from "./types"

const edgeX = GRID_WIDTH / 2 + 4
const iron = "#4a4038"

export const paris: Theme = {
  id: "paris",
  name: "Paris",
  background: {
    sky: ["#020610", "#0a1830"],
    fogColor: "#050b1a",
    fogNear: 30,
    fogFar: 80,
  },
  palette: {
    ground: "#050b1a",
    levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  landmarks: [
    // Eiffel Tower, approximated as three tapering segments + an antenna.
    // Simple primitives for now -- swap for a glTF model later if you want
    // more than a silhouette.
    { id: "eiffel-base", type: "cone", position: { x: edgeX, y: 0, z: 0 }, size: { x: 3.2, y: 4, z: 3.2 }, color: iron },
    { id: "eiffel-mid", type: "cone", position: { x: edgeX, y: 4, z: 0 }, size: { x: 1.6, y: 3, z: 1.6 }, color: iron },
    { id: "eiffel-top", type: "cone", position: { x: edgeX, y: 7, z: 0 }, size: { x: 0.7, y: 2.5, z: 0.7 }, color: iron },
    { id: "eiffel-antenna", type: "cylinder", position: { x: edgeX, y: 9.5, z: 0 }, size: { x: 0.15, y: 1.5, z: 0.15 }, color: iron },
  ],
  camera: {
    position: { x: 42, y: 20, z: 34 },
    target: { x: 12, y: 3, z: 0 },
  },
}
