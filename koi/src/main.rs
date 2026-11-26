//! Draws the account's koi swimming in place, as a sprite sheet for the skyline.
//!
//! git-koi (https://github.com/yalongwastaken/git-koi, MIT, by Anthony Yalong)
//! decides everything about the koi: its colors from the account's languages,
//! its size from its contributions, its marks from its streaks, and how it
//! swims from the day that just ended. Upstream, the koi also follows a lap of
//! its frame. Here every frame keeps the day's body wave, strokes and fins but
//! stays in place facing one way, and `src/scene/Pond.tsx` steers it along a
//! wandering path around the pond instead.
//!
//! Usage: koi-sprite SNAPSHOT OUT_DIR
//! Writes OUT_DIR/sheet.png and OUT_DIR/sheet.json.

use std::error::Error;
use std::fs;
use std::path::PathBuf;

use git_koi::behavior::{Behavior, select_behavior};
use git_koi::coat::KoiBody;
use git_koi::history::AccountSnapshot;
use git_koi::koi::derive_koi_development;
use git_koi::motion::{Course, FRAMES_PER_SECOND, SwimPose, calculate_swim_pose, frame_count};
use git_koi::pond::PondSize;
use git_koi::render::{measure_pose_center, render_pose_at};

/// Each frame is square and big enough for the largest koi with fins spread.
const FRAME_PIXELS: u32 = 256;
/// One texture side at or under this works on every GPU worth supporting.
const MAX_SHEET_PIXELS: u32 = 4096;

/// How fast the scene moves the koi, in koi body lengths per second, for each
/// of the day's behaviors: the everyday cruise, a fast dart, or drifting.
fn swim_speed(behavior: Behavior) -> f64 {
    match behavior {
        Behavior::Cruise => 0.55,
        Behavior::Dart => 1.0,
        Behavior::Rest => 0.18,
        Behavior::SurfaceFeeding => 0.12,
        Behavior::DeepRest => 0.06,
    }
}

/// The day's pose for a frame, held in place: laps become a hover facing the
/// still heading, and hovers keep their small turns but lose their drift.
fn in_place(pose: SwimPose) -> SwimPose {
    let heading_offset_radians = match pose.course {
        Course::Lap { .. } => 0.0,
        Course::Hover { heading_offset_radians, .. } => heading_offset_radians,
    };
    SwimPose {
        course: Course::Hover { heading_offset_radians, drift_pixels: [0.0, 0.0] },
        ..pose
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let mut args = std::env::args_os().skip(1);
    let (Some(snapshot_path), Some(out_dir)) = (args.next(), args.next()) else {
        return Err("usage: koi-sprite SNAPSHOT OUT_DIR".into());
    };
    let out_dir = PathBuf::from(out_dir);

    let snapshot: AccountSnapshot = serde_json::from_str(&fs::read_to_string(&snapshot_path)?)?;
    let koi_development = derive_koi_development(&snapshot)?;
    let behavior = select_behavior(&koi_development);
    let pond_size = PondSize::new(FRAME_PIXELS, FRAME_PIXELS)?;

    let frames = frame_count(behavior);
    // Fit the loop in one texture by keeping every n-th frame and showing each
    // one for n times as long, so the loop keeps its length.
    let mut step = 1;
    let (cols, rows, kept) = loop {
        let kept = frames.div_ceil(step);
        let cols = (f64::from(kept).sqrt().ceil()) as u32;
        let rows = kept.div_ceil(cols);
        if cols * FRAME_PIXELS <= MAX_SHEET_PIXELS && rows * FRAME_PIXELS <= MAX_SHEET_PIXELS {
            break (cols, rows, kept);
        }
        step += 1;
    };

    // One view for the whole loop, centered on the first frame, so the koi never
    // shakes from frame to frame.
    let center = measure_pose_center(&koi_development, &in_place(calculate_swim_pose(behavior, 0)));

    let sheet_w = (cols * FRAME_PIXELS) as usize;
    let mut sheet = vec![0u8; sheet_w * (rows * FRAME_PIXELS) as usize * 4];
    for i in 0..kept {
        let pose = in_place(calculate_swim_pose(behavior, i * step));
        let frame = render_pose_at(pond_size, &koi_development, KoiBody::White, &pose, center);
        let pixels = frame.as_rgba_bytes();
        let (ox, oy) = ((i % cols * FRAME_PIXELS) as usize, (i / cols * FRAME_PIXELS) as usize);
        let row_bytes = FRAME_PIXELS as usize * 4;
        for y in 0..FRAME_PIXELS as usize {
            let src = &pixels[y * row_bytes..(y + 1) * row_bytes];
            let dst = ((oy + y) * sheet_w + ox) * 4;
            sheet[dst..dst + row_bytes].copy_from_slice(src);
        }
    }

    fs::create_dir_all(&out_dir)?;
    let file = fs::File::create(out_dir.join("sheet.png"))?;
    let mut encoder = png::Encoder::new(file, cols * FRAME_PIXELS, rows * FRAME_PIXELS);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    encoder.write_header()?.write_image_data(&sheet)?;

    let meta = serde_json::json!({
        "frames": kept,
        "cols": cols,
        "rows": rows,
        "frameMs": f64::from(step) * 1000.0 / f64::from(FRAMES_PER_SECOND),
        "behavior": format!("{behavior:?}"),
        "speed": swim_speed(behavior),
        "observedOn": koi_development.observed_on.to_string(),
    });
    fs::write(out_dir.join("sheet.json"), format!("{meta}\n"))?;
    println!("koi sheet: {meta}");
    Ok(())
}
