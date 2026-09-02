/**
 * D'une instance de volume a une adresse dans la bibliotheque.
 *
 * Les volumes sont instancies dans un ordre parfaitement determine : galerie
 * par galerie, puis dans l'ordre des adresses (mur, etagere, volume). Retrouver
 * l'adresse d'un livre designe a la souris n'est donc qu'une division
 * euclidienne, pas besoin de stocker quoi que ce soit par instance.
 *
 * C'est le point ou la scene 3D et le coeur mathematique se rejoignent :
 * cliquer un livre sur une etagere donne une adresse, et cette adresse donne
 * un texte.
 */

import {
  BOOKS_PER_HEXAGON,
  SHELVES_PER_WALL,
  VOLUMES_PER_SHELF,
  WALLS_PER_HEXAGON,
  type Address,
} from '../../core/index.ts'

/**
 * @param instanceId indice de l'instance touchee
 * @param depth      profondeur de galeries affichees de part et d'autre
 * @param hexagon    numero de la galerie ou se trouve le visiteur
 * @returns l'adresse du volume, page 1, ou `null` si l'indice est aberrant
 *          ou si la galerie visee tombe hors de la bibliotheque.
 */
export function addressFromInstance(
  instanceId: number,
  depth: number,
  hexagon: bigint,
): Address | null {
  const galleries = depth * 2 + 1
  if (!Number.isInteger(instanceId) || instanceId < 0) return null
  if (instanceId >= galleries * BOOKS_PER_HEXAGON) return null

  const slot = Math.floor(instanceId / BOOKS_PER_HEXAGON)
  const withinGallery = instanceId % BOOKS_PER_HEXAGON

  const target = hexagon + BigInt(slot - depth)
  if (target < 0n) return null

  const volume = withinGallery % VOLUMES_PER_SHELF
  const afterVolume = Math.floor(withinGallery / VOLUMES_PER_SHELF)
  const shelf = afterVolume % SHELVES_PER_WALL
  const wall = Math.floor(afterVolume / SHELVES_PER_WALL)
  if (wall >= WALLS_PER_HEXAGON) return null

  return { hexagon: target, wall, shelf, volume, page: 1 }
}
