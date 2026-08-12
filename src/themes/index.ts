import { generic } from "./generic"
import { paris } from "./paris"
import { singapore } from "./singapore"
import type { Theme } from "./types"

export const themes: Theme[] = [generic, singapore, paris]

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]
}

export * from "./types"
