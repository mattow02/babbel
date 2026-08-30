import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { useLibraryStore } from '../../store/useLibraryStore.ts'
import { AXIS, rebase, slide, type Point2 } from './geometry.ts'
import { clampPitch, steerRates } from './steering.ts'

/**
 * Le visiteur : ou il est, ou il regarde, comment il avance.
 *
 * Schema de commande (decisions D13 et D28) :
 *   - la souris oriente le regard, par les bords de l'ecran (voir steering.ts) ;
 *   - le clic MAINTENU fait avancer vers ou l'on regarde ;
 *   - un clic BREF sur un volume declenche un travelling puis l'ouvre ;
 *   - au doigt : appui = avancer, glisse = regarder ;
 *   - ZQSD et les fleches marchent aussi, sans etre annonces.
 *
 * Rien n'est alloue dans la boucle : tous les vecteurs de travail sont crees
 * une fois. C'est la discipline posee dans CLAUDE.md.
 */

/** Hauteur des yeux. */
export const EYE_HEIGHT = 1.55

/** Vitesse de marche, en metres par seconde. */
const WALK_SPEED = 2.1

/**
 * Distance gardee avec les murs et les etageres.
 *
 * Elle est plus serree qu'un rayon d'epaules parce que l'anneau de marche du
 * zaguan est etroit : trop de garde, et l'on ne pourrait plus faire le tour de
 * la tremie.
 */
const CLEARANCE = 0.32

/** Au-dela, un appui n'est plus un clic mais une marche. */
const CLICK_MS = 220

/** Duree d'un travelling vers un volume. */
const TRAVEL_MS = 900

export interface Traveling {
  readonly from: Vector3
  readonly to: Vector3
  readonly lookAt: Vector3
  readonly startedAt: number
  readonly onArrival: () => void
}

export interface PlayerHandle {
  /** Lance un travelling cadre vers un point, puis execute `onArrival`. */
  travelTo: (destination: Vector3, lookAt: Vector3, onArrival: () => void) => void
  /** Vrai pendant un travelling : la scene ne doit alors rien declencher. */
  isTravelling: () => boolean
  /**
   * Declare ce qu'il faut faire quand le visiteur DESIGNE quelque chose :
   * un appui bref, ou la touche « E ».
   *
   * On enregistre le geste au lieu de le passer en argument, pour que la scene
   * puisse s'appuyer sur le gestionnaire lui-meme sans le lire avant qu'il
   * n'existe. Rend une fonction de desinscription.
   */
  setInteract: (handler: () => void) => () => void
  /**
   * Repose le visiteur a un endroit donne, relatif a la galerie courante, et
   * oriente son regard. Sans le cap, on atterrit dos a ce qu'on vient
   * d'emprunter, et l'on ne comprend plus ou l'on est.
   */
  placeAt: (position: Point2, yaw?: number) => void
}

