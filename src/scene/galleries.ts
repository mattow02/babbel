/**
 * Ou se trouvent les galeries visibles.
 *
 * Les deux murs libres etant opposes, les galeries s'enfilent en ligne droite :
 * on voit par la porte la galerie suivante, et celle d'apres. C'est ce qui
 * suggere l'infini sans avoir a le construire.
 *
 * La phase 4 en pose un nombre FIXE. Les charger et les decharger au fil du
 * deplacement, c'est la phase 5 — mais rien d'autre n'aura a changer : il
 * suffira de faire varier cette liste.
 */

import { GALLERY_PITCH } from './dimensions.ts'
import { CORRIDOR_SIDES, sideAngle } from './hexagon/layout3d.ts'
import type { Origin } from './hexagon/parts.ts'

export function galleryOrigins(depth: number): Origin[] {
  const theta = sideAngle(CORRIDOR_SIDES[0] as number)
  const dx = Math.cos(theta) * GALLERY_PITCH
  const dz = Math.sin(theta) * GALLERY_PITCH
  const origins: Origin[] = []
  for (let step = -depth; step <= depth; step += 1) {
    origins.push({ x: dx * step, z: dz * step })
  }
  return origins
}
