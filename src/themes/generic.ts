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
    levels: ["#16202c", "#0b4f2e", "#00913e", "#22c455", "#45e474"],
    glow: "#37e06a",
  },
  landmarks: [],
  camera: {
    position: { x: 24, y: 18, z: 24 },
    target: { x: 0, y: 2.2, z: 0 },
  },
}
