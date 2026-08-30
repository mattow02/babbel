/**
 * La sequence d'arrivee, plan par plan.
 *
 * Ce n'est pas une camera libre : c'est un enchainement de PLANS COMPOSES.
 * La direction artistique le demande (symetrie frontale, point de fuite
 * central, contre-plongee basse), et c'est aussi ce qui garantit que la
 * premiere impression est la meme pour tout le monde.
 *
 * Chaque etape est un mouvement unique, adouci au depart et a l'arrivee. Le
 * leger temps d'arret entre deux etapes n'est pas un defaut : c'est ce qui
 * fait lire chaque plan comme un plan, et non comme un travelling continu.
 *
 * Fonction pure : la trajectoire se verifie sans rien afficher.
 */

import { CUBE_Y, DOME_BASE_Y, DOME_RADIUS, PORTAL_Z } from './dimensions.ts'
import { STAIR_TOP_Y } from './landscape.ts'

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface Shot {
  /** Duree du plan, en secondes. */
  readonly duration: number
  /** Ou se trouve la camera a la FIN du plan. */
  readonly position: Vec3
  /** Ce qu'elle regarde a la fin du plan. */
  readonly lookAt: Vec3
  /** Vrai quand ce plan se deroule DANS le grand hall. */
  readonly inside?: boolean
}

/**
 * Le point de depart : loin, bas, face au dome.
 *
 * On arrive de la plaine. Le dome occupe deja tout l'horizon.
 */
export const OPENING: Shot = {
  duration: 0,
  position: { x: 0, y: 6, z: 250 },
  lookAt: { x: 0, y: DOME_BASE_Y + DOME_RADIUS * 0.45, z: 0 },
}

export const SHOTS: readonly Shot[] = [
  // 1. On avance vers le monument, qui grandit.
  {
    duration: 6,
    position: { x: 14, y: 8, z: 150 },
    lookAt: { x: 0, y: DOME_BASE_Y + DOME_RADIUS * 0.4, z: 0 },
  },
  // 2. On arrive au pied de l'escalier, en contre-plongee.
  {
    duration: 5,
    position: { x: 0, y: 3.2, z: 96 },
    lookAt: { x: 0, y: DOME_BASE_Y + DOME_RADIUS * 0.3, z: 0 },
  },
  // 3. On monte les marches. Le regard descend vers l'entree.
  {
    duration: 5.5,
    position: { x: 0, y: STAIR_TOP_Y + 1.7, z: 66 },
    lookAt: { x: 0, y: DOME_BASE_Y + 5, z: PORTAL_Z },
  },
  // 4. On franchit l'entree unique. Tout s'assombrit.
  {
    duration: 3.5,
    position: { x: 0, y: DOME_BASE_Y + 1.7, z: PORTAL_Z - 2 },
    lookAt: { x: 0, y: DOME_BASE_Y + 5, z: 0 },
  },
  // 5. Dans le hall : le cube flotte au centre.
  {
    duration: 5,
    position: { x: 0, y: 5.5, z: 31 },
    lookAt: { x: 0, y: CUBE_Y - 1, z: 0 },
    inside: true,
  },
  // 6. On s'approche du cube, qui est la porte vers la bibliotheque.
  {
    duration: 4.5,
    position: { x: 0, y: 7, z: 17 },
    lookAt: { x: 0, y: CUBE_Y - 0.5, z: 0 },
    inside: true,
  },
]

/** Duree totale de la sequence, en secondes. */
export const THRESHOLD_DURATION = SHOTS.reduce((total, shot) => total + shot.duration, 0)

/** Instant ou l'on passe de l'exterieur a l'interieur du hall. */
export const INSIDE_AT = SHOTS.reduce(
  (accumulator, shot) =>
    accumulator.found ? accumulator : { time: accumulator.time + shot.duration, found: shot.inside === true },
  { time: 0, found: false },
).time

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }
}

/** Position et point vise a l'instant `time` (en secondes). */
export function cameraAt(time: number): { position: Vec3; lookAt: Vec3 } {
  let elapsed = 0
  let from = OPENING
  for (const shot of SHOTS) {
    if (time <= elapsed + shot.duration) {
      const t = ease(Math.max(0, (time - elapsed) / shot.duration))
      return { position: mix(from.position, shot.position, t), lookAt: mix(from.lookAt, shot.lookAt, t) }
    }
    elapsed += shot.duration
    from = shot
  }
  return { position: from.position, lookAt: from.lookAt }
}

/** Vrai si, a cet instant, la camera est deja dans le grand hall. */
export function isInside(time: number): boolean {
  return time >= INSIDE_AT
}
