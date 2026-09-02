/**
 * La nef : ou se posent les piliers, les marches, les tribunes, et ou l'on a
 * le droit de marcher.
 *
 * Tout est mathematique pure, verifiable sans afficher une seule image. C'est
 * la meme discipline que pour la bibliotheque : la geometrie d'un lieu se
 * teste, l'apparence se regarde.
 *
 * ---------------------------------------------------------------------------
 * DEUX SOLS AU MEME ENDROIT
 *
 * Le bas-cote passe SOUS la tribune. Au-dessus d'un meme point du plan, il y a
 * donc deux planchers possibles, et une fonction `hauteur(x, z)` ne peut pas
 * repondre. On rend donc la LISTE des sols presents, et c'est le marcheur qui
 * choisit celui qui est a portee de son pas. Cette regle du pas maximal fait
 * tout le travail : elle laisse monter une marche, et elle interdit de
 * franchir la balustrade d'une tribune pour tomber dans la nef.
 */

import type { Point2 } from '../navigation/geometry.ts'
import { slideAgainst } from '../navigation/sliding.ts'
import type { Box } from '../instancing.ts'
import {
  AISLE_OUTER_X,
  HALL_RADIUS,
  NAVE_END_Z,
  NAVE_ENTRY_Z,
  PILLAR_COUNT,
  PILLAR_HEIGHT,
  PILLAR_RADIUS,
  PILLAR_SPACING,
  PILLAR_X,
  STAIR_FOOT_Z,
  STAIR_RISE,
  STAIR_RUN,
  STAIR_STEPS,
  STAIR_WIDTH,
  STAIR_X,
  TRIBUNE_BACK_Z,
  TRIBUNE_FRONT_Z,
  TRIBUNE_INNER_X,
  TRIBUNE_Y,
} from './dimensions.ts'

/** Le plus haut ressaut qu'un pas franchit. Au-dela, c'est un mur ou un vide. */
export const STEP_MAX = 0.6

/** Un pilier, vu du dessus. */
export interface Pillar {
  readonly x: number
  readonly z: number
}

/**
 * Les deux files de piliers qui bordent l'allee centrale.
 *
 * Elles sont centrees sur la nef : c'est la symetrie frontale de la direction
 * artistique, et c'est elle qui donne le point de fuite quand on entre.
 */
export function pillars(): Pillar[] {
  const rangee: Pillar[] = []
  const premier = -((PILLAR_COUNT - 1) / 2) * PILLAR_SPACING
  const centre = (NAVE_ENTRY_Z + NAVE_END_Z) / 2
  for (let index = 0; index < PILLAR_COUNT; index += 1) {
    const z = centre + premier + index * PILLAR_SPACING
    rangee.push({ x: -PILLAR_X, z }, { x: PILLAR_X, z })
  }
  return rangee
}

/**
 * Les marches des deux escaliers lateraux.
 *
 * Chaque marche descend jusqu'au sol : une volee est un massif plein, pas une
 * pile de plaques flottantes. On la voit par en dessous depuis le bas-cote.
 */
export function stairSteps(): Box[] {
  const marches: Box[] = []
  for (const cote of [-1, 1]) {
    for (let index = 0; index < STAIR_STEPS; index += 1) {
      const hauteur = (index + 1) * STAIR_RISE
      marches.push({
        x: cote * STAIR_X,
        y: hauteur / 2,
        z: STAIR_FOOT_Z - index * STAIR_RUN,
        rotY: 0,
        sx: STAIR_WIDTH,
        sy: hauteur,
        sz: STAIR_RUN,
      })
    }
  }
  return marches
}

/** Le plancher des deux tribunes, et le bandeau qui le borde. */
export function tribuneSlabs(): Box[] {
  const profondeur = TRIBUNE_FRONT_Z - TRIBUNE_BACK_Z
  const largeur = AISLE_OUTER_X - TRIBUNE_INNER_X
  const dalles: Box[] = []
  for (const cote of [-1, 1]) {
    dalles.push({
      x: cote * (TRIBUNE_INNER_X + largeur / 2),
      y: TRIBUNE_Y - 0.25,
      z: (TRIBUNE_FRONT_Z + TRIBUNE_BACK_Z) / 2,
      rotY: 0,
      sx: largeur,
      sy: 0.5,
      sz: profondeur,
    })
    // La balustrade, cote vide. Elle borde la tribune sur toute sa longueur.
    dalles.push({
      x: cote * TRIBUNE_INNER_X,
      y: TRIBUNE_Y + 0.55,
      z: (TRIBUNE_FRONT_Z + TRIBUNE_BACK_Z) / 2,
      rotY: 0,
      sx: 0.42,
      sy: 1.1,
      sz: profondeur,
    })
  }
  return dalles
}