/** Adoucit le depart et l'arrivee d'un travelling. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export function usePlayer(): PlayerHandle {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const shiftHexagon = useLibraryStore((state) => state.shiftHexagon)

  const position = useRef<Point2>({ x: 0, z: 0 })
  /*
   * Cap initial : face au couloir.
   *
   * La direction du regard est (-sin(lacet), -cos(lacet)) dans le plan (x, z).
   * Pour regarder le long de l'axe des galeries, il faut donc ce lacet-la —
   * et surtout pas une valeur choisie a vue, sous peine de demarrer nez au mur
   * et de ne pas pouvoir avancer d'un pas.
   */
  const yaw = useRef(Math.atan2(-AXIS.x, -AXIS.z))
  const pitch = useRef(0)
  /*
   * `null` tant que le visiteur n'a pas bouge la souris.
   *
   * Sans cela, le curseur vaudrait (0, 0) — le coin haut-gauche, c'est-a-dire
   * un braquage maximal — et la vue se mettrait a tourner toute seule avant
   * meme qu'on ait touche a quoi que ce soit.
   */
  const cursor = useRef<{ x: number; y: number } | null>(null)
  const pressedAt = useRef<number | null>(null)
  const walking = useRef(false)
  const keys = useRef(new Set<string>())
  const travel = useRef<Traveling | null>(null)
  // Les ecouteurs sont poses une seule fois ; ils appellent toujours la
  // derniere version du gestionnaire, via cette reference.
  const interact = useRef<() => void>(() => {})

  // Vecteurs de travail, alloues une seule fois.
  const forward = useRef(new Vector3())
  const scratch = useRef(new Vector3())

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      cursor.current = { x: event.clientX, y: event.clientY }
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return
      pressedAt.current = performance.now()
      walking.current = true
    }
    const onPointerUp = (): void => {
      const bref = isClickWindow(pressedAt.current)
      pressedAt.current = null
      walking.current = false
      // Un appui bref est une designation, pas une marche.
      if (bref) interact.current()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      const touche = event.key.toLowerCase()
      // « E » designe ce qui se trouve sous le reticule. Le meme geste que le
      // clic bref, pour ceux qui preferent le clavier — et le seul chemin qui
      // ne depende d'aucun systeme d'evenements de rendu.
      if (touche === 'e') {
        interact.current()
        return
      }
      keys.current.add(touche)
    }
    const onKeyUp = (event: KeyboardEvent): void => {
      keys.current.delete(event.key.toLowerCase())
    }
    const onBlur = (): void => {
      cursor.current = null
      keys.current.clear()
      walking.current = false
      pressedAt.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05) // on encaisse un a-coup sans teleporter

    // --- Travelling : il prend la main sur tout le reste -------------------
    const trip = travel.current
    if (trip) {
      const t = Math.min(1, (performance.now() - trip.startedAt) / TRAVEL_MS)
      const eased = easeInOut(t)
      camera.position.lerpVectors(trip.from, trip.to, eased)
      camera.lookAt(trip.lookAt)
      if (t >= 1) {
        travel.current = null
        position.current = { x: camera.position.x, z: camera.position.z }
        trip.onArrival()
      }
      return
    }

    // --- Regard ------------------------------------------------------------
    const rates = cursor.current ? steerRates(cursor.current, size) : { yaw: 0, pitch: 0 }
    yaw.current += rates.yaw * step
    pitch.current = clampPitch(pitch.current + rates.pitch * step)

    // --- Avancee -----------------------------------------------------------
    const held = keys.current
    const keyForward = held.has('z') || held.has('w') || held.has('arrowup')
    const keyBack = held.has('s') || held.has('arrowdown')
    const keyLeft = held.has('q') || held.has('a') || held.has('arrowleft')
    const keyRight = held.has('d') || held.has('arrowright')

    let advance = 0
    let strafe = 0
    if (walking.current && !isClickWindow(pressedAt.current)) advance += 1
    if (keyForward) advance += 1
    if (keyBack) advance -= 1
    if (keyLeft) strafe -= 1
    if (keyRight) strafe += 1

    if (advance !== 0 || strafe !== 0) {
      const sin = Math.sin(yaw.current)
      const cos = Math.cos(yaw.current)
      const dx = (-sin * advance + cos * strafe) * WALK_SPEED * step
      const dz = (-cos * advance - sin * strafe) * WALK_SPEED * step
      const cible: Point2 = { x: position.current.x + dx, z: position.current.z + dz }
      position.current = slide(position.current, cible, CLEARANCE)

      // Origine flottante : si l'on a change de galerie, on remet le compteur
      // a zero et on incremente le numero d'hexagone.
      const recentre = rebase(position.current)
      if (recentre.shift !== 0) {
        position.current = recentre.position
        shiftHexagon(recentre.shift)
      }
    }

    camera.position.set(position.current.x, EYE_HEIGHT, position.current.z)
    forward.current.set(
      -Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      -Math.cos(yaw.current) * Math.cos(pitch.current),
    )
    scratch.current.copy(camera.position).add(forward.current)
    camera.lookAt(scratch.current)
  })

  return {
    travelTo: (destination, lookAt, onArrival) => {
      travel.current = {
        from: camera.position.clone(),
        to: destination,
        lookAt,
        startedAt: performance.now(),
        onArrival,
      }
    },
    isTravelling: () => travel.current !== null,
    placeAt: (next, cap) => {
      position.current = next
      if (cap !== undefined) {
        yaw.current = cap
        pitch.current = 0
      }
    },
    setInteract: (handler) => {
      interact.current = handler
      return () => {
        if (interact.current === handler) interact.current = () => {}
      }
    },
  }
}

/** Un appui plus court que CLICK_MS est un clic, pas une marche. */
function isClickWindow(pressedAt: number | null): boolean {
  return pressedAt !== null && performance.now() - pressedAt < CLICK_MS
}
