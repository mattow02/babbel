/**
 * Ou se placer pour ouvrir un volume.
 *
 * Quand le visiteur designe un livre, on ne bascule pas brutalement dans la
 * lecture : on s'approche d'abord. Ce module calcule le point d'arrivee et le
 * point vise du travelling : en mathematiques pures, donc testable sans GPU.
 *
 * L'extraire du composant n'est pas cosmetique : c'est la seule facon de
 * verifier que l'on se place bien DEVANT le livre, du bon cote, et non dans le
 * mur derriere lui.
 */

import { BOOKS_PER_HEXAGON, type Address } from '../../core/index.ts'
import { galleryOrigins } from '../galleries.ts'
import { allBookPlacements } from './layout3d.ts'
import { addressFromInstance } from './picking.ts'

/** Distance a laquelle on s'arrete devant l'etagere. */
export const APPROACH_DISTANCE = 0.9

export interface Approach {
  /** L'adresse du volume designe. */
  readonly address: Address
  /** Ou la camera doit arriver. */
  readonly destination: { x: number; y: number; z: number }
  /** Ce qu'elle doit regarder : le volume lui-meme. */
  readonly lookAt: { x: number; y: number; z: number }
}

/**
 * @param instanceId instance touchee par le rayon
 * @param depth      profondeur de galeries affichees
 * @param hexagon    galerie ou se trouve le visiteur
 * @param eyeHeight  hauteur des yeux
 */
export function approachFor(
  instanceId: number,
  depth: number,
  hexagon: bigint,
  eyeHeight: number,
): Approach | null {
  const address = addressFromInstance(instanceId, depth, hexagon)
  if (!address) return null

  const slot = Math.floor(instanceId / BOOKS_PER_HEXAGON)
  const origin = galleryOrigins(depth)[slot]
  if (!origin) return null
  const placement = allBookPlacements(origin)[instanceId % BOOKS_PER_HEXAGON]
  if (!placement) return null

  // On recule du livre VERS le centre de sa galerie : c'est le seul cote ou
  // il y a de la place, puisque le mur est juste derriere lui.
  const dx = origin.x - placement.x
  const dz = origin.z - placement.z
  const length = Math.hypot(dx, dz)
  if (length === 0) return null

  return {
    address,
    destination: {
      x: placement.x + (dx / length) * APPROACH_DISTANCE,
      y: eyeHeight,
      z: placement.z + (dz / length) * APPROACH_DISTANCE,
    },
    lookAt: { x: placement.x, y: placement.y, z: placement.z },
  }
}
