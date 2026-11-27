import { Color, type WebGLProgramParametersWithUniforms } from "three"
import { CELL_SIZE, PODIUM_H, VOXEL_H } from "../utils/grid"

/** A procedural facade drawn in world space, so a tower of any height is one
 *  continuous shaft with storeys, mullions and rooms instead of a stack of
 *  textured cubes.
 *
 *  Everything is derived from the fragment's world position: the storey from
 *  its height, the window column from its offset along the face, and whether a
 *  room is lit from a hash of (storey, column, face, tower). That keeps the
 *  render deterministic -- the same data draws the same lit rooms every day --
 *  and costs no textures at all. */
export interface FacadeStyle {
  /** Storey height in world units. */
  floorH: number
  /** Window column width in world units. */
  colW: number
  /** Frame thickness between panes, as a fraction of a column. */
  mullion: number
  /** Spandrel band between storeys, as a fraction of a storey. */
  band: number
  /** Share of rooms with the lights on. */
  lit: number
  /** Emissive strength of a lit room. */
  glow: number
  /** Roughness of the glass panes and of the frames/spandrels. */
  paneRoughness: number
  frameRoughness: number
  /** How much darker an unlit pane is than the building's own colour. */
  paneShade: number
  /** Frame colour multiplier (above 1 reads as a pale metal frame). */
  frameShade: number
}

export const GLASS_FACADE: FacadeStyle = {
  floorH: VOXEL_H / 2,
  colW: CELL_SIZE / 5,
  mullion: 0.07,
  band: 0.16,
  lit: 0.26,
  glow: 1.15,
  paneRoughness: 0.05,
  frameRoughness: 0.45,
  paneShade: 0.17,
  frameShade: 0.82,
}

export const CONCRETE_FACADE: FacadeStyle = {
  floorH: VOXEL_H / 2,
  colW: CELL_SIZE / 4,
  mullion: 0.26,
  band: 0.36,
  lit: 0.24,
  glow: 0.9,
  paneRoughness: 0.12,
  frameRoughness: 0.82,
  paneShade: 0.22,
  frameShade: 1.0,
}

const f = (n: number) => n.toFixed(5)

export function facadePatch(style: FacadeStyle, warm: string, cool: string) {
  const w = new Color(warm)
  const c = new Color(cool)
  return (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uWarm = { value: w }
    shader.uniforms.uCool = { value: c }

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vFcWorld;
varying vec3 vFcNormal;
varying vec3 vFcCenter;
varying float vFcHalf;
varying vec3 vFcView;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
{
  vec4 fw = vec4(transformed, 1.0);
  vec3 ctr = vec3(0.0);
  float half_ = ${f(CELL_SIZE / 2)};
  #ifdef USE_INSTANCING
    fw = instanceMatrix * fw;
    ctr = instanceMatrix[3].xyz;
    half_ *= length(instanceMatrix[0].xyz);
  #endif
  fw = modelMatrix * fw;
  vFcWorld = fw.xyz;
  vFcNormal = normal;
  vFcCenter = (modelMatrix * vec4(ctr, 1.0)).xyz;
  vFcHalf = half_;
  vFcView = cameraPosition - fw.xyz;
}`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uWarm;
uniform vec3 uCool;
varying vec3 vFcWorld;
varying vec3 vFcNormal;
varying vec3 vFcCenter;
varying float vFcHalf;
varying vec3 vFcView;
float fcHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
// Anti-aliased box: 1 inside [a, b], 0 outside, softened by one pixel.
float fcBand(float x, float a, float b) {
  float w = fwidth(x) * 0.75 + 1e-4;
  return smoothstep(a - w, a + w, x) * (1.0 - smoothstep(b - w, b + w, x));
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 fcN = normalize(vFcNormal);
// Walls only: roofs and the bottom face keep the plain material.
float fcWall = 1.0 - smoothstep(0.45, 0.7, abs(fcN.y));
bool fcAlongZ = abs(fcN.x) > abs(fcN.z);
float fcFace = fcAlongZ ? sign(fcN.x) : 2.0 * sign(fcN.z);
float fcU = fcAlongZ ? vFcWorld.z - vFcCenter.z : vFcWorld.x - vFcCenter.x;
float fcCols = ${f(style.colW)};
// Columns centred on the face so a facade is symmetric about its middle.
float fcCu = fcU / fcCols + 0.5;
float fcCol = floor(fcCu);
float fcFu = fract(fcCu);
float fcFy = (vFcWorld.y - ${f(PODIUM_H)}) / ${f(style.floorH)};
float fcFloor = floor(fcFy);
float fcFv = fract(fcFy);
// Keep a solid margin at the corners, where the bevel turns the face.
float fcEdge = 1.0 - smoothstep(vFcHalf - 0.07, vFcHalf - 0.045, abs(fcU));
float fcPane = fcBand(fcFu, ${f(style.mullion / 2)}, ${f(1 - style.mullion / 2)})
             * fcBand(fcFv, ${f(style.band)}, 0.97)
             * fcEdge * fcWall;
// Rooms span two columns, so lit windows come in runs along a floor rather
// than as single-pixel speckle.
vec3 fcSeed = vec3(fcFloor, floor(fcCol / 2.0), fcFace) + floor(vFcCenter * 13.0);
float fcH = fcHash(fcSeed);
float fcLit = step(${f(1 - style.lit)}, fcH);
// Whole floors switch on together now and then: offices working late.
fcLit = max(fcLit, step(0.95, fcHash(vec3(fcFloor, 7.0, 3.0) + floor(vFcCenter * 13.0))));
vec3 fcBase = diffuseColor.rgb;
diffuseColor.rgb = mix(fcBase * ${f(style.frameShade)}, fcBase * ${f(style.paneShade)}, fcPane);
// Darkened corners: a shadow line down each vertical edge, so towers standing
// side by side read as separate buildings instead of one bright mass.
float fcCorner = smoothstep(vFcHalf - 0.06, vFcHalf - 0.015, abs(fcU)) * fcWall;
diffuseColor.rgb *= 1.0 - 0.55 * fcCorner;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, mix(${f(style.frameRoughness)}, ${f(style.paneRoughness)}, fcPane), fcWall);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  // Fake room depth: a back wall seen through the pane, shifted by the view
  // angle, with a ceiling-lit falloff towards the top of the room.
  vec3 v = normalize(vFcView);
  float vu = fcAlongZ ? v.z * sign(fcN.x) : -v.x * sign(fcN.z);
  vec2 back = vec2(fcFu, fcFv) + vec2(vu, -v.y) * 0.22;
  float wall = fcBand(back.x, 0.18, 0.82) * fcBand(back.y, 0.1, 0.9);
  float depth = mix(0.45, 1.0, wall) * mix(0.75, 1.15, 1.0 - fcFv);
  float tone = fcHash(fcSeed + 17.0);
  vec3 room = mix(uWarm, uCool, step(0.8, tone)) * mix(0.55, 1.2, fcHash(fcSeed + 5.0));
  totalEmissiveRadiance += room * depth * fcLit * fcPane * ${f(style.glow)};
}`,
      )
  }
}
