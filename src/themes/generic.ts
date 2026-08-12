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
    levels: ["#1c2531", "#0e4429", "#00873d", "#26a641", "#3fe356"],
  },
  landmarks: [],
  camera: {
    position: { x: 27, y: 20.5, z: 27 },
    target: { x: 0, y: 1.5, z: 0 },
  },
}
