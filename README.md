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

## The koi in the bay

The Singapore theme puts Marina Bay in the block right beside Marina Bay
Sands. A koi swims in it, drawn by
[git-koi](https://github.com/yalongwastaken/git-koi) by
[Anthony Yalong](https://github.com/yalongwastaken) (MIT): the account's
languages color it, its contributions grow it, its streaks mark it, and the day
that just ended decides how it swims.

git-koi swims its koi in laps of its own frame. Here the koi swims in place
instead (`koi/render-pose.patch` exposes git-koi's pose renderer for that), and
`src/scene/Pond.tsx` steers it along a wandering path through the bay, new
every day.

```sh
GH_TOKEN=... scripts/koi.sh <your-username>   # needs git, cargo and the GitHub CLI
```

This fetches git-koi at a pinned commit, patches it, builds it, and writes the
sprite sheet to `public/koi/`. Without it the bay is still water.

The daily workflow also renders the koi's loop through the whole scene
(`scripts/animate.mjs`) and encodes it as `skyline.webp`, an animated image for
a profile README.

## Adding a new theme

Themes live in `src/themes/`. Each one is a plain object (see
`src/themes/types.ts` for the shape): a color palette for the data-driven
buildings, a background/fog setup, an optional list of fixed `landmarks`
(box/cone/cylinder primitives positioned in world space), and a default
camera pose. To add a city:

1. Copy `src/themes/paris.ts` as a starting point.
2. Give landmark pieces a `plot` from `LANDMARK_PLOTS` in `src/utils/grid.ts`,
   and list it in the theme's `freePlots` -- see "City layout" below.
3. Register it in `src/themes/index.ts`.

Landmarks are simple primitives for now (box/cone/cylinder composites) --
recognizable silhouettes, not detailed models. Swapping in real glTF models
per landmark is a natural next step if you want more fidelity.

## City layout

A contribution year is 53x7, a 7.5:1 stripe that never reads as a city no
matter how well it's lit. So the year is cut into blocks arranged on a 3x3
grid with streets between them, giving a roughly square footprint. The data
takes 7 of the 9 slots; each theme leaves the other two free (`freePlots`,
the back corners by default) for its landmark or its bay, so they sit inside
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
koi/            koi-sprite: draws the git-koi koi swimming in place, as a sprite sheet
scripts/
  fetch-data.mjs  pulls real contribution data via GitHub's GraphQL API
  koi.sh          builds git-koi + koi-sprite and writes public/koi/
  screenshot.mjs  the README still; animate.mjs + encode-animation.py the loop
```

## Exporting for a README

The `update-screenshot` workflow runs daily: it fetches the contribution data,
draws the koi, and commits `screenshot.png` (a still at 2560x1440) and
`skyline.webp` (the animated loop at 1280x720). Locally,
`node scripts/screenshot.mjs` and `node scripts/animate.mjs` do the same against
`vite preview` on port 4173.
