/**
 * Les etages de la bibliotheque.
 *
 * ------------------------------------------------------------------------
 * UN SEUL ENTIER, DEUX DIMENSIONS
 *
 * Le numero de galerie est deja l'unique coordonnee du monde : avancer d'une
 * galerie, c'est l'incrementer (voir geometry.ts). Pour donner de la hauteur a
 * la bibliotheque, on n'ajoute donc PAS une seconde coordonnee : on lit le meme
 * entier dans deux dimensions.
 *
 *     galerie = etage x FOULEE + colonne
 *
 * Monter d'un etage, c'est ajouter une foulee. Avancer dans un couloir, c'est
 * ajouter un. Il n'y a toujours qu'un seul nombre, et l'adresse d'un livre
 * reste exactement ce qu'elle etait — rien de ce qui precede ne change.
 *
 * ------------------------------------------------------------------------
 * POURQUOI CETTE FOULEE-LA
 *
 * 25^800 : le nombre de textes distincts de huit cents caracteres. Un etage
 * est donc long d'autant de galeries qu'il y a de facons de remplir huit cents
 * signes — soit environ 10^1118, un nombre qu'aucun visiteur n'epuisera. Le
 * choix reste arbitraire, mais il est tire de l'alphabet plutot que du vide.
 */

import { HEXAGON_COUNT, RADIX_BIG } from '../../core/index.ts'

/** Distance, en galeries, entre une salle et celle qui la surplombe. */
export const FLOOR_STRIDE: bigint = RADIX_BIG ** 800n

/** Nombre d'etages que la bibliotheque peut empiler. */
export const FLOOR_COUNT: bigint = HEXAGON_COUNT / FLOOR_STRIDE + 1n

/** Etage d'une galerie. Le rez-de-chaussee porte le numero 0. */
export function floorOf(hexagon: bigint): bigint {
  return hexagon / FLOOR_STRIDE
}

/** Position de la galerie le long de son etage. */
export function columnOf(hexagon: bigint): bigint {
  return hexagon % FLOOR_STRIDE
}

/** La galerie situee juste au-dessus, ou `null` s'il n'y a plus d'etage. */
export function above(hexagon: bigint): bigint | null {
  const next = hexagon + FLOOR_STRIDE
  return next < HEXAGON_COUNT ? next : null
}

/** La galerie situee juste en dessous, ou `null` si l'on est au rez-de-chaussee. */
export function below(hexagon: bigint): bigint | null {
  return hexagon >= FLOOR_STRIDE ? hexagon - FLOOR_STRIDE : null
}
