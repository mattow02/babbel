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

import { DOME_BASE_Y, DOME_RADIUS, PORTAL_HEIGHT, PORTAL_Z } from './dimensions.ts'
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

/** Hauteur du regard, la meme que celle du visiteur qui prend la suite. */
const EYE_LEVEL = 1.55

/**
 * A quelle distance du seuil la camera s'arrete et rend la main.
 *
 * Mesuree depuis le plan du portail, porche NON compris : celui-ci avance de
 * neuf metres. De trop pres, le porche remplit l'image et l'on ne voit plus
 * l'entree : seulement un mur.
 */
export const ARRIVAL_STEP = 26

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
    position: { x: 0, y: 3.2, z: 112 },
    lookAt: { x: 0, y: DOME_BASE_Y + DOME_RADIUS * 0.3, z: 0 },
  },
  /*
   * 3. On monte les marches, et l'on s'arrete DEVANT L'ENTREE.
   *
   * C'est ici que le film s'interrompt et que le visiteur reprend la main. Il
   * ne franchit pas le portail malgre lui : il le voit, il est devant, il
   * entre s'il le veut. Le dernier plan cadre donc l'entree de face, a hauteur
   * d'homme, a quelques pas du seuil.
   */
  {
    duration: 6,
    position: { x: 0, y: STAIR_TOP_Y + EYE_LEVEL, z: PORTAL_Z + ARRIVAL_STEP },
    lookAt: { x: 0, y: STAIR_TOP_Y + PORTAL_HEIGHT * 0.45, z: PORTAL_Z },
  },
]

/** Duree totale de la sequence, en secondes. */
export const THRESHOLD_DURATION = SHOTS.reduce((total, shot) => total + shot.duration, 0)


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

/** Ou se tient le visiteur quand le film lui rend la main : devant l'entree. */
export const ARRIVAL: { position: Vec3; position2: { x: number; z: number }; yaw: number } = {
  position: { x: 0, y: STAIR_TOP_Y, z: PORTAL_Z + ARRIVAL_STEP },
  position2: { x: 0, z: PORTAL_Z + ARRIVAL_STEP },
  // Face au portail, c'est-a-dire vers les z decroissants.
  yaw: 0,
}
