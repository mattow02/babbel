import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Points } from 'three'
import { unitOf } from '../hash.ts'

/**
 * La poussiere en suspension.
 *
 * Rien ne dit mieux « il y a de l'air ici » que quelques milliers de grains qui
 * derivent dans un rai de lumiere. C'est un des motifs les plus visibles des
 * images de reference, et l'un des moins chers : un seul nuage de points, un
 * seul appel de rendu, aucune texture.
 *
 * Les grains ne sont pas simules : ils flottent sur des trajectoires calculees
 * dans le shader a partir du temps. Il n'y a donc AUCUNE ecriture de tampon
 * par image, et le cout cote processeur est exactement nul.
 */

const vertexShader = `
  uniform float temps;
  uniform float hauteur;
  uniform float taille;
  attribute float graine;
  varying float vOpacite;

  void main() {
    vec3 p = position;
    // Une derive lente, jamais verticale : la poussiere tombe en tournoyant.
    float t = temps * (0.06 + graine * 0.05);
    p.x += sin(t * 1.7 + graine * 31.0) * 0.42;
    p.z += cos(t * 1.3 + graine * 17.0) * 0.42;
    p.y = mod(p.y - t * 0.55, hauteur);

    vec4 vue = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * vue;
    // Les grains proches sont plus gros, comme de vraies particules.
    gl_PointSize = taille * (1.0 + graine) / max(-vue.z, 0.6);
    // Ils s'effacent en haut et en bas, pour ne pas s'arreter net.
    vOpacite = smoothstep(0.0, 0.18, p.y / hauteur) * smoothstep(1.0, 0.72, p.y / hauteur);
  }
`

const fragmentShader = `
  uniform vec3 teinte;
  uniform float force;
  varying float vOpacite;
  void main() {
    // Un grain rond et doux, sans texture : la distance au centre du point.
    float d = length(gl_PointCoord - 0.5);
    float grain = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(teinte, grain * vOpacite * force);
  }
`

export function Dust({
  count = 900,
  radius = 6,
  height = 3,
  center = [0, 0, 0],
  color = '#f2c078',
  strength = 0.5,
  size = 26,
}: {
  count?: number
  radius?: number
  height?: number
  center?: [number, number, number]
  color?: string
  strength?: number
  size?: number
}): React.ReactElement {
  const points = useRef<Points>(null)

  const { positions, graines } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const graines = new Float32Array(count)
    for (let index = 0; index < count; index += 1) {
      // Racine carree du rayon : sans elle, tous les grains s'entasseraient
      // au centre du disque au lieu de le couvrir uniformement.
      const r = Math.sqrt(unitOf(index * 3)) * radius
      const angle = unitOf(index * 3 + 1) * Math.PI * 2
      positions[index * 3] = Math.cos(angle) * r
      positions[index * 3 + 1] = unitOf(index * 3 + 2) * height
      positions[index * 3 + 2] = Math.sin(angle) * r
      graines[index] = unitOf(index * 7 + 5)
    }
    return { positions, graines }
  }, [count, radius, height])

  const uniforms = useMemo(
    () => ({
      temps: { value: 0 },
      hauteur: { value: height },
      taille: { value: size },
      teinte: { value: new Color(color) },
      force: { value: strength },
    }),
    [height, size, strength, color],
  )

  useFrame((state) => {
    const material = points.current?.material as { uniforms?: Record<string, { value: number }> }
    if (material?.uniforms?.['temps']) material.uniforms['temps'].value = state.clock.elapsedTime
  })

  return (
    <points ref={points} position={center} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-graine" args={[graines, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
