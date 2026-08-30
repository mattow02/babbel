/**
 * « Une escalier spirale, qui s'abime et s'eleve vers le lointain. »
 *
 * Borges place l'escalier dans le zaguan, pas au centre de la salle : c'est ce
 * que nous faisons, contre la premiere version de la roadmap qui parlait d'un
 * puits central que la nouvelle ne decrit nulle part.
 *
 * L'escalier occupe la tremie du vestibule, et il la DEPASSE largement, en
 * haut comme en bas. C'est tout l'effet recherche : on ne voit ni son depart
 * ni son terme, seulement une helice qui sort du champ de la lampe.
 */

import {
  HEXAGON_APOTHEM,
  PASSAGE_LENGTH,
  STAIR_RADIUS,
  STAIR_RISE,
  STAIR_STEPS,
  STAIR_TREAD_THICKNESS,
  STAIR_TREAD_WIDTH,
  VESTIBULE_HEIGHT,
  VESTIBULE_SIZE,
} from '../dimensions.ts'
import type { Box } from '../instancing.ts'
import { CORRIDOR_SIDES, sideAngle } from './layout3d.ts'
import type { Origin } from './parts.ts'

/** Marches par tour complet. Moins, et l'helice ne se lit plus. */
const STEPS_PER_TURN = 11

/** Les marches et le fut des escaliers d'une galerie. */
export function stairBoxes(origin: Origin = { x: 0, z: 0 }): Box[] {
  const boxes: Box[] = []

  /*
   * Un seul escalier par vestibule, et non un par galerie.
   *
   * Deux galeries voisines partagent le meme zaguan : si chacune y plantait le
   * sien, tous les puits en compteraient deux, l'un dans l'autre. On n'en pose
   * donc qu'a une extremite.
   */
  for (const side of CORRIDOR_SIDES.slice(0, 1)) {
    const theta = sideAngle(side)
    const along = HEXAGON_APOTHEM + PASSAGE_LENGTH + VESTIBULE_SIZE / 2
    const cx = origin.x + Math.cos(theta) * along
    const cz = origin.z + Math.sin(theta) * along

    const hauteur = STAIR_STEPS * STAIR_RISE
    const base = VESTIBULE_HEIGHT / 2 - hauteur / 2

    // Le fut, qui traverse la tremie de part en part.
    boxes.push({
      x: cx,
      y: VESTIBULE_HEIGHT / 2,
      z: cz,
      rotY: 0,
      sx: 0.13,
      sy: hauteur,
      sz: 0.13,
    })

    for (let step = 0; step < STAIR_STEPS; step += 1) {
      const angle = (step / STEPS_PER_TURN) * Math.PI * 2
      const rayon = STAIR_RADIUS * 0.55
      boxes.push({
        x: cx + Math.cos(angle) * rayon,
        y: base + step * STAIR_RISE,
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

/** Ou se trouve le fut de l'escalier, relativement au centre de la galerie. */
export function stairwellCentre(): { x: number; z: number } {
  const theta = sideAngle(CORRIDOR_SIDES[0] as number)
  const along = HEXAGON_APOTHEM + PASSAGE_LENGTH + VESTIBULE_SIZE / 2
  return { x: Math.cos(theta) * along, z: Math.sin(theta) * along }
}
