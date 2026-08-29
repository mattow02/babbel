/**
 * Quelles pages precharger, et dans quel ordre.
 *
 * Un lecteur avance page par page. On prepare donc les pages voisines, en
 * commencant par les plus proches et en alternant avant/arriere : si le
 * prechargement est interrompu, ce qui a ete fait est ce qui sert le plus.
 *
 * On reste a l'interieur du meme volume. Franchir la couverture d'un livre
 * releve de la navigation dans la galerie, pas de la lecture.
 */

import { PAGES_PER_BOOK, type Address } from '../core/index.ts'

/** Rayon de prechargement par defaut, en pages de part et d'autre. */
export const DEFAULT_RADIUS = 2

/**
 * Les voisines de `address`, du plus proche au plus lointain, en alternant
 * page suivante puis page precedente. La page elle-meme n'en fait pas partie.
 */
export function readingNeighbourhood(address: Address, radius = DEFAULT_RADIUS): Address[] {
  const neighbours: Address[] = []
  for (let step = 1; step <= radius; step += 1) {
    for (const page of [address.page + step, address.page - step]) {
      if (page >= 1 && page <= PAGES_PER_BOOK) {
        neighbours.push({ ...address, page })
      }
    }
  }
  return neighbours
}
