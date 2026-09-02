/**
 * Glisser le long de ce qu'on ne peut pas traverser.
 *
 * Le meme probleme se pose dans les deux lieux du site : la bibliotheque et le
 * grand hall, avec des murs completement differents. Seule change la reponse
 * a la question « ai-je le droit d'etre ici ? » ; la maniere de longer un mur
 * plutot que de s'y coller, elle, est identique. On l'ecrit donc une fois.
 *
 * Mathematiques pures : cela se verifie sans GPU ni navigateur.
 */

import type { Point2 } from './geometry.ts'

/** Vrai si le point est un endroit autorise, marge comprise. */
export type Autorise = (point: Point2, margin: number) => boolean

/**
 * Une composante de deplacement plus petite que cela n'est pas un candidat.
 *
 * Le piege : en marchant pile dans l'axe, l'ecart lateral vaut zero, et le
 * candidat « lateral seul » EST la position de depart, evidemment valide. On
 * repondrait « je ne bouge pas » sans avoir rien tente.
 */
const NEGLIGEABLE = 1e-6

/**
 * Le deplacement effectif de `from` vers `to`, sans traverser la matiere.
 *
 * On essaie d'abord le mouvement complet, puis chacune de ses deux composantes
 * seule : ce qui suffit a longer un mur droit, puis quelques directions
 * deviees, de plus en plus franches. Ces dernieres ne sont pas un luxe : face
 * a un obstacle ROND, ni l'avancee seule ni l'ecart seul ne passent, et l'on
 * resterait plante devant.
 */
export function slideAgainst(
  autorise: Autorise,
  from: Point2,
  to: Point2,
  margin: number,
  axis: Point2,
  lateral: Point2,
): Point2 {
  if (autorise(to, margin)) return to

  const dx = to.x - from.x
  const dz = to.z - from.z
  const du = dx * axis.x + dz * axis.z
  const dv = dx * lateral.x + dz * lateral.z

  if (Math.abs(du) > NEGLIGEABLE) {
    const seulementAxe: Point2 = { x: from.x + axis.x * du, z: from.z + axis.z * du }
    if (autorise(seulementAxe, margin)) return seulementAxe
  }

  if (Math.abs(dv) > NEGLIGEABLE) {
    const seulementLateral: Point2 = { x: from.x + lateral.x * dv, z: from.z + lateral.z * dv }
    if (autorise(seulementLateral, margin)) return seulementLateral
  }

  for (const angle of [0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.7, -1.7]) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const devie: Point2 = {
      x: from.x + dx * cos - dz * sin,
      z: from.z + dx * sin + dz * cos,
    }
    if (autorise(devie, margin)) return devie
  }

  return from
}
