/**
 * Ou se posent les elements du Seuil.
 *
 * Encore des mathematiques pures : les anneaux de cypres, les marches, la
 * colonnade et les caissons de la coupole sont des placements reguliers qu'on
 * peut verifier sans rien afficher.
 */

import { jitterOf } from '../hash.ts'
import type { Box } from '../instancing.ts'
import {
  ATRIUM_COLUMNS,
  ATRIUM_RADIUS,
  ATRIUM_WALL_HEIGHT,
  COFFERS_PER_RING,
  COFFER_RINGS,
  CYPRESS_PER_RING,
  STAIR_COUNT,
  STAIR_RISE,
  STAIR_RUN,
  STAIR_WIDTH,
  TERRACE_HEIGHTS,
  TERRACE_RADII,
} from './dimensions.ts'

export interface Placed {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotY: number
}

/**
 * Les cypres, en deux anneaux concentriques.
 *
 * Ils sont legerement irreguliers : un alignement parfait trahirait la
 * machine. Le desordre est deterministe, derive de l'indice.
 */
export function cypressRing(ring: number): Placed[] {
  const radius = TERRACE_RADII[ring]
  const height = TERRACE_HEIGHTS[ring]
  const count = CYPRESS_PER_RING[ring]
  if (radius === undefined || height === undefined || count === undefined) {
    throw new RangeError(`Anneau inconnu : ${ring}`)
  }
  const trees: Placed[] = []
  for (let index = 0; index < count; index += 1) {
    const jitter = jitterOf(index)
    const angle = ((index + jitter * 0.35) / count) * Math.PI * 2
    trees.push({
      x: Math.cos(angle) * radius,
      y: height,
      z: Math.sin(angle) * radius,
      rotY: angle,
    })
  }
  return trees
}

/** Les marches de l'escalier d'honneur, qui montent vers l'entree unique. */
export function stairSteps(baseZ: number): Box[] {
  const steps: Box[] = []
  for (let index = 0; index < STAIR_COUNT; index += 1) {
    steps.push({
      x: 0,
      y: index * STAIR_RISE + STAIR_RISE / 2,
      z: baseZ - index * STAIR_RUN,
      rotY: 0,
      sx: STAIR_WIDTH,
      sy: STAIR_RISE,
      // Chaque marche s'enfonce jusqu'au sol : la volee est pleine, pas
      // une succession de plaques flottantes.
      sz: STAIR_RUN * (STAIR_COUNT - index) * 2,
    })
  }
  return steps
}

/** Hauteur atteinte au sommet de l'escalier. */
export const STAIR_TOP_Y = STAIR_COUNT * STAIR_RISE

/** La colonnade qui ceinture le grand hall. */
export function atriumColumns(): Placed[] {
  const columns: Placed[] = []
  for (let index = 0; index < ATRIUM_COLUMNS; index += 1) {
    const angle = (index / ATRIUM_COLUMNS) * Math.PI * 2
    columns.push({
      x: Math.cos(angle) * (ATRIUM_RADIUS - 1.6),
      y: ATRIUM_WALL_HEIGHT / 2,
      z: Math.sin(angle) * (ATRIUM_RADIUS - 1.6),
      rotY: -angle,
    })
  }
  return columns
}

/**
 * Les caissons de la coupole.
 *
 * Ils suivent la demi-sphere : chaque anneau monte d'un cran en latitude, et
 * son rayon diminue. C'est le motif du Pantheon, et celui de la capture 8.
 */
export function domeCoffers(radius: number, base: number): Box[] {
  const coffers: Box[] = []
  for (let ring = 0; ring < COFFER_RINGS; ring += 1) {
    // On s'arrete avant le sommet : l'oculus reste degage.
    const phi = ((ring + 0.5) / (COFFER_RINGS + 1.6)) * (Math.PI / 2)
    const r = Math.cos(phi) * radius
    const y = base + Math.sin(phi) * radius
    const perRing = Math.max(8, Math.round(COFFERS_PER_RING * Math.cos(phi)))
    const taille = (2 * Math.PI * r) / perRing
    for (let index = 0; index < perRing; index += 1) {
      const angle = (index / perRing) * Math.PI * 2
      coffers.push({
        x: Math.cos(angle) * r,
        y,
        z: Math.sin(angle) * r,
        // Le lacet oriente le caisson vers le centre ; l'inclinaison le couche
        // sur la coupole, faute de quoi il saillirait comme un plot.
        rotY: -angle + Math.PI / 2,
        rotX: phi,
        sx: taille * 0.66,
        sy: taille * 0.66,
        sz: 0.85,
      })
    }
  }
  return coffers
}
