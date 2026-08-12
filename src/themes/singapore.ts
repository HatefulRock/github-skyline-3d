import { GRID_WIDTH } from "../utils/grid"
import type { Theme } from "./types"

const edgeX = GRID_WIDTH / 2 + 4

export const singapore: Theme = {
  id: "singapore",
  name: "Singapore",
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
    // Three Marina Bay Sands towers...
    { id: "mbs-tower-1", type: "box", position: { x: edgeX, y: 0, z: -1.4 }, size: { x: 1, y: 7, z: 1.1 }, color: "#1f8a94" },
    { id: "mbs-tower-2", type: "box", position: { x: edgeX, y: 0, z: 0 }, size: { x: 1, y: 7, z: 1.1 }, color: "#1f8a94" },
    { id: "mbs-tower-3", type: "box", position: { x: edgeX, y: 0, z: 1.4 }, size: { x: 1, y: 7, z: 1.1 }, color: "#1f8a94" },
    // ...topped by the SkyPark deck, cantilevered past the last tower.
    { id: "mbs-deck", type: "box", position: { x: edgeX, y: 7, z: -0.3 }, size: { x: 1.4, y: 0.6, z: 6.5 }, color: "#f4b400" },
  ],
  camera: {
    position: { x: 42, y: 20, z: 34 },
    target: { x: 12, y: 3, z: 0 },
  },
}
