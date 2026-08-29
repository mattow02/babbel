/**
 * LE COEUR DU PROJET.
 *
 * Une permutation inversible de l'ensemble des pages possibles.
 *
 *     numero d'emplacement  <---->  numero de contenu
 *
 * Elle doit satisfaire trois exigences contradictoires :
 *
 *   1. DETERMINISME  la meme adresse rend toujours la meme page ;
 *   2. BIJECTION     deux adresses distinctes ne rendent jamais la meme page,
 *                    et toute page possible se trouve a exactement une adresse
 *                    (c'est ce qui autorisera la recherche inverse, D14) ;
 *   3. DESORDRE      des adresses voisines doivent rendre des pages sans
 *                    aucun rapport visible, sinon la bibliotheque n'a pas
 *                    l'air aleatoire.
 *
 * ------------------------------------------------------------------------
 * LA DIFFICULTE, ET L'ASTUCE
 *
 * Le domaine est N = 25^3200, le nombre de pages possibles. Ce n'est pas une
 * puissance de deux, alors que toutes les operations qui melangent bien les
 * bits (XOR, decalages, multiplication) vivent naturellement modulo 2^b.
 * Appliquees telles quelles, elles font sortir de [0, N).
 *
 * C'est exactement le probleme que Jonathan Basile contourne sur
 * libraryofbabel.info avec des masques ad hoc. Nous prenons une voie plus
 * propre et demontrable : le CYCLE WALKING (Black & Rogaway, 2002).
 *
 *   - on construit `mix`, une permutation de [0, 2^BITS) ou 2^BITS est la
 *     plus petite puissance de deux superieure a N ;
 *   - pour permuter [0, N), on applique `mix` en boucle jusqu'a retomber
 *     dans [0, N).
 *
 * C'est une permutation de [0, N) : la preuve tient en une phrase. `mix`
 * decoupe [0, 2^BITS) en cycles ; parcourir un cycle en sautant les valeurs
 * hors domaine induit une permutation du sous-ensemble, et la parcourir a
 * l'envers l'annule.
 *
 * Le cout : 2^BITS / N vaut ici 1,580, donc 1,58 tour en moyenne. On paye
 * 58 % de calcul en trop pour n'avoir aucun cas particulier et une inversion
 * exacte. C'est un excellent echange.
 *
 * ------------------------------------------------------------------------
 * PERFORMANCE
 *
 * BITS vaut 14 861 : les entiers manipules font environ 1,8 ko. Les BigInt
 * natifs de V8 traitent cette taille sans effort (multiplication de Karatsuba
 * sur ~230 limbes). Aucun besoin de GMP ni de WebAssembly (decision D4).
 *
 * Mesure : un aller-retour complet coute environ 0,6 ms. Voir les tests.
 */

import { RADIX_BIG } from './alphabet.ts'
import { CHARS_PER_PAGE } from './layout.ts'

/** Nombre de pages possibles : 25^3200. Le domaine de la bijection. */
export const PAGE_COUNT: bigint = RADIX_BIG ** BigInt(CHARS_PER_PAGE)

/** Plus petit b tel que 2^b > PAGE_COUNT. Vaut 14 861. */
export const BITS: number = PAGE_COUNT.toString(2).length

const MASK = (1n << BigInt(BITS)) - 1n

// ---------------------------------------------------------------------------
// Constantes de melange
//
// Elles doivent etre DENSES : un multiplicateur de 64 bits ne diffuserait un
// bit que sur une fenetre de 64 bits, ce qui est derisoire face a 14 861. On
// les fabrique donc a la taille du domaine, de facon deterministe et
// reproductible, a partir de splitmix64.
// ---------------------------------------------------------------------------

const U64 = (1n << 64n) - 1n

/** Un tour de splitmix64. Sert uniquement a fabriquer les constantes. */
function splitmix64(state: bigint): { value: bigint; next: bigint } {
  let z = (state + 0x9e3779b97f4a7c15n) & U64
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & U64
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & U64
  return { value: z ^ (z >> 31n), next: (state + 0x9e3779b97f4a7c15n) & U64 }
}

/** Fabrique une constante dense de BITS bits a partir d'une graine. */
function denseConstant(seed: bigint): bigint {
  let state = seed
  let result = 0n
  for (let produced = 0; produced < BITS; produced += 64) {
    const step = splitmix64(state)
    state = step.next
    result = (result << 64n) | step.value
  }
  return result & MASK
}

/** Rend un entier impair : condition pour que la multiplication soit inversible mod 2^BITS. */
function makeOdd(value: bigint): bigint {
  return value | 1n
}

const ADDEND = denseConstant(0x1a2b3c4d5e6f7089n)

/**
 * Quatre multiplicateurs impairs, denses, deterministes.
 * Impair suffit a garantir l'inversibilite modulo 2^BITS.
 */
