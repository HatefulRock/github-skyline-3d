import { LANDMARK_BLOCK, blockCenter } from "../utils/grid"
import type { Theme } from "./types"

// The 53-week year fills 8 of the 9 block slots, so the vacant one becomes
// the landmark's plot -- it sits inside the city instead of floating beside it.
const plot = blockCenter(LANDMARK_BLOCK)
const TOWER_H = 7.6
const silver = "#c3d0de"

export const singapore: Theme = {
  id: "singapore",
  name: "Singapore",
  background: {
    sky: ["#070d16", "#0a1830"],
    fogColor: "#070d16",
    fogNear: 45,
    fogFar: 130,
  },
  palette: {
    ground: "#0b1219",
    plinth: "#161f2a",
    levels: ["#16202c", "#0b4f2e", "#00913e", "#22c455", "#45e474"],
    glow: "#37e06a",
  },
  landmarks: [
    // Three Marina Bay Sands towers, kept neutral silver so they read as
    // architecture against the green city rather than competing with it.
    { id: "mbs-tower-1", type: "box", position: { x: plot.x, y: 0, z: plot.z - 1.5 }, size: { x: 0.95, y: TOWER_H, z: 1.0 }, color: silver },
    { id: "mbs-tower-2", type: "box", position: { x: plot.x, y: 0, z: plot.z }, size: { x: 0.95, y: TOWER_H, z: 1.0 }, color: silver },
    { id: "mbs-tower-3", type: "box", position: { x: plot.x, y: 0, z: plot.z + 1.5 }, size: { x: 0.95, y: TOWER_H, z: 1.0 }, color: silver },
    // ...topped by the SkyPark deck, cantilevered past the last tower.
    { id: "mbs-deck", type: "box", position: { x: plot.x, y: TOWER_H, z: plot.z - 0.35 }, size: { x: 1.35, y: 0.46, z: 5.6 }, color: "#e8b44a" },
  ],
  camera: {
    position: { x: 24, y: 18, z: 24 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
