import { useMemo } from 'react'
import { AdditiveBlending, BackSide, Color, DoubleSide } from 'three'

/**
 * Un faisceau de lumiere, en volume.
 *
 * Le rendu temps reel ne fait pas de volumetrique gratuitement. On le simule
 * avec un cone transparent en melange ADDITIF, dont l'opacite decroit vers le
 * bas et surtout vers les BORDS : c'est ce degrade lateral qui donne
 * l'impression d'un volume de poussiere eclairee plutot que d'un cone en
 * plastique.
 *
 * Le shader tient en quelques lignes, ne charge aucune texture, et le cone ne
 * coute qu'un seul appel de rendu.
 */

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 vue = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-vue.xyz);
    gl_Position = projectionMatrix * vue;
  }
`

const fragmentShader = `
  uniform vec3 teinte;
  uniform float force;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    // Le faisceau s'eteint vers le bas : la lumiere se dilue en descendant.
    float bas = pow(1.0 - vUv.y, 1.6);
    // Et il s'eteint sur les bords, la ou l'on regarde la surface de biais.
    // Sans ce terme, le cone aurait une arete franche et paraitrait solide.
    float bord = pow(clamp(abs(vView.z), 0.0, 1.0), 1.4);
    gl_FragColor = vec4(teinte, bas * bord * force);
  }
`

export function LightShaft({
  position,
  radius,
  height,
  color,
  strength = 0.35,
}: {
  position: [number, number, number]
  radius: number
  height: number
  color: string
  strength?: number
}): React.ReactElement {
  const uniforms = useMemo(
    () => ({ teinte: { value: new Color(color) }, force: { value: strength } }),
    [color, strength],
  )

  return (
    <mesh position={position} renderOrder={2}>
      <coneGeometry args={[radius, height, 40, 1, true]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Le halo spherique autour d'une source ponctuelle.
 *
 * Meme principe, en plus simple : une sphere additive dont l'opacite decroit
 * vers les bords. Pose autour d'une lampe, elle lui donne l'aureole que le
 * bloom seul ne suffit pas a produire quand la source est petite.
 */
const haloFragment = `
  uniform vec3 teinte;
  uniform float force;
  varying vec3 vView;
  varying vec3 vNormale;
  void main() {
    float bord = pow(clamp(dot(vNormale, vView), 0.0, 1.0), 2.2);
    gl_FragColor = vec4(teinte, bord * force);
  }
`

const haloVertex = `
  varying vec3 vView;
  varying vec3 vNormale;
  void main() {
    vec4 vue = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-vue.xyz);
    vNormale = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * vue;
  }
`

export function Halo({
  position,
  radius,
  color,
  strength = 0.5,
}: {
  position: [number, number, number]
  radius: number
  color: string
  strength?: number
}): React.ReactElement {
  const uniforms = useMemo(
    () => ({ teinte: { value: new Color(color) }, force: { value: strength } }),
    [color, strength],
  )
  return (
    <mesh position={position} renderOrder={2}>
      <sphereGeometry args={[radius, 24, 16]} />
      <shaderMaterial
        vertexShader={haloVertex}
        fragmentShader={haloFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={BackSide}
        toneMapped={false}
      />
    </mesh>
  )
}