const MULTIPLIERS: readonly bigint[] = [
  makeOdd(denseConstant(0x0123456789abcdefn)),
  makeOdd(denseConstant(0xfedcba9876543210n)),
  makeOdd(denseConstant(0x243f6a8885a308d3n)),
  makeOdd(denseConstant(0x13198a2e03707344n)),
]

/**
 * Decalages du melange, exprimes en fraction du domaine.
 *
 * Un decalage a droite propage les bits de poids fort vers les poids faibles ;
 * la multiplication qui suit les repropage vers le haut. Alterner les deux est
 * le schema classique des « finalizers » (murmur, splitmix), transpose ici a
 * 14 861 bits. Des decalages de tailles differentes evitent que la structure
 * ne se repete.
 *
 * Chaque decalage coute, a l'inversion, ceil(log2(BITS / decalage)) tours :
 * on les garde donc larges.
 */
const SHIFTS: readonly number[] = [
  Math.max(1, BITS >> 1),
  Math.max(1, BITS >> 3),
  Math.max(1, BITS >> 5),
  Math.max(1, BITS >> 2),
]

/** Les inverses modulaires des multiplicateurs, calcules une seule fois. */
const MULTIPLIER_INVERSES: readonly bigint[] = MULTIPLIERS.map(inverseOfOdd)

// ---------------------------------------------------------------------------
// Briques inversibles
// ---------------------------------------------------------------------------

/**
 * Inverse modulaire d'un entier impair modulo 2^BITS, par elevation de Hensel.
 *
 * On part de inv = 1, exact modulo 2, et on double le nombre de bits corrects
 * a chaque tour via inv <- inv * (2 - a * inv). Quatorze tours suffisent pour
 * 14 861 bits. C'est bien plus court qu'un Euclide etendu, et exact.
 */
function inverseOfOdd(value: bigint): bigint {
  if ((value & 1n) === 0n) {
    throw new RangeError('Seul un entier impair est inversible modulo une puissance de deux.')
  }
  let inverse = 1n
  for (let correctBits = 1; correctBits < BITS; correctBits <<= 1) {
    inverse = (inverse * (2n - value * inverse)) & MASK
  }
  return inverse & MASK
}

/**
 * Annule x ^= x >> shift.
 *
 * Si y = x ^ (x >> s), alors y ^ (y >> s) = x ^ (x >> 2s), puis
 * en doublant le decalage a chaque tour le terme parasite finit par sortir
 * du domaine et disparaitre. On s'arrete des que le decalage atteint BITS.
 */
function undoXorShiftRight(value: bigint, shift: number): bigint {
  let result = value
  for (let current = shift; current < BITS; current <<= 1) {
    result ^= result >> BigInt(current)
  }
  return result
}

// ---------------------------------------------------------------------------
// La permutation de [0, 2^BITS)
// ---------------------------------------------------------------------------

/** Melange un tour. Permutation de [0, 2^BITS). */
function mix(value: bigint): bigint {
  let x = (value + ADDEND) & MASK
  for (let round = 0; round < MULTIPLIERS.length; round += 1) {
    x ^= x >> BigInt(SHIFTS[round] as number)
    x = (x * (MULTIPLIERS[round] as bigint)) & MASK
  }
  return x
}

/** Annule exactement `mix`, en reprenant les etapes a l'envers. */
function unmix(value: bigint): bigint {
  let x = value
  for (let round = MULTIPLIERS.length - 1; round >= 0; round -= 1) {
    x = (x * (MULTIPLIER_INVERSES[round] as bigint)) & MASK
    x = undoXorShiftRight(x, SHIFTS[round] as number)
  }
  return (x - ADDEND) & MASK
}

// ---------------------------------------------------------------------------
// La permutation de [0, PAGE_COUNT), par cycle walking
// ---------------------------------------------------------------------------

function assertInDomain(value: bigint, name: string): void {
  if (value < 0n || value >= PAGE_COUNT) {
    throw new RangeError(`${name} hors du domaine [0, 25^3200).`)
  }
}

/**
 * Emplacement -> contenu.
 *
 * On applique `mix` jusqu'a retomber dans le domaine. Environ 1,41 tour en
 * moyenne, et la boucle se termine toujours puisque `mix` permute un ensemble
 * fini dont [0, PAGE_COUNT) est une partie non vide.
 */
export function forward(location: bigint): bigint {
  assertInDomain(location, 'Emplacement')
  let x = location
  do {
    x = mix(x)
  } while (x >= PAGE_COUNT)
  return x
}

/** Contenu -> emplacement. L'exact reciproque de `forward`. */
export function inverse(content: bigint): bigint {
  assertInDomain(content, 'Contenu')
  let x = content
  do {
    x = unmix(x)
  } while (x >= PAGE_COUNT)
  return x
}
