import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef } from 'react'
import { ACESFilmicToneMapping, Raycaster, Vector2, Vector3, type InstancedMesh } from 'three'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { approachFor } from './hexagon/approach.ts'
import { CORRIDOR_SIDES, sideAngle } from './hexagon/layout3d.ts'
import { STAIRWELL_RADIUS } from './dimensions.ts'
import { stairwellCentre } from './hexagon/stairs.ts'
import { above, below } from './navigation/floors.ts'
import { Library } from './Library.tsx'
import { PerfProbe } from './PerfProbe.tsx'
import { Threshold } from './threshold/Threshold.tsx'
import { PALETTE } from './materials/palette.ts'
import { EYE_HEIGHT, usePlayer } from './navigation/usePlayer.ts'

/**
 * Profondeur de galeries visibles de part et d'autre.
 *
 * Fixee par le profil de qualite (scene/quality.ts) : trois galeries sur une
 * machine confortable, une seule sur un appareil modeste.
 */
export const DEPTH = 1

/**
 * Portee du geste, en metres.
 *
 * On ne prend pas un livre a l'autre bout du couloir : il faut s'en approcher.
 * Sans cette borne, le rayon traverserait les portes et l'on ouvrirait par
 * megarde un volume de la galerie voisine.
 */
const REACH = 3.2

/**
 * Le pied de l'escalier, dans le couloir de la galerie courante.
 *
 * C'est la que l'on repose le visiteur apres un changement d'etage : meme
 * couloir, meme colonne, un etage de plus. On se decale legerement du fut pour
 * ne pas atterrir dedans.
 */
function stairFoot(): { position: { x: number; z: number }; yaw: number } {
  const theta = sideAngle(CORRIDOR_SIDES[0] as number)
  const centre = stairwellCentre()

  /*
   * On se pose sur l'anneau de marche, du cote d'ou l'on vient, et FACE au
   * puits. Sans le cap, on atterrit dos a l'escalier qu'on vient d'emprunter
   * et l'on ne comprend plus ou l'on est.
   */
  const recul = STAIRWELL_RADIUS + 0.55
  const nx = Math.cos(theta)
  const nz = Math.sin(theta)
  const position = { x: centre.x - nx * recul, z: centre.z - nz * recul }
  return { position, yaw: Math.atan2(-nx, -nz) }
}

function Scene({ depth }: { depth: number }): React.ReactElement {
  const hexagon = useLibraryStore((state) => state.hexagon)
  const setHexagon = useLibraryStore((state) => state.setHexagon)
  const open = useLibraryStore((state) => state.open)
  const camera = useThree((state) => state.camera)

  const books = useRef<InstancedMesh>(null)
  const stairs = useRef<InstancedMesh>(null)
  // Un seul lanceur de rayon et un seul vecteur, crees une fois : on ne veut
  // rien allouer pendant une interaction.
  const raycaster = useRef(new Raycaster())
  const centre = useRef(new Vector2(0, 0))

  /**
   * Ce qui se trouve sous le reticule, et ce qu'on en fait.
   *
   * Le rayon est lance A LA MAIN, depuis le centre exact de l'ecran, plutot
   * que de passer par le systeme d'evenements du moteur de rendu. Trois
   * raisons :
   *
   *   - le reticule EST le viseur (decision D28) : ce qu'on designe doit etre
   *     ce qu'on regarde, pas ce que survole un curseur ;
   *   - la touche « E » et le clic bref deviennent le meme geste ;
   *   - cela ne depend plus d'aucune plomberie d'evenements, et devient donc
   *     verifiable depuis l'exterieur — ce qui manquait depuis la phase 5.
   */
  const player = usePlayer()

  const interagir = useCallback(() => {
    if (player.isTravelling()) return
    raycaster.current.setFromCamera(centre.current, camera)

    /*
     * L'escalier d'abord : il est dans le couloir, donc plus pres que les
     * etageres quand on lui fait face, et il ne faut pas qu'un volume de la
     * galerie voisine passe devant.
     */
    if (stairs.current) {
      const marche = raycaster.current.intersectObject(stairs.current, false)[0]
      if (marche && marche.distance <= REACH) {
        /*
         * Monter ou descendre se lit dans la DIRECTION du regard, pas dans le
         * point touche. Le fut de l'escalier monte bien au-dessus des yeux :
         * en se fiant au point d'impact, on montait meme en regardant ses
         * pieds. La direction, elle, dit l'intention.
         */
        const monte = raycaster.current.ray.direction.y >= 0
        const cible = monte ? above(hexagon) : below(hexagon)
        if (cible === null) return

        const arrivee = camera.position.clone()
        arrivee.y += monte ? 0.5 : -0.35
        const vise = marche.point.clone()
        vise.y += monte ? 2.4 : -2.4

        player.travelTo(arrivee, vise, () => {
          setHexagon(cible)
          // On repose le visiteur au pied de l'escalier de la nouvelle
          // galerie, FACE a lui : meme couloir, meme colonne, un etage de plus.
          const pied = stairFoot()
          player.placeAt(pied.position, pied.yaw)
        })
        return
      }
    }

    const mesh = books.current
    if (!mesh) return
    const touches = raycaster.current.intersectObject(mesh, false)
    const premier = touches[0]
    if (!premier || premier.instanceId === undefined) return
    if (premier.distance > REACH) return

    const approach = approachFor(premier.instanceId, depth, hexagon, EYE_HEIGHT)
    if (!approach) return

    /*
     * On se place DEVANT le volume avant de l'ouvrir : la lecture ne surgit
     * pas, on s'en approche. C'est le travelling cadre promis par D13.
     */
    player.travelTo(
      new Vector3(approach.destination.x, approach.destination.y, approach.destination.z),
      new Vector3(approach.lookAt.x, approach.lookAt.y, approach.lookAt.z),
      () => {
        open(approach.address)
      },
    )
  }, [camera, depth, hexagon, open, player, setHexagon])

  useEffect(() => player.setInteract(interagir), [player, interagir])

  return <Library depth={depth} booksRef={books} stairsRef={stairs} />
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
  const profile = useLibraryStore((state) => state.profile)

  return (
    <Canvas
      shadows={profile.shadows ? 'percentage' : false}
      dpr={profile.dpr}
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
          <Scene depth={profile.depth} />
        </>
      )}
    </Canvas>
  )
}