/** Vrai si le point est sur l'emprise d'une volee d'escalier. */
function surEscalier(point: Point2): boolean {
  const haut = STAIR_FOOT_Z - STAIR_STEPS * STAIR_RUN
  if (point.z > STAIR_FOOT_Z || point.z < haut) return false
  return Math.abs(Math.abs(point.x) - STAIR_X) <= STAIR_WIDTH / 2
}

/** Vrai si le point est sous, ou sur, l'emprise d'une tribune. */
function sousTribune(point: Point2): boolean {
  if (point.z > TRIBUNE_FRONT_Z || point.z < TRIBUNE_BACK_Z) return false
  const ecart = Math.abs(point.x)
  return ecart >= TRIBUNE_INNER_X && ecart <= AISLE_OUTER_X
}

/**
 * Tous les sols presents a la verticale d'un point, du plus bas au plus haut.
 *
 * Jamais vide sur l'emprise du hall : le dallage de la nef court partout.
 */
export function hallFloors(point: Point2): number[] {
  /*
   * Sur une volee, il n'y a QU'UN sol : celui de la marche.
   *
   * Le massif de l'escalier est plein, on ne marche pas dedans. Le dire ainsi
   * evite surtout une egalite parfaite entre la marche suivante et le dallage,
   * au milieu de laquelle un choix « au plus proche » hesiterait a chaque pas.
   */
  if (surEscalier(point)) {
    const monte = Math.min(STAIR_STEPS, Math.max(0, (STAIR_FOOT_Z - point.z) / STAIR_RUN))
    return [Math.ceil(monte) * STAIR_RISE]
  }
  const sols = [0]
  if (sousTribune(point)) sols.push(TRIBUNE_Y)
  return sols
}

/**
 * Le sol que choisit quelqu'un qui se tient deja a la hauteur `courante`.
 *
 * Rend `null` quand aucun sol n'est a portee de son pas : c'est le vide, et le
 * pas doit etre refuse.
 */
export function floorFor(point: Point2, courante: number): number | null {
  let meilleur: number | null = null
  let ecart = Number.POSITIVE_INFINITY
  for (const sol of hallFloors(point)) {
    const distance = Math.abs(sol - courante)
    if (distance < ecart) {
      ecart = distance
      meilleur = sol
    }
  }
  return meilleur !== null && ecart <= STEP_MAX ? meilleur : null
}

/** Vrai si l'on a le droit de poser les pieds la, en restant a sa hauteur. */
export function insideHall(point: Point2, margin: number, hauteur = 0): boolean {
  // Le mur circulaire du hall.
  if (point.x * point.x + point.z * point.z > (HALL_RADIUS - margin) ** 2) return false
  // Les deux extremites de la nef, et ses bas-cotes.
  if (point.z > NAVE_ENTRY_Z - margin || point.z < NAVE_END_Z + margin) return false
  if (Math.abs(point.x) > AISLE_OUTER_X - margin) return false

  // Les piliers, qu'on ne traverse pas.
  for (const pilier of PILIERS) {
    const dx = point.x - pilier.x
    const dz = point.z - pilier.z
    if (dx * dx + dz * dz < (PILLAR_RADIUS + margin) ** 2) return false
  }

  // Et enfin : y a-t-il un sol a portee du pas ?
  return floorFor(point, hauteur) !== null
}

/** Les piliers ne bougent jamais : on les calcule une fois. */
const PILIERS = pillars()

const AXE: Point2 = { x: 0, z: 1 }
const LATERAL: Point2 = { x: 1, z: 0 }

/** Le deplacement effectif dans le hall, sans traverser la matiere. */
export function slideInHall(from: Point2, to: Point2, margin: number, hauteur: number): Point2 {
  return slideAgainst(
    (point, marge) => insideHall(point, marge, hauteur),
    from,
    to,
    margin,
    AXE,
    LATERAL,
  )
}

/** Hauteur libre sous plafond, pour poser les lumieres et les caissons. */
export const PILLAR_TOP = PILLAR_HEIGHT
