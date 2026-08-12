import type { Theme } from "./types"

export const generic: Theme = {
  id: "generic",
  name: "Generic Night",
  background: {
    sky: ["#070d16", "#0a1830"],
    fogColor: "#070d16",
    fogNear: 45,
    fogFar: 120,
  },
  palette: {
    ground: "#0b1219",
    plinth: "#161f2a",
    levels: ["#26333f", "#0e5c36", "#00a447", "#2ad35f", "#4df07c"],
    glow: "#37e06a",
    lamp: "#ffcf8a",
  },
  landmarks: [],
  camera: {
    position: { x: 23, y: 27, z: 23 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
