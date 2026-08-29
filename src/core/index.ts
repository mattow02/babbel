/**
 * Le coeur de Babbel.
 *
 * TypeScript pur : aucune dependance a React, a three.js, ni au navigateur.
 * Si le rendu 3D est entierement reecrit, ce dossier ne bouge pas d'une ligne
 * (discipline posee dans CLAUDE.md, decision D8).
 */

export { ALPHABET, RADIX, isSymbol, symbolOf, valueOf } from './alphabet.ts'
export {
  HEXAGON_COUNT,
  addressOf,
  assertValidAddress,
  fromPath,
  locationOf,
  toPath,
  type Address,
} from './address.ts'
export { BITS, PAGE_COUNT, forward, inverse } from './bijection.ts'
export * from './layout.ts'
export { contentToText, locate, pageAt, textToContent, toLines } from './page.ts'
