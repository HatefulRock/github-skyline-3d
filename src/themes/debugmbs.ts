import { makeMarinaBaySands } from "./landmarks"
import type { Theme } from "./types"

/** Debug-only: MBS alone in the centre plot, close camera. Not listed in the
 *  picker; reachable via ?theme=debugmbs. */
export const debugmbs: Theme = {
  id: "debugmbs",
  name: "Debug MBS",
  background: { sky: ["#070d16", "#0a1830"], fogColor: "#070d16", fogNear: 60, fogFar: 200 },
  palette: {
    ground: "#0b1219",
    plinth: "#161f2a",
    levels: ["#26333f", "#0e5c36", "#00a447", "#2ad35f", "#4df07c"],
    glow: "#37e06a",
    lamp: "#ffcf8a",
  },
  landmarks: makeMarinaBaySands(0),
  camera: { position: { x: 1, y: 7, z: 3 }, target: { x: -6.8, y: 3, z: -7.7 } },
}
