#!/usr/bin/env bash
# Draws LOGIN's koi with git-koi and packs it as the pond's sprite sheet.
#
# git-koi (https://github.com/yalongwastaken/git-koi) is by Anthony Yalong,
# MIT licensed. It's fetched at a pinned commit and patched (koi/render-pose.patch)
# so it can draw the koi swimming in place; the scene moves it around the pond.
#
# Usage: GH_TOKEN=... scripts/koi.sh LOGIN
# Needs: git, cargo, and the GitHub CLI (git-koi collects through `gh api`).
set -euo pipefail

login="${1:?usage: scripts/koi.sh LOGIN}"
# Pinned rather than a release tag: the patch needs the pond-size API, which is
# on main but in no release yet (v1.0.2 predates it).
git_koi_commit="3d2661c4d025192deb5c27a005271f30090cf121"
root="$(cd "$(dirname "$0")/.." && pwd)"
vendor="$root/koi/vendor/git-koi"

if [ ! -d "$vendor/.git" ]; then
  git init --quiet "$vendor"
  git -C "$vendor" fetch --quiet --depth 1 https://github.com/yalongwastaken/git-koi "$git_koi_commit"
  git -C "$vendor" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
  git -C "$vendor" apply "$root/koi/render-pose.patch"
fi

cargo build --quiet --release --locked --manifest-path "$vendor/Cargo.toml"
cargo build --quiet --release --locked --manifest-path "$root/koi/Cargo.toml"

snapshot="$(mktemp)"
trap 'rm -f "$snapshot"' EXIT
"$vendor/target/release/git-koi" collect "$login" --output "$snapshot"
"$root/koi/target/release/koi-sprite" "$snapshot" "$root/public/koi"
