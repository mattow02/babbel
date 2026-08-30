import { BackSide } from 'three'
import { SEUIL } from './palette.ts'

/**
 * Le ciel : un degrade vertical, du teal profond a la brume doree.
 *
 * Une grande sphere retournee, avec un degrade calcule dans le nuancier. Pas
 * de texture, pas de fichier a charger : quelques lignes de shader suffisent,
 * et le degrade reste net a n'importe quelle resolution.
 */
const vertexShader = `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 haut;
  uniform vec3 bas;
  uniform vec3 brume;
  varying vec3 vWorld;
  void main() {
    float h = clamp(normalize(vWorld).y, -1.0, 1.0);
    // Le degrade principal, du zenith vers l'horizon.
    vec3 couleur = mix(bas, haut, smoothstep(-0.05, 0.65, h));
    // Une brume doree, serree juste au-dessus de l'horizon.
    couleur = mix(couleur, brume, smoothstep(0.16, -0.02, h) * 0.85);
    gl_FragColor = vec4(couleur, 1.0);
  }
`

export function Sky(): React.ReactElement {
  return (
    <mesh scale={900}>
      <sphereGeometry args={[1, 32, 20]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        fog={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          haut: { value: colorOf(SEUIL.cielHaut) },
          bas: { value: colorOf(SEUIL.cielBas) },
          brume: { value: colorOf(SEUIL.brume) },
        }}
      />
    </mesh>
  )
}

/** Convertit un code hexadecimal en triplet lineaire pour le shader. */
function colorOf(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  const srgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255)
  // Conversion sRGB -> lineaire, sinon le degrade parait delave.
  return srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
}
