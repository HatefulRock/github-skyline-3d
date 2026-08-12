import { useEffect, useState } from "react"
import { Scene } from "./scene/Scene"
import type { ContributionData } from "./data/types"
import { getTheme } from "./themes"
import type { Landmark } from "./themes/types"
import { ThemePicker } from "./ui/ThemePicker"
import { BuildingEditor } from "./ui/BuildingEditor"

export default function App() {
  const [data, setData] = useState<ContributionData | null>(null)
  const [themeId, setThemeId] = useState("singapore")
  const [customBuildings, setCustomBuildings] = useState<Landmark[]>([])

  useEffect(() => {
    fetch("/contributions.json")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Failed to load contributions.json -- run scripts/fetch-data.mjs first", err))
  }, [])

  const theme = getTheme(themeId)

  if (!data) {
    return <div className="loading">Loading contribution data...</div>
  }

  return (
    <div className="app">
      <Scene theme={theme} data={data} customBuildings={customBuildings} />
      <div className="overlay">
        <div className="panel">
          <h1>{data.username}'s skyline</h1>
          <p className="stat">{data.totalContributions} contributions this year</p>
          <ThemePicker value={themeId} onChange={setThemeId} />
        </div>
        <BuildingEditor
          buildings={customBuildings}
          onAdd={(b) => setCustomBuildings((prev) => [...prev, b])}
          onRemove={(id) => setCustomBuildings((prev) => prev.filter((b) => b.id !== id))}
        />
      </div>
    </div>
  )
}
