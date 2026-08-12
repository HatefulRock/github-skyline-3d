import type { ContributionWeek } from "../data/types"

// City layout. A contribution year is 53x7 -- a 7.5:1 stripe that never reads
// as a city no matter how it's lit. So the weeks are cut into blocks laid out
// on a 3x3 grid with streets between them, giving a square footprint. Eight
// slots take data; the ninth is left free for the theme's landmark.
export const CELL_SIZE = 0.82
export const GAP = 0.06
export const STEP = CELL_SIZE + GAP

/** Height of one stacked cube. Towers are built by stacking these. */
export const VOXEL_H = 0.38
/** Mid-stack cubes nearly fill their slot, so a tower reads as one continuous
 *  facade. Fat gaps between every storey were the loudest remaining "stack of
 *  cubes" cue; the storey rhythm is carried by the window texture instead. */
export const VOXEL_FILL = 0.97
/** The topmost cube is left short, so the notch under it reads as a setback and
 *  the tower gets a defined top rather than just stopping. */
export const CAP_FILL = 0.86
/** Tall enough that a busy day reads as a tower (~7:1 against the footprint).
 *  At 10 the whole city topped out around 4:1 and looked like a low bar chart. */
export const MAX_VOXELS = 16

export const BLOCK_ROWS = 7 // days in a week
export const BLOCKS_PER_SIDE = 3
export const STREET = 1.5

/** Height of the raised pad each city block sits on. Buildings are lifted by
 *  this so they stand *on* the pad instead of sinking through it, so both the
 *  ground and the buildings need the value. */
export const PODIUM_H = 0.07

/** Slots kept free for landmarks. Both sit in the back row, away from the
 *  default camera, so a landmark never occludes the city in front of it. */
export const LANDMARK_PLOTS = { paris: 0, singapore: 2 } as const

/** The remaining slots, in order, are where contribution data goes. */
const DATA_SLOTS = [1, 3, 4, 5, 6, 7, 8]
export const DATA_BLOCKS = DATA_SLOTS.length

/** Zero-contribution days still get one low block rather than bare paving, so
 *  the city has continuous built texture instead of gap-toothed empty lots. */
export const EMPTY_PLOT_VOXELS = 1

export interface Layout {
  /** Weeks per block. Derived from the data so the 8 data blocks always fill,
   *  however many weeks are being rendered. */
  blockCols: number
  blockW: number
  blockD: number
  cityWidth: number
  cityDepth: number
  cellPosition(weekIndex: number, row: number): { x: number; z: number }
  blockCenter(blockIndex: number): { x: number; z: number }
}

/** Drops leading weeks with no activity at all. An account that started
 *  mid-year would otherwise spend whole blocks rendering nothing. */
export function trimLeadingEmptyWeeks(weeks: ContributionWeek[]): ContributionWeek[] {
  const first = weeks.findIndex((w) => w.days.some((d) => d.count > 0))
  return first > 0 ? weeks.slice(first) : weeks
}

/** Builds the layout for a given number of weeks. Block width adapts so the
 *  city always fills its 3x3 footprint -- a fixed 7-weeks-per-block leaves
 *  bare pads as soon as there are fewer than 56 weeks to place. */
export function makeLayout(weekCount: number): Layout {
  const blockCols = Math.max(3, Math.ceil(weekCount / DATA_BLOCKS))
  const blockW = blockCols * STEP
  const blockD = BLOCK_ROWS * STEP
  const cityWidth = BLOCKS_PER_SIDE * blockW + (BLOCKS_PER_SIDE - 1) * STREET
  const cityDepth = BLOCKS_PER_SIDE * blockD + (BLOCKS_PER_SIDE - 1) * STREET

  function blockCenter(blockIndex: number) {
    const bx = blockIndex % BLOCKS_PER_SIDE
    const bz = Math.floor(blockIndex / BLOCKS_PER_SIDE)
    return {
      x: -cityWidth / 2 + bx * (blockW + STREET) + blockW / 2,
      z: -cityDepth / 2 + bz * (blockD + STREET) + blockD / 2,
    }
  }

  function cellPosition(weekIndex: number, row: number) {
    // Data fills slots 1..8; slot 0 is reserved for the landmark.
    const dataBlock = Math.min(DATA_BLOCKS - 1, Math.floor(weekIndex / blockCols))
    const col = weekIndex - dataBlock * blockCols
    const block = DATA_SLOTS[dataBlock]
    const bx = block % BLOCKS_PER_SIDE
    const bz = Math.floor(block / BLOCKS_PER_SIDE)
    return {
      x: -cityWidth / 2 + bx * (blockW + STREET) + (col + 0.5) * STEP,
      z: -cityDepth / 2 + bz * (blockD + STREET) + (row + 0.5) * STEP,
    }
  }

  return {
    blockCols,
    blockW,
    blockD,
    cityWidth,
    cityDepth,
    cellPosition,
    blockCenter,

  }
}

export function bucket(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount <= 0) return 0
  const ratio = count / maxCount
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}

/** How many cubes to stack for a day.
 *
 *  `scaleRef` should be a high percentile of the *active* days, not the max: a
 *  single 28-commit day against a median of 2 squashes the entire city flat.
 *  Days at or above the reference clamp to full height. */
export function voxelCount(count: number, scaleRef: number): number {
  if (count <= 0 || scaleRef <= 0) return EMPTY_PLOT_VOXELS
  const eased = Math.sqrt(Math.min(1, count / scaleRef))
  return Math.max(2, Math.round(eased * MAX_VOXELS))
}

/** 90th percentile of the non-zero days, with a floor so tiny datasets don't
 *  produce a degenerate scale. */
export function heightScaleRef(counts: number[]): number {
  const active = counts.filter((c) => c > 0).sort((a, b) => a - b)
  if (!active.length) return 0
  const p90 = active[Math.min(active.length - 1, Math.floor(active.length * 0.9))]
  return Math.max(3, p90)
}
