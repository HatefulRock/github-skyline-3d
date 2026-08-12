import { useEffect, useMemo } from "react"
import { BackSide, Color, ShaderMaterial } from "three"

/** Vertical gradient backdrop.
 *
 *  The scene used to paint a single flat colour behind the city, which left the
 *  render sitting in a void -- there was no horizon for the skyline to be a
 *  silhouette against, and the theme's second sky colour was declared but never
 *  actually used. A graded sky gives the towers something to separate from and
 *  gives fog somewhere to fade into.
 *
 *  Drawn on the inside of a large sphere with depth writes off, so it always
 *  sits behind the city no matter how far the camera orbits out. */
export function Sky({ top, horizon }: { top: string; horizon: string }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          topColor: { value: new Color(top) },
          horizonColor: { value: new Color(horizon) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            // The camera looks down at the city, so almost the whole frame is
            // *below* the horizon line. Painting that with the horizon colour
            // floods the entire background with sky and leaves the city darker
            // than the void it sits in -- below the horizon has to fall away
            // into near-black, the way distant unlit ground does.
            vec3 deep = topColor * 0.35;
            vec3 col = mix(deep, topColor, smoothstep(-0.65, 0.45, h));
            // Narrow glow band on the horizon itself, so it only shows when the
            // camera is orbited up near level. Reads as the city's own light
            // haze in the atmosphere.
            col += horizonColor * 0.5 * exp(-abs(h) * 13.0);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [top, horizon],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
