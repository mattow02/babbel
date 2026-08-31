import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { DoubleSide, Group, Vector3, type Mesh, type Texture } from 'three'
import {
  COVER_OVERHANG,
  COVER_THICKNESS,
  FLIGHT_SECONDS,
  HELD_POSITION,
  LEAVES_THICKNESS,
  OPENING_SECONDS,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  TURN_SECONDS,
} from './dimensions.ts'
import { TURN_SWAP_AT, breathe, coverAngle, easeInOut, easeOutBack, turnAngle } from './animation.ts'
import { createPageTexture, paintPage } from './pageTexture.ts'

/**
 * Le livre qu'on vient de prendre.
 *
 * Il quitte l'etagere, vient flotter devant le lecteur, s'ouvre, et se laisse
 * tourner. Rien de tout cela n'est une interface posee par-dessus la scene :
 * c'est un objet du monde, eclaire par la lampe de la galerie comme le reste.
 *
 * ------------------------------------------------------------------------
 * IL EST ACCROCHE A LA CAMERA
 *
 * Le livre est ajoute comme enfant de la camera, et non pose dans le monde.
 * Il suit donc le regard sans qu'on ait a recalculer sa place a chaque image,
 * et il reste tenu meme si l'on tourne la tete. Le vol part de la position de
 * l'etagere, convertie une fois dans le repere de la camera.
 */
