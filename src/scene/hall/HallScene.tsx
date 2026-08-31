import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { useLibraryStore } from '../../store/useLibraryStore.ts'
import { Dust } from '../effects/Dust.tsx'
import { Effects } from '../effects/Effects.tsx'
import { Halo, LightShaft } from '../effects/LightShaft.tsx'
import { usePlayer, type World } from '../navigation/usePlayer.ts'
import { SEUIL } from '../threshold/palette.ts'
import {
  CUBE_REACH,
  CUBE_SIZE,
  CUBE_Y,
  CUBE_Z,
  HALL_RADIUS,
  PILLAR_HEIGHT,
  SPAWN_Z,
} from './dimensions.ts'
import { Hall } from './Hall.tsx'
import { floorFor, slideInHall } from './layout.ts'

/**
 * Le hall, et celui qui le traverse.
 *
 * On y entre a pied par le portail, on descend l'allee, on peut s'ecarter dans
 * les bas-cotes et monter aux tribunes. Le seul evenement du lieu est le cube :
 * s'en approcher, c'est entrer dans la bibliotheque.
 */
export function HallScene(): React.ReactElement {
  const profile = useLibraryStore((state) => state.profile)
  const enterLibrary = useLibraryStore((state) => state.enterLibrary)
  const camera = useThree((state) => state.camera)
  const passe = useRef(false)

  const monde = useMemo<World>(
    () => ({
      slide: slideInHall,
      floorAt: floorFor,
      // On entre dos au portail, face au fond de la nef : c'est le point de
      // fuite, et le cube est au bout.
      start: { position: { x: 0, z: SPAWN_Z }, yaw: 0 },
    }),
    [],
  )
  usePlayer(monde)

  useFrame(() => {
    if (passe.current) return
    const dx = camera.position.x
    const dz = camera.position.z - CUBE_Z
    if (Math.hypot(dx, dz) < CUBE_REACH) {
      passe.current = true
      enterLibrary()
    }
  })

  return (
    <>
      <color attach="background" args={['#0f0c09']} />
      <fogExp2 attach="fog" args={['#0f0c09', 0.011]} />
      <Hall />

      {/* Le rai de l'oculus, tombant sur le cube : une colonne de lumiere. */}
      <LightShaft
        position={[0, PILLAR_HEIGHT * 0.74, CUBE_Z]}
        radius={HALL_RADIUS * 0.14}
        height={PILLAR_HEIGHT * 1.8}
        color={SEUIL.soleil}
        strength={0.3}
      />
      <Halo position={[0, CUBE_Y, CUBE_Z]} radius={CUBE_SIZE * 2.6} color={SEUIL.or} strength={0.42} />
      <Dust
        count={Math.round(profile.dust * 2.7)}
        radius={HALL_RADIUS * 0.4}
        height={PILLAR_HEIGHT * 1.2}
        color={SEUIL.soleil}
        strength={0.3}
        size={9}
      />
      <Effects ambiance="hall" complet={profile.fullEffects} />
    </>
  )
}
