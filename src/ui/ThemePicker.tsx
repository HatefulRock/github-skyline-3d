import { themes } from "../themes"

interface Props {
  value: string
  onChange: (id: string) => void
}

export function ThemePicker({ value, onChange }: Props) {
  return (
    <label className="field">
      <span>Theme</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  )
}
