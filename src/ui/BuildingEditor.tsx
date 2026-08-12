import { useState } from "react"
import type { Landmark } from "../themes/types"

interface Props {
  buildings: Landmark[]
  onAdd: (b: Landmark) => void
  onRemove: (id: string) => void
}

const DEFAULTS = { x: 10, z: 0, width: 1.5, height: 5, depth: 1.5, color: "#8ac6ff" }

export function BuildingEditor({ buildings, onAdd, onRemove }: Props) {
  const [form, setForm] = useState(DEFAULTS)

  function add() {
    onAdd({
      id: `custom-${Date.now()}`,
      type: "box",
      position: { x: form.x, y: 0, z: form.z },
      size: { x: form.width, y: form.height, z: form.depth },
      color: form.color,
    })
  }

  return (
    <div className="panel">
      <h3>Add a building</h3>
      <div className="grid2">
        <label>
          X <input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: +e.target.value })} />
        </label>
        <label>
          Z <input type="number" value={form.z} onChange={(e) => setForm({ ...form, z: +e.target.value })} />
        </label>
        <label>
          Width <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: +e.target.value })} />
        </label>
        <label>
          Height <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: +e.target.value })} />
        </label>
        <label>
          Depth <input type="number" value={form.depth} onChange={(e) => setForm({ ...form, depth: +e.target.value })} />
        </label>
        <label>
          Color <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </label>
      </div>
      <button onClick={add}>Add building</button>

      {buildings.length > 0 && (
        <ul className="building-list">
          {buildings.map((b) => (
            <li key={b.id}>
              <span style={{ background: b.color }} className="swatch" />
              ({b.position.x}, {b.position.z}) h={b.size.y}
              <button onClick={() => onRemove(b.id)} aria-label="Remove">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
