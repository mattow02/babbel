/**
 * OU se trouve chaque objet d'une galerie. Mathematiques pures.
 *
 * Aucune dependance a three.js : ce module rend des nombres, pas des objets de
 * rendu. On peut donc verifier le placement des 640 livres sans GPU, sans
 * navigateur, et sans rien afficher — ce qui est exactement le genre de bug
 * qu'on ne voit pas a l'oeil (un livre a l'envers parmi 640, un mur decale
 * d'un demi-degre).
 *
 * ------------------------------------------------------------------------
 * LA GEOMETRIE
 *
 * L'hexagone est regulier, de rayon circonscrit R. Ses six murs portent le
 * numero 0 a 5 ; le mur k a pour normale sortante l'angle 60k + 30 degres, et
 * son milieu se trouve a l'apotheme a = R cos(30 deg).
 *
 * Borges : « les etageres couvrent tous les cotes sauf deux ». Nous prenons
 * les deux murs OPPOSES (0 et 3) comme couloirs. Ce choix n'est pas neutre :
 * des ouvertures opposees alignent les galeries et creusent une perspective
 * qui file au loin, ce qui donne le vertige recherche. Des ouvertures
 * adjacentes donneraient un labyrinthe, pas un abime.
 *
 * Repere : y est la verticale, le plan du sol est (x, z).
 */

import {
  BOOK_DEPTH,
  HEXAGON_APOTHEM,
  HEXAGON_RADIUS,
  SHELF_BASE_Y,
  SHELF_FILL,
  SHELF_SPACING,
  SHELF_THICKNESS,
  BOOK_HEIGHT,
} from '../dimensions.ts'
import {
  SHELVES_PER_WALL,
  VOLUMES_PER_SHELF,
  WALLS_PER_HEXAGON,
  BOOKS_PER_HEXAGON,
} from '../../core/index.ts'

/** Les six murs de l'hexagone, indices 0 a 5. */
export const SIDES = 6

/** Les deux murs laisses libres : ils sont opposes. */
export const CORRIDOR_SIDES: readonly number[] = [0, 3]

/** Les quatre murs qui portent les etageres, dans l'ordre des adresses. */
export const SHELF_SIDES: readonly number[] = Array.from({ length: SIDES }, (_, k) => k).filter(
  (k) => !CORRIDOR_SIDES.includes(k),
)

/** Angle de la normale sortante du mur k, en radians. */
export function sideAngle(side: number): number {
  return (Math.PI / 3) * side + Math.PI / 6
}

/** Un placement dans l'espace : position, rotation autour de la verticale. */
export interface Placement {
  readonly x: number
  readonly y: number
  readonly z: number
  /** Rotation autour de y, en radians. */
  readonly rotY: number
}

/**
 * Oriente un objet pour qu'il soit plaque contre le mur `side`, face a la piece.
 *
 * On veut que le +x local suive le mur et que le +z local pointe vers
 * l'interieur. Une rotation d'angle phi autour de y envoie le +x local sur
 * (cos phi, -sin phi) et le +z local sur (sin phi, cos phi), dans le plan
 * (x, z). En resolvant, phi = -(theta + pi/2).
 */
export function facingInward(side: number): number {
  return -(sideAngle(side) + Math.PI / 2)
}

/** Hauteur du CENTRE de la planche numero `shelf` (0 en bas). */
export function shelfY(shelf: number): number {
  return SHELF_BASE_Y + shelf * SHELF_SPACING
}

/** Hauteur du centre d'un volume : il repose sur la planche, il ne flotte pas. */
export function bookY(shelf: number): number {
  return shelfY(shelf) + SHELF_THICKNESS / 2 + BOOK_HEIGHT / 2
}

/** Largeur reellement occupee par les 32 volumes d'un rayon. */
export const SHELF_USABLE_WIDTH = HEXAGON_RADIUS * SHELF_FILL

/** Pas entre deux volumes voisins sur un rayon. */
export const VOLUME_PITCH = SHELF_USABLE_WIDTH / VOLUMES_PER_SHELF

/**
 * Placement d'un volume.
 *
 * @param wall   index dans SHELF_SIDES, de 0 a 3 — c'est le « mur » de l'adresse
 * @param shelf  etagere, de 0 a 4
 * @param volume volume, de 0 a 31
 * @param origin centre de la galerie dans le monde
 */
export function bookPlacement(
  wall: number,
  shelf: number,
  volume: number,
  origin: { x: number; z: number } = { x: 0, z: 0 },
): Placement {
  const side = SHELF_SIDES[wall]
  if (side === undefined) {
    throw new RangeError(`Mur hors bornes : ${wall}`)
  }
  const theta = sideAngle(side)
  const normalX = Math.cos(theta)
  const normalZ = Math.sin(theta)
  const tangentX = -normalZ
  const tangentZ = normalX

  // Les volumes sont centres sur le mur : on part de la gauche du rayon et on
  // avance d'un pas par volume, en visant le milieu de chaque emplacement.
  const along = (volume + 0.5) * VOLUME_PITCH - SHELF_USABLE_WIDTH / 2
  const inward = HEXAGON_APOTHEM - BOOK_DEPTH / 2

  return {
    x: origin.x + normalX * inward + tangentX * along,
    y: bookY(shelf),
    z: origin.z + normalZ * inward + tangentZ * along,
    rotY: facingInward(side),
  }
}

/** Placement d'une planche d'etagere (une par mur et par rayon). */
export function shelfPlacement(
  wall: number,
  shelf: number,
  origin: { x: number; z: number } = { x: 0, z: 0 },
): Placement {
  const side = SHELF_SIDES[wall]
  if (side === undefined) {
    throw new RangeError(`Mur hors bornes : ${wall}`)
  }
  const theta = sideAngle(side)
  const inward = HEXAGON_APOTHEM - BOOK_DEPTH / 2
  return {
    x: origin.x + Math.cos(theta) * inward,
    y: shelfY(shelf),
    z: origin.z + Math.sin(theta) * inward,
    rotY: facingInward(side),
  }
}

/** Placement d'un panneau de mur (porteur ou percé d'un couloir). */
export function wallPlacement(
  side: number,
  origin: { x: number; z: number } = { x: 0, z: 0 },
): Placement {
  const theta = sideAngle(side)
  return {
    x: origin.x + Math.cos(theta) * HEXAGON_APOTHEM,
    y: 0,
    z: origin.z + Math.sin(theta) * HEXAGON_APOTHEM,
    rotY: facingInward(side),
  }
}

/**
 * Tous les placements de volumes d'une galerie, dans l'ordre des adresses :
 * mur, puis etagere, puis volume. L'indice dans le tableau correspond donc
 * exactement a l'ordre de lecture d'une adresse.
 */
export function allBookPlacements(origin: { x: number; z: number } = { x: 0, z: 0 }): Placement[] {
  const placements: Placement[] = new Array<Placement>(BOOKS_PER_HEXAGON)
  let index = 0
  for (let wall = 0; wall < WALLS_PER_HEXAGON; wall += 1) {
    for (let shelf = 0; shelf < SHELVES_PER_WALL; shelf += 1) {
      for (let volume = 0; volume < VOLUMES_PER_SHELF; volume += 1) {
        placements[index] = bookPlacement(wall, shelf, volume, origin)
        index += 1
      }
    }
  }
  return placements
}

/** Indice dans `allBookPlacements` d'une adresse (mur, etagere, volume). */
export function bookIndex(wall: number, shelf: number, volume: number): number {
  return (wall * SHELVES_PER_WALL + shelf) * VOLUMES_PER_SHELF + volume
}
