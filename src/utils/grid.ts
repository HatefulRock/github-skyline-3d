// Shared world-space layout for the contribution grid, so themes can place
// landmarks relative to it (e.g. "just past the last column").
export const GRID_COLS = 53 // weeks
export const GRID_ROWS = 7 // days
export const CELL_SIZE = 0.8
export const GAP = 0.15
export const STEP = CELL_SIZE + GAP

export const GRID_WIDTH = GRID_COLS * STEP
export const GRID_DEPTH = GRID_ROWS * STEP

/** World-space x/z for the center of a given (week, day) cell.
 *  Grid is centered on the origin. */
export function cellPosition(col: number, row: number): { x: number; z: number } {
  const x = (col - (GRID_COLS - 1) / 2) * STEP
  const z = (row - (GRID_ROWS - 1) / 2) * STEP
  return { x, z }
}

export function bucket(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount <= 0) return 0
  const ratio = count / maxCount
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}