export function Book({
  from,
  pages,
  onTurn,
}: {
  /** Position du volume sur son etagere, dans le monde. */
  from: Vector3
  /** Textes des deux pages visibles. `null` tant qu'ils se calculent. */
  pages: { left: string | null; right: string | null }
  /** Tourner : +1 vers la suite, -1 vers le debut. */
  onTurn: (direction: 1 | -1) => void
}): React.ReactElement {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)

  const groupe = useRef<Group>(null)
  const charniereGauche = useRef<Group>(null)
  const charniereDroite = useRef<Group>(null)
  const pageTournante = useRef<Group>(null)
  const planTournant = useRef<Mesh>(null)

  /*
   * Trois toiles : la page de gauche, celle de droite, et celle qui tourne.
   *
   * Elles vivent dans une reference, pas dans un `useMemo` : on les MUTE a
   * chaque tournage — on repeint la toile et l'on signale la texture — et une
   * reference est justement ce qui est fait pour porter un objet mutable a
   * travers les rendus.
   */
  const toiles = useRef<ReturnType<typeof creerToiles> | null>(null)
  toiles.current ??= creerToiles()
  const peindreDeux = (
    gauche: string | null,
    droite: string | null,
  ): void => {
    const t = toiles.current
    if (!t) return
    paintPage(t.gauche.canvas, gauche, 'gauche')
    paintPage(t.droite.canvas, droite, 'droite')
    t.gauche.texture.needsUpdate = true
    t.droite.texture.needsUpdate = true
  }

  const depart = useRef<Vector3 | null>(null)
  const debut = useRef(0)
  const phase = useRef<'vol' | 'ouverture' | 'lecture'>('vol')
  const tourne = useRef<{ debut: number; arriere: boolean; echange: boolean } | null>(null)

  // Les pages demandees, lues depuis la boucle de rendu.
  const demandees = useRef(pages)
  useEffect(() => {
    demandees.current = pages
    // Hors d'un tournage, on peint tout de suite : c'est le premier affichage,
    // ou une page qui vient d'arriver du worker.
    if (!tourne.current) peindreDeux(pages.left, pages.right)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages])

  /*
   * On accroche le livre a la camera, et on le detache en partant.
   *
   * Attention au piege, qui coute une soiree a qui l'ignore : three ne dessine
   * que ce qui pend de la SCENE. Or la camera, elle, n'y est pas — trois.js ne
   * l'y met jamais, et un objet accroche a une camera hors scene n'est donc
   * jamais rendu, sans la moindre erreur pour le dire. On rattache donc la
   * camera a la scene le temps de la lecture. Elle n'a aucune apparence : cela
   * ne change rien a l'image, seulement au parcours du graphe.
   */
  useEffect(() => {
    const objet = groupe.current
    if (!objet) return
    const cameraOrpheline = camera.parent === null
    if (cameraOrpheline) scene.add(camera)
    camera.add(objet)
    return () => {
      camera.remove(objet)
      if (cameraOrpheline) scene.remove(camera)
    }
  }, [camera, scene])

  useEffect(() => {
    const t = toiles.current
    return () => {
      if (!t) return
      for (const page of [t.gauche, t.droite, t.tournante]) page.texture.dispose()
    }
  }, [])

  useFrame((state) => {
    const objet = groupe.current
    if (!objet) return
    const maintenant = state.clock.elapsedTime

    if (depart.current === null) {
      // Ou se trouvait le volume, vu depuis la camera.
      depart.current = camera.worldToLocal(from.clone())
      debut.current = maintenant
    }

    const cible = new Vector3(...HELD_POSITION)

    if (phase.current === 'vol') {
      const t = (maintenant - debut.current) / FLIGHT_SECONDS
      const avance = easeOutBack(t)
      objet.position.lerpVectors(depart.current, cible, Math.min(1, avance))
      // Il se redresse en chemin : de son inclinaison sur l'etagere a la
      // position tenue en main.
      const reste = 1 - easeInOut(t)
      objet.rotation.set(reste * 0.5, reste * 1.15, reste * -0.35)
      const echelle = 0.55 + 0.45 * easeInOut(t)
      objet.scale.setScalar(echelle)
      if (t >= 1) {
        phase.current = 'ouverture'
        debut.current = maintenant
      }
    } else {
      const souffle = breathe(maintenant)
      objet.position.set(cible.x + souffle.x, cible.y + souffle.y, cible.z)
      objet.rotation.set(0, 0, souffle.roll)
      objet.scale.setScalar(1)
    }

    if (phase.current === 'ouverture') {
      const t = (maintenant - debut.current) / OPENING_SECONDS
      const angle = coverAngle(t)
      if (charniereGauche.current) charniereGauche.current.rotation.y = angle
      if (t >= 1) phase.current = 'lecture'
    }

    // Le tournage d'une page.
    const enCours = tourne.current
    if (enCours && Number.isNaN(enCours.debut)) enCours.debut = maintenant
    if (enCours && pageTournante.current) {
      const t = (maintenant - enCours.debut) / TURN_SECONDS
      pageTournante.current.rotation.y = turnAngle(t, enCours.arriere)
      pageTournante.current.visible = true

      if (!enCours.echange && t >= TURN_SWAP_AT) {
        // La page dressee masque ce qu'il y a dessous : c'est l'instant.
        enCours.echange = true
        peindreDeux(demandees.current.left, demandees.current.right)
      }
      if (t >= 1) {
        tourne.current = null
        pageTournante.current.visible = false
      }
    }
  })

  const demarrerTournage = (direction: 1 | -1): void => {
    if (phase.current !== 'lecture' || tourne.current) return
    // La page qui se leve porte ce qu'on est en train de quitter.
    const t = toiles.current
    if (!t) return
    paintPage(t.tournante.canvas, demandees.current.right, 'droite')
    t.tournante.texture.needsUpdate = true
    /*
     * L'instant de depart est laisse a NaN : l'horloge de la scene n'est
     * lisible que depuis la boucle de rendu, et c'est elle qui le renseignera
     * a l'image suivante. Melanger deux horloges — celle du navigateur et
     * celle de la scene — donnerait un premier saut a chaque tournage.
     */
    tourne.current = { debut: Number.NaN, arriere: direction === -1, echange: false }
    onTurn(direction)
  }

  /*
   * TOURNER UNE PAGE : LE MEME GESTE MAISON QUE PARTOUT AILLEURS
   *
   * On n'utilise pas les evenements de survol du moteur de rendu. La raison
   * n'est pas theorique : le livre est accroche a la camera, il occupe la
   * moitie basse de l'ecran, et le seul geste possible pendant la lecture est
   * justement de tourner une page. Ecouter le relachement du pointeur sur la
   * toile et regarder de quel COTE il est tombe donne exactement le bon geste,
   * pour trois lignes, et sans dependre d'aucune plomberie.
   *
   * Cliquer a droite avance, cliquer a gauche revient : c'est ce que fait un
   * livre. Les clics sur l'interface — la croix — ne sont pas concernes : ils
   * n'ont pas lieu sur la toile.
   */
  useEffect(() => {
    const surRelachement = (event: PointerEvent): void => {
      if (event.button !== 0) return
      if (phase.current !== 'lecture' || tourne.current) return
      const cible = event.target as HTMLElement | null
      if (!cible || cible.tagName !== 'CANVAS') return
      demarrerTournage(event.clientX >= window.innerWidth / 2 ? 1 : -1)
    }
    window.addEventListener('pointerup', surRelachement)
    return () => {
      window.removeEventListener('pointerup', surRelachement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const demiPage = PAGE_WIDTH / 2

  return (
    <group ref={groupe}>
      {/* Le dos. */}
      <mesh position={[0, 0, -LEAVES_THICKNESS / 2]}>
        <boxGeometry args={[COVER_THICKNESS * 2, PAGE_HEIGHT + COVER_OVERHANG * 2, LEAVES_THICKNESS * 2]} />
        <meshStandardMaterial color="#3a2418" roughness={0.72} />
      </mesh>

      {/* La moitie gauche, articulee sur le dos. */}
      <group ref={charniereGauche}>
        <Moitie cote={-1} texture={toiles.current.gauche.texture} />
      </group>

      {/* La moitie droite, immobile. */}
      <group ref={charniereDroite}>
        <Moitie cote={1} texture={toiles.current.droite.texture} />
      </group>

      {/* La page qui se tourne, invisible au repos. */}
      <group ref={pageTournante} visible={false}>
        <mesh ref={planTournant} position={[demiPage, 0, LEAVES_THICKNESS + 0.0012]}>
          <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
          <meshStandardMaterial map={toiles.current.tournante.texture} side={DoubleSide} roughness={0.94} />
        </mesh>
      </group>
    </group>
  )
}

/** Les trois toiles du livre, creees une seule fois. */
function creerToiles(): {
  gauche: ReturnType<typeof createPageTexture>
  droite: ReturnType<typeof createPageTexture>
  tournante: ReturnType<typeof createPageTexture>
} {
  return {
    gauche: createPageTexture(),
    droite: createPageTexture(),
    tournante: createPageTexture(),
  }
}

/**
 * Une moitie de livre : sa couverture, son bloc de pages, et la page visible.
 *
 * `cote` vaut -1 a gauche et +1 a droite. Tout est pose a partir du dos, en
 * x = 0, pour que la charniere tourne au bon endroit.
 */
function Moitie({ cote, texture }: { cote: -1 | 1; texture: Texture }): React.ReactElement {
  const centre = (cote * PAGE_WIDTH) / 2
  return (
    <group>
      {/* La couverture, en cuir sombre. */}
      <mesh position={[centre, 0, -LEAVES_THICKNESS - COVER_THICKNESS / 2]} castShadow>
        <boxGeometry
          args={[
            PAGE_WIDTH + COVER_OVERHANG,
            PAGE_HEIGHT + COVER_OVERHANG * 2,
            COVER_THICKNESS,
          ]}
        />
        <meshStandardMaterial color="#40281a" roughness={0.68} metalness={0.05} />
      </mesh>

      {/* Le bloc des pages, vu par la tranche. */}
      <mesh position={[centre, 0, -LEAVES_THICKNESS / 2]}>
        <boxGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, LEAVES_THICKNESS]} />
        <meshStandardMaterial color="#d8caa8" roughness={0.95} />
      </mesh>

      {/* La page qu'on lit. */}
      <mesh position={[centre, 0, LEAVES_THICKNESS / 2 + 0.0008]}>
        <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.96} />
      </mesh>
    </group>
  )
}
