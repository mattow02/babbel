/**
 * Transcrire un texte dans l'alphabet de Borges.
 *
 * Ses 25 symboles ne comptent que 22 lettres : ni j, ni k, ni w, ni x, et
 * aucun accent. Plutot que de refuser ce que le visiteur tape, on le
 * TRANSCRIT, comme le ferait un copiste latin :
 *
 *     « Kafka »        -> « cafca »
 *     « bibliothèque » -> « bibliotheque »
 *     « exquis »       -> « ecsquis »
 *
 * Ce n'est pas une commodite technique, c'est le sujet meme de la nouvelle :
 * la bibliotheque contient tout ce qui peut s'ecrire avec ces 25 signes, et
 * rien d'autre. Tout ce qu'on veut y chercher doit d'abord y entrer.
 *
 * Fonction pure, testable sans navigateur.
 */

import { RADIX, isSymbol } from '../core/index.ts'

/** Les substitutions de lettres absentes de l'alphabet. */
const SUBSTITUTIONS: ReadonlyMap<string, string> = new Map([
  ['j', 'i'],
  ['k', 'c'],
  ['w', 'v'],
  ['x', 'cs'],
])

export interface Transcription {
  /** Le texte transcrit, garanti compose uniquement des symboles de l'alphabet. */
  readonly text: string
  /** Les lettres remplacees, dans l'ordre de leur premiere apparition. */
  readonly substitutions: readonly { readonly from: string; readonly to: string }[]
  /** Vrai si des caracteres ont ete purement et simplement abandonnes. */
  readonly dropped: boolean
}

/**
 * @param input ce que le visiteur a tape
 * @param limit longueur maximale du resultat
 */
export function transcribe(input: string, limit = Number.POSITIVE_INFINITY): Transcription {
  // On decompose pour separer les lettres de leurs accents, puis on retire
  // les signes diacritiques : « è » devient « e ».
  const sansAccents = input.normalize('NFD').replace(/\p{Diacritic}/gu, '')

  const vues = new Map<string, string>()
  let dropped = false
  let text = ''

  for (const brut of sansAccents.toLowerCase()) {
    if (text.length >= limit) break

    if (isSymbol(brut)) {
      // On ne laisse jamais deux blancs de suite. Dans une page de Borges ils
      // seraient legitimes, mais dans une barre de recherche ils ne sont que
      // des fautes de frappe qui meneraient a une tout autre adresse.
      if (brut === ' ' && (text === '' || text.endsWith(' '))) continue
      text += brut
      continue
    }

    const remplacement = SUBSTITUTIONS.get(brut)
    if (remplacement !== undefined) {
      if (!vues.has(brut)) vues.set(brut, remplacement)
      text += remplacement
      continue
    }

    // Tout le reste — chiffres, ponctuation, symboles — devient un blanc,
    // sauf s'il en suit deja un : deux espaces de suite n'apportent rien.
    if (!text.endsWith(' ') && text.length > 0) text += ' '
    dropped = true
  }

  return {
    text: text.slice(0, Number.isFinite(limit) ? limit : undefined),
    substitutions: [...vues].map(([from, to]) => ({ from, to })),
    dropped,
  }
}

/** Vrai si tout le texte appartient deja a l'alphabet. */
export function isPure(input: string): boolean {
  for (const char of input) {
    if (!isSymbol(char)) return false
  }
  return true
}

/** Le nombre de symboles de l'alphabet. Reexporte pour l'interface. */
export { RADIX }
