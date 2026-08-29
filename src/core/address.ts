/**
 * Une adresse dans la bibliotheque, et sa traduction en numero d'emplacement.
 *
 * Borges donne une hierarchie stricte : une galerie hexagonale porte 4 murs de
 * livres, chaque mur 5 etageres, chaque etagere 32 volumes, chaque volume
 * 410 pages. C'est un simple systeme de numeration a bases melangees, ou le
 * chiffre de poids le plus fort est le numero de galerie.
 *
 *     emplacement = ((((hexagone * 4 + mur) * 5 + etagere) * 32 + volume) * 410)
 *                   + (page - 1)
 *
 * Cette ecriture est bijective par construction : c'est la definition meme de
 * la numeration positionnelle. Aucune astuce n'est necessaire ici, toute la
 * ruse est dans bijection.ts.
 *
 * DETAIL ASSUME : 25^3200 n'est pas divisible par 262 400, donc la toute
 * derniere galerie de la bibliotheque est incompletement remplie. Borges ne
 * s'en formalisera pas, et cela ne casse la bijection nulle part : chaque page
 * possede une adresse et une seule, chaque adresse valide une page et une seule.
 */

import { PAGE_COUNT } from './bijection.ts'
import {
  PAGES_PER_BOOK,
  PAGES_PER_HEXAGON,
  SHELVES_PER_WALL,
  VOLUMES_PER_SHELF,
  WALLS_PER_HEXAGON,
} from './layout.ts'

/** Une position exacte dans la bibliotheque. */
export interface Address {
  /** Numero de galerie. Enorme : c'est le chiffre de poids fort. */
  readonly hexagon: bigint
  /** Mur porteur, de 0 a 3. */
  readonly wall: number
  /** Etagere, de 0 a 4. */
  readonly shelf: number
  /** Volume sur l'etagere, de 0 a 31. */
  readonly volume: number
  /** Page, de 1 a 410. Numerotee a partir de 1, comme dans un vrai livre. */
  readonly page: number
}

/** Nombre de galeries. La derniere est partiellement remplie. */
export const HEXAGON_COUNT: bigint =
  (PAGE_COUNT + BigInt(PAGES_PER_HEXAGON) - 1n) / BigInt(PAGES_PER_HEXAGON)

const WALLS = BigInt(WALLS_PER_HEXAGON)
const SHELVES = BigInt(SHELVES_PER_WALL)
const VOLUMES = BigInt(VOLUMES_PER_SHELF)
const PAGES = BigInt(PAGES_PER_BOOK)

function assertRange(value: number, max: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= max) {
    throw new RangeError(`${name} doit etre un entier dans [0, ${max}), recu ${value}.`)
  }
}

/** Verifie qu'une adresse est valide. @throws sinon. */
export function assertValidAddress(address: Address): void {
  if (address.hexagon < 0n || address.hexagon >= HEXAGON_COUNT) {
    throw new RangeError('Numero de galerie hors de la bibliotheque.')
  }
  assertRange(address.wall, WALLS_PER_HEXAGON, 'Le mur')
  assertRange(address.shelf, SHELVES_PER_WALL, "L'etagere")
  assertRange(address.volume, VOLUMES_PER_SHELF, 'Le volume')
  assertRange(address.page - 1, PAGES_PER_BOOK, 'La page')
}

/** Adresse -> numero d'emplacement dans [0, PAGE_COUNT). */
export function locationOf(address: Address): bigint {
  assertValidAddress(address)
  const location =
    ((((address.hexagon * WALLS + BigInt(address.wall)) * SHELVES + BigInt(address.shelf)) *
      VOLUMES +
      BigInt(address.volume)) *
      PAGES) +
    BigInt(address.page - 1)
  if (location >= PAGE_COUNT) {
    // Peut arriver dans la derniere galerie, incompletement remplie.
    throw new RangeError('Cette adresse tombe au-dela de la derniere page de la bibliotheque.')
  }
  return location
}

/** Numero d'emplacement -> adresse. Reciproque exacte de `locationOf`. */
export function addressOf(location: bigint): Address {
  if (location < 0n || location >= PAGE_COUNT) {
    throw new RangeError('Emplacement hors du domaine [0, 25^3200).')
  }
  const page = Number(location % PAGES) + 1
  const afterPage = location / PAGES
  const volume = Number(afterPage % VOLUMES)
  const afterVolume = afterPage / VOLUMES
  const shelf = Number(afterVolume % SHELVES)
  const afterShelf = afterVolume / SHELVES
  const wall = Number(afterShelf % WALLS)
  const hexagon = afterShelf / WALLS
  return { hexagon, wall, shelf, volume, page }
}

// ---------------------------------------------------------------------------
// Serialisation en URL
//
// L'adresse EST l'information : un numero de galerie porte a lui seul presque
// tout le contenu de la page. Il n'y a donc aucun moyen de faire une URL
// courte, c'est une propriete du probleme, pas un defaut de conception. On se
// contente de la base 36 pour limiter les degats (environ 2 870 caracteres au
// lieu de 4 470 en decimal).
// ---------------------------------------------------------------------------

/** Adresse -> chemin d'URL, de la forme `galerie/mur/etagere/volume/page`. */
export function toPath(address: Address): string {
  assertValidAddress(address)
  return [
    address.hexagon.toString(36),
    address.wall,
    address.shelf,
    address.volume,
    address.page,
  ].join('/')
}

function parseBase36(text: string): bigint {
  if (!/^[0-9a-z]+$/.test(text)) {
    throw new SyntaxError(`Numero de galerie invalide : ${JSON.stringify(text)}`)
  }
  let value = 0n
  for (const char of text) {
    value = value * 36n + BigInt(parseInt(char, 36))
  }
  return value
}

function parseIndex(text: string, name: string): number {
  if (!/^\d+$/.test(text)) {
    throw new SyntaxError(`${name} invalide : ${JSON.stringify(text)}`)
  }
  return Number(text)
}

/** Chemin d'URL -> adresse. @throws si le chemin est mal forme ou hors bornes. */
export function fromPath(path: string): Address {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/')
  if (parts.length !== 5) {
    throw new SyntaxError('Un chemin doit compter cinq segments : galerie/mur/etagere/volume/page.')
  }
  const [rawHexagon, rawWall, rawShelf, rawVolume, rawPage] = parts as [
    string,
    string,
    string,
    string,
    string,
  ]
  const address: Address = {
    hexagon: parseBase36(rawHexagon),
    wall: parseIndex(rawWall, 'Le mur'),
    shelf: parseIndex(rawShelf, "L'etagere"),
    volume: parseIndex(rawVolume, 'Le volume'),
    page: parseIndex(rawPage, 'La page'),
  }
  assertValidAddress(address)
  return address
}
