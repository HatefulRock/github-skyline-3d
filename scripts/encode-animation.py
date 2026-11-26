#!/usr/bin/env python3
"""Encodes the frames from scripts/animate.mjs as a looping animated WebP.

Usage: python3 scripts/encode-animation.py FRAMES_DIR OUT.webp FPS

Only the koi moves, and WebP stores each frame as just the region that changed
from the last, so a whole loop costs little more than one still.
"""

import sys
from pathlib import Path

from PIL import Image


def main() -> None:
    frames_dir, out, fps = Path(sys.argv[1]), Path(sys.argv[2]), float(sys.argv[3])
    paths = sorted(frames_dir.glob("*.png"))
    if not paths:
        sys.exit(f"no frames in {frames_dir}")
    frames = [Image.open(p).convert("RGB") for p in paths]
    frames[0].save(
        out,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / fps),
        loop=0,
        quality=82,
        method=6,
    )
    print(f"wrote {out} ({len(frames)} frames, {out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
