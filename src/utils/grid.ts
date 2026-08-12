// City layout. The contribution year is cut into 7-week blocks laid out on a
// 3x3 grid with streets between them, instead of one 53x7 stripe -- a calendar
// year is a 7.5:1 sliver, which never reads as a city no matter how it's lit.
// 53 weeks -> 8 blocks, so the 9th slot is left vacant for a landmark.
export const CELL_SIZE = 0.82
export const GAP = 0.16
export const STEP = CELL_SIZE + GAP

/** Height of one stacked cube. Towers are built by stacking these. */
export const VOXEL_H = 0.34
/** Cubes are slightly shorter than their slot so the seams stay visible --
 *  flush-stacked cubes fuse into a smooth column and lose the voxel read. */
export const VOXEL_FILL = 0.86
export const MAX_VOXELS = 10

export const BLOCK_COLS = 7 // weeks per block
export const BLOCK_ROWS = 7 // days in a week
export const BLOCKS_PER_SIDE = 3
export const STREET = 2.2

export const BLOCK_W = BLOCK_COLS * STEP
export const BLOCK_D = BLOCK_ROWS * STEP
export const CITY_WIDTH = BLOCKS_PER_SIDE * BLOCK_W + (BLOCKS_PER_SIDE - 1) * STREET
export const CITY_DEPTH = BLOCKS_PER_SIDE * BLOCK_D + (BLOCKS_PER_SIDE - 1) * STREET

/** Which of the 9 slots is left free for a landmark. Slot 0 is the far corner
 *  from the default camera, so the landmark never occludes the city. */
export const LANDMARK_BLOCK = 0

/** Center of a block slot (0-8, row-major on the 3x3). Themes use this to drop
 *  a landmark into the vacant slot. */
export function blockCenter(blockIndex: number): { x: number; z: number } {
  const bx = blockIndex % BLOCKS_PER_SIDE
  const bz = Math.floor(blockIndex / BLOCKS_PER_SIDE)
  const x = -CITY_WIDTH / 2 + bx * (BLOCK_W + STREET) + BLOCK_W / 2
  const z = -CITY_DEPTH / 2 + bz * (BLOCK_D + STREET) + BLOCK_D / 2
  return { x, z }
}

/** World-space x/z for the center of a given (week, day) cell. Data fills slots
 *  1-8; slot 0 is reserved for the landmark. */
export function cellPosition(weekIndex: number, row: number): { x: number; z: number } {
  const dataBlock = Math.min(BLOCKS_PER_SIDE * BLOCKS_PER_SIDE - 2, Math.floor(weekIndex / BLOCK_COLS))
  const col = weekIndex - dataBlock * BLOCK_COLS
  const block = dataBlock + 1
  const bx = block % BLOCKS_PER_SIDE
  const bz = Math.floor(block / BLOCKS_PER_SIDE)

  const x = -CITY_WIDTH / 2 + bx * (BLOCK_W + STREET) + (col + 0.5) * STEP
  const z = -CITY_DEPTH / 2 + bz * (BLOCK_D + STREET) + (row + 0.5) * STEP
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

/** How many cubes to stack for a day. Square-root easing so a modest day still
 *  gets visible height -- linear scaling flattens the whole city whenever one
 *  outlier day dominates the year. */
export function voxelCount(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) return 1 // empty plot: a single flat cube
  const eased = Math.sqrt(count / maxCount)
  return Math.max(2, Math.round(eased * MAX_VOXELS))
}
