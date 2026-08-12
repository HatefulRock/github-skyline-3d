import { LANDMARK_PLOTS } from "../utils/grid"
import { makeMarinaBaySands } from "./landmarks"
import type { Theme } from "./types"


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
    levels: ["#26333f", "#0e5c36", "#00a447", "#2ad35f", "#4df07c"],
    glow: "#37e06a",
    lamp: "#ffcf8a",
  },
  landmarks: makeMarinaBaySands(LANDMARK_PLOTS.singapore),
  camera: {
    position: { x: 23, y: 27, z: 23 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
