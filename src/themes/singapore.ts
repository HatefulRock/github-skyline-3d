import { LANDMARK_PLOTS } from "../utils/grid"
import { makeMarinaBaySands } from "./landmarks"
import type { Theme } from "./types"


export const singapore: Theme = {
  id: "singapore",
  name: "Singapore",
  background: {
    sky: ["#0b1626", "#1d4b7a"],
    fogColor: "#070d18",
    fogNearFactor: 0.95,
    fogFarFactor: 3.4,
  },
  palette: {
    ground: "#0b1219",
    plinth: "#161f2a",
    podium: "#131c26",
    levels: ["#26333f", "#0e5c36", "#00a447", "#2ad35f", "#4df07c"],
    glow: "#37e06a",
    window: "#ffb457",
    windowAlt: "#8fe8ff",
    lamp: "#ffcf8a",
  },
  landmarks: makeMarinaBaySands(LANDMARK_PLOTS.singapore),
  camera: {
    position: { x: 23, y: 27, z: 23 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
