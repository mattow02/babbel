/**
 * « Une escalier spirale, qui s'abime et s'eleve vers le lointain. »
 *
 * Borges place l'escalier dans le couloir, pas au centre de la salle : c'est ce
 * que nous faisons, contre la premiere version de la roadmap qui parlait d'un
 * puits central que la nouvelle ne decrit nulle part.
 *
 * L'escalier se plaque contre une paroi du couloir pour laisser le passage.
 * Il est pour l'instant DECORATIF : la navigation verticale viendra avec les
 * etages. Il donne deja au couloir sa profondeur et son vertige.
 */

import {
  CORRIDOR_WIDTH,
  HEXAGON_APOTHEM,
  CORRIDOR_LENGTH,
  STAIR_RADIUS,
  STAIR_RISE,
  STAIR_STEPS,
  STAIR_TREAD_THICKNESS,
  STAIR_TREAD_WIDTH,
} from '../dimensions.ts'
import type { Box } from '../instancing.ts'
import { CORRIDOR_SIDES, sideAngle } from './layout3d.ts'
import type { Origin } from './parts.ts'

/** Les marches des deux escaliers d'une galerie, plus leur fut central. */
export function stairBoxes(origin: Origin = { x: 0, z: 0 }): Box[] {
  const boxes: Box[] = []

  /*
   * Un seul escalier par couloir, et non un par galerie.
   *
   * Deux galeries voisines partagent le meme passage : si chacune y plantait
   * son escalier, tous les couloirs en compteraient deux, face a face, et le
   * passage serait a moitie bouche. On n'en pose donc qu'a une extremite.
   */
  for (const side of CORRIDOR_SIDES.slice(0, 1)) {
    const theta = sideAngle(side)
    const nx = Math.cos(theta)
    const nz = Math.sin(theta)
    const tx = -Math.sin(theta)
    const tz = Math.cos(theta)

    // Le fut se dresse contre une paroi, au milieu du couloir.
    const alongAxis = HEXAGON_APOTHEM + CORRIDOR_LENGTH / 2
    const aside = CORRIDOR_WIDTH / 2 - STAIR_RADIUS * 0.55
    const cx = origin.x + nx * alongAxis + tx * aside
    const cz = origin.z + nz * alongAxis + tz * aside

    const hauteur = STAIR_STEPS * STAIR_RISE
    boxes.push({
      x: cx,
      y: hauteur / 2 - hauteur / 2,
      z: cz,
      rotY: 0,
      sx: 0.09,
      sy: hauteur * 2,
      sz: 0.09,
    })

    // Les marches montent en helice autour du fut. Un tour complet en huit
    // marches : assez serre pour lire la spirale, assez lache pour la voir.
    for (let step = 0; step < STAIR_STEPS; step += 1) {
      const angle = (step / 8) * Math.PI * 2
      const rayon = STAIR_RADIUS * 0.55
      boxes.push({
        x: cx + Math.cos(angle) * rayon,
        y: step * STAIR_RISE - (STAIR_STEPS * STAIR_RISE) / 2,
        z: cz + Math.sin(angle) * rayon,
        rotY: -angle,
        sx: STAIR_TREAD_WIDTH,
        sy: STAIR_TREAD_THICKNESS,
        sz: STAIR_RADIUS * 1.5,
      })
    }
  }

  return boxes
}
