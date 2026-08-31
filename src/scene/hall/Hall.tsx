import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BackSide, DoubleSide, type Mesh } from 'three'
import { Boxes } from '../Boxes.tsx'
import { InstancedShapes } from '../InstancedShapes.tsx'
import type { Box } from '../instancing.ts'
import { unitOf } from '../hash.ts'
import { useMarble } from '../materials/Marble.tsx'
import { SEUIL } from '../threshold/palette.ts'
import { domeCoffers } from '../threshold/landscape.ts'
import {
  AISLE_CEILING,
  AISLE_OUTER_X,
  CUBE_SIZE,
  CUBE_Y,
  CUBE_Z,
  HALL_RADIUS,
  NAVE_END_Z,
  NAVE_ENTRY_Z,
  NAVE_HALF_WIDTH,
  PILLAR_HEIGHT,
  PILLAR_RADIUS,
  TRIBUNE_BACK_Z,
  TRIBUNE_FRONT_Z,
  TRIBUNE_INNER_X,
  TRIBUNE_Y,
} from './dimensions.ts'
import { pillars, stairSteps, tribuneSlabs } from './layout.ts'

/**
 * Le grand hall d'accueil : une nef.
 *
 * On y ENTRE a pied, et c'est tout le sujet. La piece est donc construite pour
 * etre parcourue, pas seulement regardee : une allee qui file, deux files de
 * piliers qui defilent, des bas-cotes plus sombres ou l'on peut s'ecarter,
 * deux escaliers qui montent aux tribunes, et tout au fond le cube d'or, qui
 * est la porte de la bibliotheque.
 *
 * Tout ce qui se repete est instancie : les piliers, leurs bases, leurs
 * chapiteaux, les marches, les caissons. La piece entiere coute une poignee
 * d'appels de rendu.
 */
