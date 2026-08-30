import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Vector3 } from 'three'
import { DOME_BASE_Y, DOME_RADIUS } from './dimensions.ts'
import { Atrium } from './Atrium.tsx'
import { Exterior } from './Exterior.tsx'
import { SEUIL } from './palette.ts'
import { Sky } from './Sky.tsx'
import { INSIDE_AT, THRESHOLD_DURATION, cameraAt } from './sequence.ts'
import { useLibraryStore } from '../../store/useLibraryStore.ts'
import { Dust } from '../effects/Dust.tsx'
import { Effects } from '../effects/Effects.tsx'
import { Halo, LightShaft } from '../effects/LightShaft.tsx'
import { ATRIUM_RADIUS, ATRIUM_WALL_HEIGHT, CUBE_SIZE, CUBE_Y } from './dimensions.ts'

/**
 * Le Seuil : la sequence d'arrivee.
 *
 * On arrive de la plaine, on voit le dome, on monte les marches, on franchit
 * l'entree unique, et l'on debouche dans le grand hall ou flotte le cube. Puis
 * la bibliotheque commence.
 *
 * La camera est sur des rails (voir sequence.ts) : ce sont des plans composes,
 * pas une camera libre. C'est ce que demande la direction artistique, et c'est
 * ce qui garantit que la premiere impression est la meme pour tout le monde.
 */
export function Threshold({ onFinish }: { onFinish: () => void }): React.ReactElement {
  const profile = useLibraryStore((state) => state.profile)
  const camera = useThree((state) => state.camera)
  const elapsed = useRef(0)
  const done = useRef(false)
  const [inside, setInside] = useState(false)

  // Vecteur de travail, alloue une seule fois.
  const cible = useRef(new Vector3())

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05)
    const time = elapsed.current

    const shot = cameraAt(time)
    camera.position.set(shot.position.x, shot.position.y, shot.position.z)
    cible.current.set(shot.lookAt.x, shot.lookAt.y, shot.lookAt.z)
    camera.lookAt(cible.current)

    // Le passage dehors -> dedans est une COUPE, pas un fondu : on ne modelise
    // pas le tunnel de l'entree, on change de plan. C'est du montage.
    const dedans = time >= INSIDE_AT
    if (dedans !== inside) setInside(dedans)

    if (!done.current && time >= THRESHOLD_DURATION) {
      done.current = true
      onFinish()
    }
  })

  if (inside) {
    return (
      <>
        <color attach="background" args={['#0f0c09']} />
        <fogExp2 attach="fog" args={['#0f0c09', 0.012]} />
        <Atrium />

        {/*
          Le rai de l'oculus, tombant sur le cube. C'est le plan de la
          capture 4 : une seule colonne de lumiere dans une salle noire.
        */}
        <LightShaft
          position={[0, ATRIUM_WALL_HEIGHT * 0.62, 0]}
          radius={ATRIUM_RADIUS * 0.34}
          height={ATRIUM_WALL_HEIGHT * 1.5}
          color={SEUIL.soleil}
          strength={0.24}
        />
        <Halo position={[0, CUBE_Y, 0]} radius={CUBE_SIZE * 2.6} color={SEUIL.or} strength={0.4} />
        <Dust
          count={Math.round(profile.dust * 2.7)}
          radius={ATRIUM_RADIUS * 0.42}
          height={ATRIUM_WALL_HEIGHT * 1.2}
          color={SEUIL.soleil}
          strength={0.3}
          size={9}
        />
        <Effects ambiance="hall" complet={profile.fullEffects} />
      </>
    )
  }

  return (
    <>
      <Sky />
      {/*
        Brouillard leger seulement : trop dense, il laverait les montagnes vers
        l'or de l'horizon alors qu'elles doivent rester en silhouette SOMBRE,
        comme sur la capture 3.
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
    </>
  )
}
