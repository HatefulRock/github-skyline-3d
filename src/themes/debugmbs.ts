import { makeMarinaBaySands } from "./landmarks"
import type { Theme } from "./types"

/** Debug-only: MBS alone in the centre plot, close camera. Not listed in the
 *  picker; reachable via ?theme=debugmbs. */
export const debugmbs: Theme = {
  id: "debugmbs",
  name: "Debug MBS",
  background: {
    sky: ["#0b1626", "#1d4b7a"],
    fogColor: "#070d18",
    fogNearFactor: 1.2,
    fogFarFactor: 5,
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
  landmarks: makeMarinaBaySands(0),
  camera: { position: { x: 1, y: 7, z: 3 }, target: { x: -6.8, y: 3, z: -7.7 } },
}
