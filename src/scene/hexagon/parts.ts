/**
 * De quoi est faite une galerie, en boites.
 *
 * Encore des mathematiques pures : ce module rend des listes de boites, pas
 * des objets three.js. Il est donc testable, et c'est la seule facon de
 * verifier qu'aucun mur ne bouche un couloir ou qu'aucune planche ne flotte.
 */

import {
  CORRIDOR_HEIGHT,
  CORRIDOR_LENGTH,
  CORRIDOR_WIDTH,
  HEXAGON_APOTHEM,
  HEXAGON_RADIUS,
  ROOM_HEIGHT,
  SHELF_THICKNESS,
  WALL_THICKNESS,
  BOOK_DEPTH,
} from '../dimensions.ts'
import { SHELVES_PER_WALL, WALLS_PER_HEXAGON } from '../../core/index.ts'
import type { Box } from '../instancing.ts'
import { CORRIDOR_SIDES, SHELF_SIDES, SHELF_USABLE_WIDTH, facingInward, shelfY, sideAngle, wallPlacement } from './layout3d.ts'

export interface Origin {
  readonly x: number
  readonly z: number
}

const ZERO: Origin = { x: 0, z: 0 }

/**
 * La maconnerie : les quatre murs pleins, et les deux murs perces d'un
 * couloir, decoupes en trois morceaux (jambage gauche, jambage droit, linteau).
 */
export function stoneBoxes(origin: Origin = ZERO): Box[] {
  const boxes: Box[] = []

  for (let side = 0; side < 6; side += 1) {
    const placement = wallPlacement(side, origin)
    const rotY = facingInward(side)
    const y = ROOM_HEIGHT / 2

    if (!CORRIDOR_SIDES.includes(side)) {
      boxes.push({ ...placement, y, rotY, sx: HEXAGON_RADIUS, sy: ROOM_HEIGHT, sz: WALL_THICKNESS })
      continue
    }

    // Mur perce : deux jambages et un linteau. Le vide entre eux EST la porte.
    const jambage = (HEXAGON_RADIUS - CORRIDOR_WIDTH) / 2
    const theta = sideAngle(side)
    const tx = -Math.sin(theta)
    const tz = Math.cos(theta)
    const decalage = (CORRIDOR_WIDTH + jambage) / 2
    for (const sens of [-1, 1]) {
      boxes.push({
        x: placement.x + tx * decalage * sens,
        y,
        z: placement.z + tz * decalage * sens,
        rotY,
        sx: jambage,
        sy: ROOM_HEIGHT,
        sz: WALL_THICKNESS,
      })
    }
    boxes.push({
      x: placement.x,
      y: CORRIDOR_HEIGHT + (ROOM_HEIGHT - CORRIDOR_HEIGHT) / 2,
      z: placement.z,
      rotY,
      sx: CORRIDOR_WIDTH,
      sy: ROOM_HEIGHT - CORRIDOR_HEIGHT,
      sz: WALL_THICKNESS,
    })

    // Le couloir lui-meme : deux parois et un plafond, qui filent vers la
    // galerie voisine. C'est ce qui creuse la perspective.
    const nx = Math.cos(theta)
    const nz = Math.sin(theta)
    const milieu = HEXAGON_APOTHEM + CORRIDOR_LENGTH / 2
    for (const sens of [-1, 1]) {
      boxes.push({
        x: origin.x + nx * milieu + tx * (CORRIDOR_WIDTH / 2) * sens,
        y: CORRIDOR_HEIGHT / 2,
        z: origin.z + nz * milieu + tz * (CORRIDOR_WIDTH / 2) * sens,
        rotY,
        sx: WALL_THICKNESS,
        sy: CORRIDOR_HEIGHT,
        sz: CORRIDOR_LENGTH,
      })
    }
    boxes.push({
      x: origin.x + nx * milieu,
      y: CORRIDOR_HEIGHT + WALL_THICKNESS / 2,
      z: origin.z + nz * milieu,
      rotY,
      sx: CORRIDOR_WIDTH + WALL_THICKNESS * 2,
      sy: WALL_THICKNESS,
      sz: CORRIDOR_LENGTH,
    })
  }

  return boxes
}

/** Les boiseries : une planche par mur et par rayon, plus les deux montants. */
export function woodBoxes(origin: Origin = ZERO): Box[] {
  const boxes: Box[] = []
  const profondeur = BOOK_DEPTH * 1.1
  const inward = HEXAGON_APOTHEM - profondeur / 2

  for (let wall = 0; wall < WALLS_PER_HEXAGON; wall += 1) {
    const side = SHELF_SIDES[wall] as number
    const theta = sideAngle(side)
    const rotY = facingInward(side)
    const nx = Math.cos(theta)
    const nz = Math.sin(theta)
    const tx = -Math.sin(theta)
    const tz = Math.cos(theta)

    for (let shelf = 0; shelf < SHELVES_PER_WALL; shelf += 1) {
      boxes.push({
        x: origin.x + nx * inward,
        y: shelfY(shelf),
        z: origin.z + nz * inward,
        rotY,
        sx: SHELF_USABLE_WIDTH + 0.08,
        sy: SHELF_THICKNESS,
        sz: profondeur,
      })
    }

    // Les deux montants qui tiennent les rayons.
    const hauteur = shelfY(SHELVES_PER_WALL - 1) + 0.1
    for (const sens of [-1, 1]) {
      const decalage = ((SHELF_USABLE_WIDTH + 0.08) / 2) * sens
      boxes.push({
        x: origin.x + nx * inward + tx * decalage,
        y: hauteur / 2,
        z: origin.z + nz * inward + tz * decalage,
        rotY,
        sx: SHELF_THICKNESS * 1.6,
        sy: hauteur,
        sz: profondeur,
      })
    }
  }

  return boxes
}
