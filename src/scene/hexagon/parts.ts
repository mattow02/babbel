/**
 * De quoi est faite une galerie, en boites.
 *
 * Encore des mathematiques pures : ce module rend des listes de boites, pas
 * des objets three.js. Il est donc testable, et c'est la seule facon de
 * verifier qu'aucun mur ne bouche un couloir ou qu'aucune planche ne flotte.
 */

import {
  CORRIDOR_HEIGHT,
  CORRIDOR_WIDTH,
  PASSAGE_LENGTH,
  SHAFT_DEPTH,
  STAIRWELL_RADIUS,
  VESTIBULE_HEIGHT,
  VESTIBULE_SIZE,
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

    /*
     * Le chemin vers la galerie voisine : deux passages etroits, et entre eux
     * le ZAGUAN — un vestibule carre, plus large et plus haut, perce en son
     * centre d'une tremie. C'est la que se trouve l'escalier, et c'est de la
     * qu'on voit le puits s'abimer et s'elever.
     */
    const nx = Math.cos(theta)
    const nz = Math.sin(theta)
    const demi = VESTIBULE_SIZE / 2
    const centreVestibule = HEXAGON_APOTHEM + PASSAGE_LENGTH + demi

    /** Pose une boite reperee par (avancee, ecart) depuis le centre du vestibule. */
    const poser = (u: number, y: number, v: number, sx: number, sy: number, sz: number): void => {
      const along = centreVestibule + u
      boxes.push({
        x: origin.x + nx * along + tx * v,
        y,
        z: origin.z + nz * along + tz * v,
        rotY,
        sx,
        sy,
        sz,
      })
    }

    // Les deux passages : parois et plafond.
    for (const sens of [-1, 1]) {
      const milieuPassage = HEXAGON_APOTHEM + PASSAGE_LENGTH / 2
      for (const cote of [-1, 1]) {
        boxes.push({
          x: origin.x + nx * milieuPassage + tx * (CORRIDOR_WIDTH / 2) * cote,
          y: CORRIDOR_HEIGHT / 2,
          z: origin.z + nz * milieuPassage + tz * (CORRIDOR_WIDTH / 2) * cote,
          rotY,
          sx: WALL_THICKNESS,
          sy: CORRIDOR_HEIGHT,
          sz: PASSAGE_LENGTH,
        })
      }
      boxes.push({
        x: origin.x + nx * milieuPassage,
        y: CORRIDOR_HEIGHT + WALL_THICKNESS / 2,
        z: origin.z + nz * milieuPassage,
        rotY,
        sx: CORRIDOR_WIDTH + WALL_THICKNESS * 2,
        sy: WALL_THICKNESS,
        sz: PASSAGE_LENGTH,
      })
      if (sens === 1) break // le passage est le meme des deux cotes du vestibule
    }

    // Les deux flancs pleins du vestibule.
    for (const cote of [-1, 1]) {
      poser(0, VESTIBULE_HEIGHT / 2, demi * cote, WALL_THICKNESS, VESTIBULE_HEIGHT, VESTIBULE_SIZE)
    }

    // Les deux faces percees : deux jambages et un linteau chacune.
    const jambageVestibule = demi - CORRIDOR_WIDTH / 2
    for (const face of [-1, 1]) {
      for (const cote of [-1, 1]) {
        poser(
          demi * face,
          VESTIBULE_HEIGHT / 2,
          (CORRIDOR_WIDTH / 2 + jambageVestibule / 2) * cote,
          jambageVestibule,
          VESTIBULE_HEIGHT,
          WALL_THICKNESS,
        )
      }
      poser(
        demi * face,
        CORRIDOR_HEIGHT + (VESTIBULE_HEIGHT - CORRIDOR_HEIGHT) / 2,
        0,
        CORRIDOR_WIDTH,
        VESTIBULE_HEIGHT - CORRIDOR_HEIGHT,
        WALL_THICKNESS,
      )
    }

    /*
     * Le sol et le plafond du vestibule, en ANNEAU autour de la tremie.
     *
     * Le trou est carre et de demi-cote egal au rayon du puits : ses coins
     * tombent a R * racine(2) = 0,99 du centre, juste en deca du rayon a partir
     * duquel on a le droit de marcher (0,7 + 0,3). On ne peut donc jamais se
     * tenir au-dessus du vide, quel que soit l'angle.
     */
    const bord = (demi + STAIRWELL_RADIUS) / 2
    const largeurBande = demi - STAIRWELL_RADIUS
    for (const niveau of [
      { y: -WALL_THICKNESS / 2, epaisseur: WALL_THICKNESS },
      { y: VESTIBULE_HEIGHT + WALL_THICKNESS / 2, epaisseur: WALL_THICKNESS },
    ]) {
      for (const cote of [-1, 1]) {
        // Deux bandes pleines sur toute la largeur...
        poser(bord * cote, niveau.y, 0, VESTIBULE_SIZE, niveau.epaisseur, largeurBande)
        // ...et deux bandes courtes qui completent l'anneau.
        poser(
          0,
          niveau.y,
          bord * cote,
          largeurBande,
          niveau.epaisseur,
          STAIRWELL_RADIUS * 2,
        )
      }
    }

    /*
     * Le puits : quatre parois qui montent et qui descendent.
     *
     * C'est ce qui donne le vertige. Sans elles, on verrait le neant par la
     * tremie ; avec elles, on voit un puits qui continue au-dela de ce que la
     * lampe eclaire.
     */
    for (const sens of [-1, 1]) {
      const yPuits = sens > 0 ? VESTIBULE_HEIGHT + SHAFT_DEPTH / 2 : -SHAFT_DEPTH / 2
      for (const cote of [-1, 1]) {
        /*
         * Attention a l'orientation : dans `poser`, `sx` est l'extension
         * LATERALE et `sz` l'extension le long de l'axe. Une paroi placee en
         * u = +R doit donc etre large en v et mince en u — et non l'inverse,
         * sous peine de reboucher a moitie la tremie qu'elle est censee border.
         */
        poser(STAIRWELL_RADIUS * cote, yPuits, 0, STAIRWELL_RADIUS * 2, SHAFT_DEPTH, WALL_THICKNESS)
        poser(0, yPuits, STAIRWELL_RADIUS * cote, WALL_THICKNESS, SHAFT_DEPTH, STAIRWELL_RADIUS * 2)
      }
    }
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
