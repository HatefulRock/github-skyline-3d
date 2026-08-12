import { useMemo } from "react"
import type { ContributionData } from "../data/types"
import type { Palette } from "../themes/types"
import { CELL_SIZE, GRID_ROWS, bucket, cellPosition } from "../utils/grid"

const MAX_HEIGHT = 6
const MIN_HEIGHT = 0.15

interface Cell {
  key: string
  x: number
  z: number
  height: number
  color: string
}

interface Props {
  data: ContributionData
  palette: Palette
}

export function DataBuildings({ data, palette }: Props) {
  const cells = useMemo<Cell[]>(() => {
    const counts = data.weeks.flatMap((w) => w.days.map((d) => d.count))
    const maxCount = counts.length ? Math.max(...counts) : 0
    const out: Cell[] = []
    data.weeks.forEach((week, col) => {
      week.days.forEach((day, row) => {
        if (row >= GRID_ROWS) return
        const { x, z } = cellPosition(col, row)
        const level = bucket(day.count, maxCount)
        const height =
          day.count > 0
            ? MIN_HEIGHT + (day.count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT)
            : MIN_HEIGHT
        out.push({ key: `${col}-${row}`, x, z, height, color: palette.levels[level] })
      })
    })
    return out
  }, [data, palette])

  return (
    <group>
      {cells.map((c) => (
        <mesh key={c.key} position={[c.x, c.height / 2, c.z]} castShadow receiveShadow>
          <boxGeometry args={[CELL_SIZE, c.height, CELL_SIZE]} />
          <meshStandardMaterial color={c.color} />
        </mesh>
      ))}
    </group>
  )
}
