import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { DOME_BASE_Y, DOME_RADIUS, PORTAL_WIDTH, PORTAL_Z } from './dimensions.ts'
import { Exterior } from './Exterior.tsx'
import { SEUIL } from './palette.ts'
import { Sky } from './Sky.tsx'
import { ARRIVAL, THRESHOLD_DURATION, cameraAt } from './sequence.ts'
import { useLibraryStore } from '../../store/useLibraryStore.ts'
import { Effects } from '../effects/Effects.tsx'
import type { Point2 } from '../navigation/geometry.ts'
import { usePlayer, type World } from '../navigation/usePlayer.ts'
import { STAIR_TOP_Y } from './landscape.ts'

/**
 * Le Seuil : l'arrivee, puis le parvis.
 *
 * La sequence n'est plus un film qui traverse le batiment. Elle amene le
 * visiteur DEVANT l'entree, a hauteur d'homme, et s'arrete la. C'est ensuite
 * lui qui avance, et c'est lui qui franchit le portail. Un lieu ou l'on entre
 * malgre soi n'est pas un lieu : c'est une video.
 */
export function Threshold(): React.ReactElement {
  const stage = useLibraryStore((state) => state.stage)
  const profile = useLibraryStore((state) => state.profile)

  return (
    <>
      <Sky />
      {/*
        Brouillard leger seulement : trop dense, il laverait les montagnes vers
        l'or de l'horizon alors qu'elles doivent rester en silhouette SOMBRE.
      */}
      <fogExp2 attach="fog" args={[SEUIL.brume, 0.00055]} />

      {/*
        Une seule source : le soleil rasant. C'est ce qui donne les ombres
        longues et le modele du dome. La lumiere du ciel est simulee par une
        hemispherique tres douce, teal en haut, sable en bas.
      */}
      <directionalLight
        color={SEUIL.soleil}
        intensity={3.1}
        position={[-190, 70, 230]}
        castShadow={profile.shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={700}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-bias={-0.0012}
      />
      <hemisphereLight color={SEUIL.cielBas} groundColor={SEUIL.plaine} intensity={0.55} />

      <Exterior />
      <Effects ambiance="exterieur" complet={profile.fullEffects} />

      {/* Un halo chaud pose sur le dome, cote soleil : le liseré des captures. */}
      <pointLight
        position={[-DOME_RADIUS * 0.9, DOME_BASE_Y + DOME_RADIUS * 0.7, DOME_RADIUS * 0.9]}
        color={SEUIL.soleil}
        intensity={2200}
        distance={220}
        decay={2}
      />

      {stage === 'threshold' ? <Sequence /> : <Parvis />}
    </>
  )
}

/** Les plans composes de l'arrivee, jusqu'a l'entree. */
function Sequence(): React.ReactElement | null {
  const camera = useThree((state) => state.camera)
  const arrive = useLibraryStore((state) => state.arrive)
  const elapsed = useRef(0)
  const done = useRef(false)
  const cible = useRef(new Vector3())

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05)
    const shot = cameraAt(elapsed.current)
    camera.position.set(shot.position.x, shot.position.y, shot.position.z)
    cible.current.set(shot.lookAt.x, shot.lookAt.y, shot.lookAt.z)
    camera.lookAt(cible.current)

    if (!done.current && elapsed.current >= THRESHOLD_DURATION) {
      done.current = true
      arrive()
    }
  })

  return null
}

/**
 * Le parvis : quelques metres de terrasse, devant le portail.
 *
 * Le sol y est plat — la volee tombe pile sur la base du dome — et l'espace est
 * volontairement etroit : il n'y a rien a explorer dehors, il y a une entree a
 * franchir. Le seul evenement possible est de passer le seuil.
 */
function Parvis(): null {
  const enterHall = useLibraryStore((state) => state.enterHall)
  const monde = useMemo<World>(() => mondeDuParvis(), [])
  const player = usePlayer(monde)
  const entre = useRef(false)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    player.placeAt(ARRIVAL.position2, ARRIVAL.yaw)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (entre.current) return
    if (camera.position.z <= PORTAL_Z + 0.4) {
      entre.current = true
      enterHall()
    }
  })

  return null
}

/**
 * Ou l'on a le droit de marcher dehors.
 *
 * Un rectangle devant le portail, pose sur la terrasse haute. On ne peut ni
 * redescendre l'escalier ni faire le tour du dome : ce n'est pas un monde
 * ouvert, c'est un seuil.
 */
function mondeDuParvis(): World {
  const demiLargeur = PORTAL_WIDTH / 2 + 11
  const fond = PORTAL_Z - 1
  const arriere = PORTAL_Z + 29

  const dedans = (point: Point2, margin: number): boolean =>
    Math.abs(point.x) <= demiLargeur - margin &&
    point.z >= fond + margin &&
    point.z <= arriere - margin

  return {
    slide: (from, to, margin) => {
      if (dedans(to, margin)) return to
      // Un seul essai par composante suffit : le parvis n'a que des murs
      // droits, et aucun obstacle rond.
      const axe = { x: from.x, z: to.z }
      if (dedans(axe, margin)) return axe
      const lateral = { x: to.x, z: from.z }
      if (dedans(lateral, margin)) return lateral
      return from
    },
    floorAt: () => STAIR_TOP_Y,
    start: { position: { x: 0, z: PORTAL_Z + 26 }, yaw: 0 },
  }
}
