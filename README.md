# github-skyline-3d

A personal, themeable 3D contribution-skyline viewer. Real GitHub activity
drives the buildings; the surrounding city (Singapore's Marina Bay Sands,
Paris's Eiffel Tower, or a plain generic skyline) is a swappable theme, and
you can drop in your own custom buildings from the sidebar.

Built with Vite + React + TypeScript + [react-three-fiber](https://docs.pmnd.rs/react-three-fiber).

## Quick start

```sh
npm install
npm run dev
```

Opens with sample data (`public/contributions.json`) so it runs immediately
with no setup. Orbit with the mouse, switch themes from the top-left panel,
add buildings from the bottom-left panel.

## Using your real contribution data

```sh
GITHUB_TOKEN=ghp_xxx npm run fetch-data -- <your-username>
```

Any personal access token works -- it only needs public read access
(create one at https://github.com/settings/tokens?type=beta with no scopes
checked). This writes `public/contributions.json`; refresh the dev server
to see it.

**To include private contributions**, the target account needs
"Include private contributions on my profile" enabled at
https://github.com/settings/profile -- that's a GitHub-side account
setting, not something a token scope can grant on its own.

## Adding a new theme

Themes live in `src/themes/`. Each one is a plain object (see
`src/themes/types.ts` for the shape): a color palette for the data-driven
buildings, a background/fog setup, an optional list of fixed `landmarks`
(box/cone/cylinder primitives positioned in world space), and a default
camera pose. To add a city:

1. Copy `src/themes/paris.ts` as a starting point.
2. Position landmark shapes with `blockCenter(LANDMARK_BLOCK)` from
   `src/utils/grid.ts` -- see "City layout" below for why that slot is free.
3. Register it in `src/themes/index.ts`.

Landmarks are simple primitives for now (box/cone/cylinder composites) --
recognizable silhouettes, not detailed models. Swapping in real glTF models
per landmark is a natural next step if you want more fidelity.

## City layout

A contribution year is 53x7, a 7.5:1 stripe that never reads as a city no
matter how well it's lit. So the year is cut into 7-week blocks arranged on a
3x3 grid with streets between them, giving a roughly square footprint. 53
weeks fills 8 of the 9 slots; the vacant one (`LANDMARK_BLOCK`, the far corner
from the default camera) is where the theme's landmark goes, so it sits inside
the city instead of floating beside it.

Each day is a stack of cubes rather than one extruded bar, sized by
square-root easing -- linear scaling flattens the whole city whenever a single
outlier day dominates the year.

## Project layout

```
src/
  themes/       theme configs (palette, landmarks, camera) -- one file per city
  scene/        the r3f scene: ground, data-driven buildings, landmarks
  ui/           theme picker + custom building editor
  utils/grid.ts shared grid layout math
  data/types.ts contribution data shape
scripts/
  fetch-data.mjs  pulls real contribution data via GitHub's GraphQL API
```

## Exporting for a README

There's no built-in exporter yet. The simplest path: open the app, orbit to
a angle you like, and screenshot the canvas. A proper "render to PNG at a
fixed camera angle" button (via `canvas.toDataURL()`) would be a good next
addition if you want this to feed back into a GitHub profile README.
