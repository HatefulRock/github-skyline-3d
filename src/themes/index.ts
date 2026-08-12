import { debugmbs } from "./debugmbs"
import { generic } from "./generic"
import { singapore } from "./singapore"
import type { Theme } from "./types"

export const themes: Theme[] = [generic, singapore]
/** Not in the picker; reachable by id for debugging. */
export const allThemes: Theme[] = [...themes, debugmbs]

export function getTheme(id: string): Theme {
  return allThemes.find((t) => t.id === id) ?? themes[0]
}

export * from "./types"
