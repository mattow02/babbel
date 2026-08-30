import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, type Mesh } from 'three'
import { Boxes } from '../Boxes.tsx'
import { InstancedShapes } from '../InstancedShapes.tsx'
import type { Box } from '../instancing.ts'
import {
  ATRIUM_RADIUS,
  ATRIUM_WALL_HEIGHT,
  CUBE_SIZE,
  CUBE_Y,
} from './dimensions.ts'
import { atriumColumns, domeCoffers } from './landscape.ts'
import { SEUIL } from './palette.ts'

/**
 * Le grand hall, et le cube d'or qui flotte en son centre.
 *
 * C'est le plan de la capture 4 de `design/` : une coupole a caissons percee
 * d'un oculus, une colonnade qui ceinture la salle, et au milieu un cube
 * lumineux qui est la seule vraie source de la piece.
 *
 * Contrairement a l'exterieur, cet interieur n'a pas de soleil : c'est ici que
 * l'eclairage precalcule prendra tout son sens (decision D16). En attendant,
 * deux sources suffisent — l'oculus et le cube.
 */
export function Atrium(): React.ReactElement {
  const cube = useRef<Mesh>(null)

  const colonnes = useMemo<Box[]>(
    () =>
      atriumColumns().map((column) => ({
        x: column.x,
        y: column.y,
        z: column.z,
        rotY: column.rotY,
        sx: 2.1,
        sy: ATRIUM_WALL_HEIGHT,
        sz: 2.1,
      })),
    [],
  )

  const caissons = useMemo(() => domeCoffers(ATRIUM_RADIUS * 0.98, ATRIUM_WALL_HEIGHT), [])

  // Le cube tourne tres lentement : assez pour qu'il soit vivant, pas assez
  // pour qu'on le remarque.
  useFrame((_, delta) => {
    if (cube.current) {
      cube.current.rotation.y += delta * 0.12
      cube.current.rotation.x += delta * 0.05
    }
  })

  return (
    <>
      {/* Le sol du hall, poli : il double la lumiere du cube. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ATRIUM_RADIUS, 64]} />
        <meshStandardMaterial color={SEUIL.hallOmbre} roughness={0.18} metalness={0.1} />
      </mesh>

      {/* Le mur circulaire. */}
      <mesh position={[0, ATRIUM_WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[ATRIUM_RADIUS, ATRIUM_RADIUS, ATRIUM_WALL_HEIGHT, 72, 1, true]} />
        <meshStandardMaterial color={SEUIL.hall} roughness={0.95} side={BackSide} />
      </mesh>

      {/* La coupole, et son oculus laisse ouvert au sommet. */}
      <mesh position={[0, ATRIUM_WALL_HEIGHT, 0]}>
        <sphereGeometry args={[ATRIUM_RADIUS, 72, 36, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <meshStandardMaterial color={SEUIL.hall} roughness={0.95} side={BackSide} />
      </mesh>

      <Boxes boxes={caissons} color={SEUIL.hallOmbre} roughness={0.95} receiveShadow={false} />
      <InstancedShapes items={colonnes} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial color={SEUIL.hall} roughness={0.85} />
      </InstancedShapes>

      {/* Le cube d'or, en levitation. */}
      <mesh ref={cube} position={[0, CUBE_Y, 0]} castShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          color={SEUIL.or}
          emissive={SEUIL.or}
          emissiveIntensity={0.8}
          roughness={0.28}
          metalness={0.85}
        />
      </mesh>

      {/* La lumiere du cube : la seule vraie source de la piece. */}
      <pointLight position={[0, CUBE_Y, 0]} color={SEUIL.or} intensity={260} distance={70} decay={2} />

      {/* Le jour qui tombe de l'oculus. */}
      <spotLight
        position={[0, ATRIUM_WALL_HEIGHT + ATRIUM_RADIUS * 0.9, 0]}
        target-position={[0, 0, 0]}
        color={SEUIL.soleil}
        intensity={5200}
        distance={120}
        angle={0.5}
        penumbra={0.9}
        decay={2}
      />
      <ambientLight color={SEUIL.hall} intensity={0.09} />
    </>
  )
}
