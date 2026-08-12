import type { Theme } from "./types"

export const generic: Theme = {
  id: "generic",
  name: "Generic Night",
  background: {
    sky: ["#020610", "#0a1830"],
    fogColor: "#050b1a",
    fogNear: 25,
    fogFar: 70,
  },
  palette: {
    ground: "#050b1a",
    levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  landmarks: [],
  camera: {
    position: { x: 22, y: 16, z: 22 },
    target: { x: 0, y: 0, z: 0 },
  },
}
