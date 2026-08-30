import { Canvas } from '@react-three/fiber'
import { useCallback } from 'react'
import { ACESFilmicToneMapping, Vector3 } from 'three'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { approachFor } from './hexagon/approach.ts'
import { Library } from './Library.tsx'
import { PerfProbe } from './PerfProbe.tsx'
import { Threshold } from './threshold/Threshold.tsx'
import { PALETTE } from './materials/palette.ts'
import { EYE_HEIGHT, usePlayer } from './navigation/usePlayer.ts'

/** Profondeur de galeries visibles de part et d'autre. 1 => trois galeries. */
export const DEPTH = 1

/**
 * La scene : le visiteur, et ce qu'il peut designer.
 *
 * Elle vit DANS la toile, parce qu'elle a besoin de la camera et de la boucle
 * de rendu. Tout tient dans un seul composant : le gestionnaire de
 * deplacement et le gestionnaire de designation sont crees au meme endroit, il
 * n'y a donc rien a se passer entre eux.
 */
function Scene(): React.ReactElement {
  const player = usePlayer()
  const hexagon = useLibraryStore((state) => state.hexagon)
  const open = useLibraryStore((state) => state.open)

  const onSelectBook = useCallback(
    (instanceId: number) => {
      // Un appui long est une marche, pas une designation.
      if (!player.isClick()) return
      const approach = approachFor(instanceId, DEPTH, hexagon, EYE_HEIGHT)
      if (!approach) return

      /*
       * On se place DEVANT le volume avant de l'ouvrir : la lecture ne surgit
       * pas, on s'en approche. C'est le travelling cadre promis par D13, et
       * c'est ce qui relie la marche a la lecture.
       */
      player.travelTo(
        new Vector3(approach.destination.x, approach.destination.y, approach.destination.z),
        new Vector3(approach.lookAt.x, approach.lookAt.y, approach.lookAt.z),
        () => {
          open(approach.address)
        },
      )
    },
    [player, hexagon, open],
  )

  return <Library depth={DEPTH} onSelectBook={onSelectBook} />
}

/**
 * La toile.
 *
 * Choix de rendu qui viennent de la direction artistique :
 *   - tone mapping ACES, indispensable pour tenir ces contrastes ;
 *   - brouillard exponentiel de la couleur du noir chaud, qui fait disparaitre
 *     les galeries lointaines au lieu de les couper net ;
 *   - `dpr` plafonne a 1,5 : au-dela on paye des pixels que personne ne voit.
 */
export function Gallery(): React.ReactElement {
  const stage = useLibraryStore((state) => state.stage)
  const enterLibrary = useLibraryStore((state) => state.enterLibrary)

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.86 }}
      /*
       * Une seule toile pour les deux mondes. `far` doit porter jusqu'aux
       * montagnes du Seuil ; le brouillard de la bibliotheque se charge de
       * cacher ce qui est loin quand on est dedans.
       */
      camera={{ position: [0, 6, 250], fov: 58, near: 0.08, far: 1600 }}
    >
      <PerfProbe />
      {stage === 'threshold' ? (
        <Threshold onFinish={enterLibrary} />
      ) : (
        <>
          <color attach="background" args={[PALETTE.nuit]} />
          <fogExp2 attach="fog" args={[PALETTE.nuit, 0.085]} />
          <Scene />
        </>
      )}
    </Canvas>
  )
}
