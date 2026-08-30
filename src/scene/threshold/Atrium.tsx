import { useMemo, useRef } from 'react'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
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
import { useMarble } from '../materials/Marble.tsx'
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

  // Le marbre du hall : fond clair, veines sourdes. Voir materials/Marble.tsx.
  const marbreMur = useMarble({ base: SEUIL.hall, vein: '#6b5a49', scale: 7, sharpness: 4.5 })
  const marbreColonne = useMarble({ base: SEUIL.hall, vein: '#7a6552', scale: 3.4, sharpness: 3.2 })

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
      {/*
        Le sol du hall REFLECHIT vraiment.
        C'est le seul endroit du site ou l'on paye une passe de rendu
        supplementaire pour un miroir, et c'est justifie : le hall ne compte
        qu'une poignee d'appels de rendu, et le sol poli est le motif central
        de la capture 4 — c'est lui qui double la lumiere du cube et creuse la
        salle. Dans la bibliotheque, en revanche, le sol est presque noir : la
        meme passe y couterait le double du rendu pour un reflet invisible.
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ATRIUM_RADIUS, 64]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1.1}
          mixStrength={2.6}
          blur={[240, 60]}
          mirror={0.42}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color={SEUIL.hallOmbre}
          metalness={0.42}
          roughness={0.7}
        />
      </mesh>

      {/* Le mur circulaire. */}
      <mesh position={[0, ATRIUM_WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[ATRIUM_RADIUS, ATRIUM_RADIUS, ATRIUM_WALL_HEIGHT, 72, 1, true]} />
        <meshStandardMaterial ref={marbreMur} roughness={0.92} side={BackSide} />
      </mesh>

      {/* La coupole, et son oculus laisse ouvert au sommet. */}
      <mesh position={[0, ATRIUM_WALL_HEIGHT, 0]}>
        <sphereGeometry args={[ATRIUM_RADIUS, 72, 36, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <meshStandardMaterial ref={marbreMur} roughness={0.92} side={BackSide} />
      </mesh>

      <Boxes boxes={caissons} color={SEUIL.hallOmbre} roughness={0.95} receiveShadow={false} />
      <InstancedShapes items={colonnes} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial ref={marbreColonne} roughness={0.8} />
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
      {/*
        L'eclairage d'ambiance du hall, PRECALCULE.
        La decision D16 prevoyait des lightmaps cuites hors ligne. Faute de
        chaine de cuisson, on en fait l'equivalent le plus proche disponible
        dans le navigateur : quelques sources de forme sont rendues UNE FOIS
        dans une carte d'environnement, qui eclaire ensuite toute la salle sans
        rien couter par image. Ce n'est pas de la radiosite, mais cela donne au
        marbre le halo doux qu'une simple lumiere ponctuelle ne produit jamais.
      */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="ring"
          intensity={2.6}
          color={SEUIL.soleil}
          position={[0, 12, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={9}
        />
        <Lightformer
          form="rect"
          intensity={0.55}
          color={SEUIL.or}
          position={[0, 1, 0]}
          scale={7}
        />
        <Lightformer form="rect" intensity={0.2} color={SEUIL.hall} position={[0, -8, 0]} scale={22} />
      </Environment>
      <ambientLight color={SEUIL.hall} intensity={0.05} />
    </>
  )
}
