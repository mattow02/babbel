/**
 * Un desordre deterministe, sans motif visible.
 *
 * ------------------------------------------------------------------------
 * POURQUOI PAS UNE SIMPLE MULTIPLICATION
 *
 * On est tente d'ecrire `(index * grandNombrePremier) >>> 0` et de s'en
 * servir. C'est une erreur, et elle se voit a l'oeil : une multiplication est
 * une fonction AFFINE de l'indice, donc l'ecart entre deux indices consecutifs
 * est constant. Les valeurs sont bien reparties prises isolement, mais elles
 * defilent avec une periode courte — et une rangee de cypres ou de tranches de
 * livres se met a montrer un motif qui se repete.
 *
 * C'est exactement le probleme que le LCG nu posait dans core/bijection.ts, et
 * la reponse est la meme : ajouter une couche de decalages et de XOR, qui
 * casse la structure lineaire.
 *
 * Le melangeur ci-dessous est le finalisateur « lowbias32 », choisi pour son
 * tres faible biais et son cout de trois multiplications.
 */

/** Melange un entier en un autre, sur 32 bits, sans structure lineaire. */
export function hash32(value: number): number {
  let x = value >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

/** Un nombre dans [0, 1), deterministe. */
export function unitOf(value: number): number {
  return hash32(value) / 4294967296
}

/** Un nombre dans [-0.5, 0.5), pour dereglier legerement un alignement. */
export function jitterOf(value: number): number {
  return unitOf(value) - 0.5
}
