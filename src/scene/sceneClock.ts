/** The scene's shared clock for everything that moves (the koi, ripples, cars).
 *
 *  `scripts/animate.mjs` pins it through `window.__koi.setTime` so every
 *  captured frame shows exactly the moment it asked for, and so all motion
 *  loops together. Everything that moves is timed to close on `loopSeconds`. */
export const sceneClock = {
  /** Pinned time in seconds, or null to follow the render clock. */
  pinned: null as number | null,
  /** One seamless loop. Set by the pond once the koi's loop is known. */
  loopSeconds: 8,
  now(clockSeconds: number): number {
    return (this.pinned ?? clockSeconds) % this.loopSeconds
  },
}