export function Hall(): React.ReactElement {
  const cube = useRef<Mesh>(null)

  const marbre = useMarble({ base: SEUIL.hall, vein: '#6b5a49', scale: 7, sharpness: 4.5 })
  const marbreFut = useMarble({ base: SEUIL.hall, vein: '#7a6552', scale: 3.4, sharpness: 3.2 })

  /** Les futs, leurs bases et leurs chapiteaux. */
  const { futs, socles, chapiteaux } = useMemo(() => {
    const futs: Box[] = []
    const socles: Box[] = []
    const chapiteaux: Box[] = []
    for (const [index, pilier] of pillars().entries()) {
      // Une variation infime d'echelle : un alignement parfait trahit la
      // machine, et l'oeil la repere avant de savoir pourquoi.
      const ecart = 1 + (unitOf(index * 37) - 0.5) * 0.03
      futs.push({
        x: pilier.x,
        y: PILLAR_HEIGHT / 2,
        z: pilier.z,
        rotY: 0,
        sx: PILLAR_RADIUS * 2 * ecart,
        sy: PILLAR_HEIGHT,
        sz: PILLAR_RADIUS * 2 * ecart,
      })
      socles.push({
        x: pilier.x,
        y: 0.36,
        z: pilier.z,
        rotY: 0,
        sx: PILLAR_RADIUS * 2.9,
        sy: 0.72,
        sz: PILLAR_RADIUS * 2.9,
      })
      chapiteaux.push({
        x: pilier.x,
        y: PILLAR_HEIGHT - 0.45,
        z: pilier.z,
        rotY: 0,
        sx: PILLAR_RADIUS * 3.1,
        sy: 0.9,
        sz: PILLAR_RADIUS * 3.1,
      })
    }
    return { futs, socles, chapiteaux }
  }, [])

  const marches = useMemo(() => stairSteps(), [])
  const tribunes = useMemo(() => tribuneSlabs(), [])
  const caissons = useMemo(() => domeCoffers(HALL_RADIUS * 0.97, PILLAR_HEIGHT + 1.6), [])

  /**
   * L'architrave : la poutre continue posee sur les chapiteaux.
   *
   * Sans elle, les piliers portent le vide, et la nef n'a plus de couronnement.
   */
  const architraves = useMemo<Box[]>(() => {
    const longueur = NAVE_ENTRY_Z - NAVE_END_Z
    const centre = (NAVE_ENTRY_Z + NAVE_END_Z) / 2
    const poutres: Box[] = []
    for (const cote of [-1, 1]) {
      poutres.push({
        x: cote * TRIBUNE_INNER_X * 0.88,
        y: PILLAR_HEIGHT + 0.6,
        z: centre,
        rotY: 0,
        sx: 2.4,
        sy: 1.3,
        sz: longueur,
      })
    }
    return poutres
  }, [])

  /** Le dallage de l'allee : de longues dalles alternees, pas un plan uni. */
  const dallage = useMemo<Box[]>(() => {
    const dalles: Box[] = []
    const pas = 3.4
    const rangs = Math.ceil((NAVE_ENTRY_Z - NAVE_END_Z) / pas)
    for (let rang = 0; rang < rangs; rang += 1) {
      const z = NAVE_END_Z + rang * pas + pas / 2
      for (const colonne of [-1, 0, 1]) {
        dalles.push({
          x: colonne * NAVE_HALF_WIDTH * 0.66,
          y: 0.03,
          z,
          rotY: 0,
          sx: NAVE_HALF_WIDTH * 0.62,
          sy: 0.06,
          sz: pas * 0.94,
        })
      }
    }
    return dalles
  }, [])

  useFrame((_, delta) => {
    if (cube.current) {
      cube.current.rotation.y += delta * 0.11
      cube.current.rotation.x += delta * 0.045
    }
  })

  return (
    <>
      {/*
        Le sol REFLECHIT. C'est le seul endroit du site qui paye une passe de
        rendu supplementaire pour un miroir, et c'est justifie : le hall ne
        compte qu'une poignee d'appels, et le poli du sol double la lumiere du
        cube et creuse l'allee. Dans la bibliotheque, le sol est presque noir et
        la meme passe n'y montrerait rien.
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[HALL_RADIUS, 72]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1.2}
          mixStrength={2.4}
          blur={[300, 70]}
          mirror={0.4}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.35}
          color={SEUIL.hallOmbre}
          metalness={0.45}
          roughness={0.68}
        />
      </mesh>

      <Boxes boxes={dallage} color={SEUIL.hall} roughness={0.55} receiveShadow />

      {/* Le mur circulaire, et la coupole a caissons qui le couronne. */}
      <mesh position={[0, PILLAR_HEIGHT / 2 + 1, 0]}>
        <cylinderGeometry args={[HALL_RADIUS, HALL_RADIUS, PILLAR_HEIGHT + 2, 72, 1, true]} />
        <meshStandardMaterial ref={marbre} roughness={0.94} side={BackSide} />
      </mesh>
      <mesh position={[0, PILLAR_HEIGHT + 1.6, 0]}>
        <sphereGeometry args={[HALL_RADIUS, 72, 36, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <meshStandardMaterial ref={marbre} roughness={0.94} side={BackSide} />
      </mesh>
      <Boxes boxes={caissons} color={SEUIL.hallOmbre} roughness={0.95} receiveShadow={false} />

      {/* Les deux files de piliers. */}
      <InstancedShapes items={futs} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.54, 1, 24]} />
        <meshStandardMaterial ref={marbreFut} roughness={0.78} />
      </InstancedShapes>
      <Boxes boxes={socles} color={SEUIL.hall} roughness={0.85} castShadow />
      <Boxes boxes={chapiteaux} color={SEUIL.hall} roughness={0.85} castShadow />
      <Boxes boxes={architraves} color={SEUIL.hall} roughness={0.9} castShadow />

      {/* Les bas-cotes : plafond bas, donc pesant, donc sombre. */}
      {[-1, 1].map((cote) => (
        <mesh
          key={cote}
          position={[cote * (TRIBUNE_INNER_X + (AISLE_OUTER_X - TRIBUNE_INNER_X) / 2), AISLE_CEILING, (NAVE_ENTRY_Z + TRIBUNE_FRONT_Z) / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[AISLE_OUTER_X - TRIBUNE_INNER_X, NAVE_ENTRY_Z - TRIBUNE_FRONT_Z]} />
          <meshStandardMaterial color={SEUIL.hallOmbre} roughness={1} side={DoubleSide} />
        </mesh>
      ))}

      {/* Les escaliers lateraux, et les tribunes qu'ils desservent. */}
      <Boxes boxes={marches} color={SEUIL.hall} roughness={0.88} castShadow receiveShadow />
      <Boxes boxes={tribunes} color={SEUIL.hall} roughness={0.86} castShadow receiveShadow />

      {/* Le cube d'or, en levitation au bout de l'allee. */}
      <mesh ref={cube} position={[0, CUBE_Y, CUBE_Z]} castShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          color={SEUIL.or}
          emissive={SEUIL.or}
          /*
           * Assez d'emission pour que le cube soit une SOURCE, pas assez pour
           * qu'il devienne un aplat : au-dela, ses faces ont toutes la meme
           * valeur et l'objet perd son volume.
           */
          emissiveIntensity={0.34}
          roughness={0.26}
          metalness={0.88}
        />
      </mesh>
      <pointLight position={[0, CUBE_Y, CUBE_Z]} color={SEUIL.or} intensity={320} distance={80} decay={2} />

      {/* Le jour qui tombe de l'oculus, dans l'axe du cube. */}
      <spotLight
        position={[0, PILLAR_HEIGHT + HALL_RADIUS * 0.85, CUBE_Z]}
        target-position={[0, 0, CUBE_Z]}
        color={SEUIL.soleil}
        intensity={6200}
        distance={130}
        angle={0.42}
        penumbra={0.92}
        decay={2}
      />
      {/* Le jour de l'entree, qui rentre par le portail derriere nous. */}
      <spotLight
        position={[0, TRIBUNE_Y, NAVE_ENTRY_Z - 1]}
        target-position={[0, 0, TRIBUNE_BACK_Z]}
        color={SEUIL.soleil}
        intensity={2600}
        distance={120}
        angle={0.6}
        penumbra={1}
        decay={2}
      />

      {/*
        L'eclairage d'ambiance, PRECALCULE une fois dans une carte
        d'environnement (decision D16). Ce n'est pas de la radiosite, mais c'est
        ce qui donne au marbre son halo doux ; une ponctuelle ne le fait jamais.
      */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="ring" intensity={2.4} color={SEUIL.soleil} position={[0, 14, CUBE_Z]} rotation={[Math.PI / 2, 0, 0]} scale={10} />
        <Lightformer form="rect" intensity={0.6} color={SEUIL.or} position={[0, 2, CUBE_Z]} scale={8} />
        <Lightformer form="rect" intensity={0.22} color={SEUIL.hall} position={[0, -8, 0]} scale={26} />
      </Environment>
      <ambientLight color={SEUIL.hall} intensity={0.06} />
    </>
  )
}
