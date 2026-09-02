/**
 * Ou le visiteur a le droit d'etre, et dans quelle galerie il se trouve.
 *
 * Mathematiques pures, sans three.js : on verifie les collisions et le
 * changement de galerie sans GPU ni navigateur.
 *
 * ------------------------------------------------------------------------
 * LE REPERE : UN AXE, UNE LATERALE
 *
 * Les deux murs libres etant opposes (decision D23), les galeries s'enfilent
 * en ligne droite. Tout se lit donc plus simplement dans un repere tourne :
 *
 *   u = avancee le long de l'axe des couloirs
 *   v = ecart lateral par rapport a cet axe
 *
 * La galerie numero k a son centre en u = k x PAS, v = 0. Entre deux galeries,
 * il n'y a qu'un couloir.
 *
 * ------------------------------------------------------------------------
 * LA CONSEQUENCE LA PLUS IMPORTANTE
 *
 * L'axe des couloirs EST l'enumeration des galeries : avancer d'une galerie,
 * c'est incrementer le numero d'hexagone de l'adresse. La disposition physique
 * et l'espace des adresses ne font qu'un.
 *
 * Or il y a environ 10^4468 galeries. Aucun systeme de coordonnees ne peut les
 * couvrir : un float perd toute precision bien avant. On travaille donc en
 * ORIGINE FLOTTANTE : les positions sont toujours relatives a la galerie
 * courante, et franchir un couloir remet le compteur a zero en incrementant le
 * numero d'hexagone. Voir `rebase`.
 */

import {
  CORRIDOR_WIDTH,
  GALLERY_PITCH,
  HEXAGON_APOTHEM,
  STAIRWELL_RADIUS,
  VESTIBULE_SIZE,
} from '../dimensions.ts'
import { CORRIDOR_SIDES, SIDES, sideAngle } from '../hexagon/layout3d.ts'

/** Un point au sol. */
export interface Point2 {
  readonly x: number
  readonly z: number
}

const AXIS_ANGLE = sideAngle(CORRIDOR_SIDES[0] as number)

/** Vecteur unitaire le long de l'axe des couloirs. */
export const AXIS: Point2 = { x: Math.cos(AXIS_ANGLE), z: Math.sin(AXIS_ANGLE) }

/** Vecteur unitaire perpendiculaire, dans le plan du sol. */
export const LATERAL: Point2 = { x: -Math.sin(AXIS_ANGLE), z: Math.cos(AXIS_ANGLE) }

/** Les six normales sortantes de l'hexagone, calculees une fois. */
const NORMALS: readonly Point2[] = Array.from({ length: SIDES }, (_, side) => ({
  x: Math.cos(sideAngle(side)),
  z: Math.sin(sideAngle(side)),
}))

function dot(a: Point2, b: Point2): number {
  return a.x * b.x + a.z * b.z
}

/** Avancee le long de l'axe des couloirs. */
export function along(point: Point2): number {
  return dot(point, AXIS)
}

/** Ecart lateral par rapport a l'axe. */
export function lateral(point: Point2): number {
  return dot(point, LATERAL)
}

/**
 * Le point est-il dans la salle hexagonale, a `margin` pres des murs ?
 *
 * Un hexagone regulier est l'intersection de six demi-plans : il suffit que la
 * projection du point sur chacune des six normales reste sous l'apotheme.
 */
export function insideHexagon(point: Point2, margin: number): boolean {
  const limit = HEXAGON_APOTHEM - margin
  for (const normal of NORMALS) {
    if (dot(point, normal) > limit) return false
  }
  return true
}

/**
 * Le point est-il dans le zaguan, et hors de sa tremie ?
 *
 * Le vestibule est une salle carree, percee en son centre d'un puits. On y
 * marche donc sur un ANNEAU : dans le carre, et hors du puits, plus les deux
 * embrasures par lesquelles on y entre.
 *
 * @param u avancee depuis le centre du vestibule
 * @param v ecart lateral depuis ce meme centre
 */
export function insideVestibule(u: number, v: number, margin: number): boolean {
  const demi = VESTIBULE_SIZE / 2

  // On ne marche jamais dans le vide.
  if (Math.hypot(u, v) < STAIRWELL_RADIUS + margin) return false

  const dansLeCarre = Math.abs(u) <= demi - margin && Math.abs(v) <= demi - margin
  /*
   * L'EMBRASURE.
   *
   * Aux deux extremites du vestibule il n'y a pas de mur, mais l'ouverture du
   * passage. Sans ce cas, la garde au mur fermerait la porte de l'interieur et
   * l'on resterait bloque a l'entree du zaguan : ce qui est exactement ce qui
   * arrivait avant d'ecrire ce test.
   */
  const dansLEmbrasure = Math.abs(v) <= CORRIDOR_WIDTH / 2 - margin

  return dansLeCarre || dansLEmbrasure
}

/**
 * Le point est-il quelque part dans la bibliotheque ?
 *
 * `point` est relatif au centre de la galerie COURANTE. Trois lieux possibles,
 * et un seul suffit : la salle hexagonale, l'un des deux passages, ou le
 * vestibule qui les separe.
 */
export function insideLibrary(point: Point2, margin: number): boolean {
  const u = along(point)
  const v = lateral(point)

  const nearest = Math.round(u / GALLERY_PITCH)
  const local: Point2 = {
    x: point.x - AXIS.x * nearest * GALLERY_PITCH,
    z: point.z - AXIS.z * nearest * GALLERY_PITCH,
  }
  if (insideHexagon(local, margin)) return true

  /*
   * Chaque lieu ne vaut que sur SON domaine.
   *
   * `du` est l'avancee depuis le centre de la galerie la plus proche, donc au
   * plus une demi-foulee. Le vestibule occupe la fin de cet intervalle, le
   * passage le milieu. Sans ce decoupage, le test du passage : large ouvert au
   * centre : laisserait marcher droit dans la tremie.
   */
  const du = u - nearest * GALLERY_PITCH
  const versVestibule = Math.abs(du) - GALLERY_PITCH / 2
  const demiVestibule = VESTIBULE_SIZE / 2

  if (Math.abs(versVestibule) <= demiVestibule) {
    return insideVestibule(versVestibule, v, margin)
  }

  return Math.abs(v) <= CORRIDOR_WIDTH / 2 - margin
}

/** Le resultat d'un recentrage : de combien de galeries on a bouge, et ou on est. */
export interface Rebase {
  /** Nombre de galeries franchies. A ajouter au numero d'hexagone. */
  readonly shift: number
  /** Position, ramenee au voisinage de la nouvelle galerie courante. */
  readonly position: Point2
}

/**
 * L'origine flottante.
 *
 * Des que le visiteur est plus pres du centre d'une autre galerie que de la
 * sienne, on change de galerie de reference et on ramene sa position pres de
 * zero. Les coordonnees restent ainsi toujours petites, quelle que soit la
 * profondeur atteinte dans une bibliotheque qui compte 10^4468 galeries.
 */
export function rebase(point: Point2): Rebase {
  const shift = Math.round(along(point) / GALLERY_PITCH)
  if (shift === 0) return { shift: 0, position: point }
  return {
    shift,
    position: {
      x: point.x - AXIS.x * shift * GALLERY_PITCH,
      z: point.z - AXIS.z * shift * GALLERY_PITCH,
    },
  }
}

/**
 * Deplace le visiteur de `from` vers `to` sans traverser les murs.
 *
 * Resolution par glissement : si le pas complet ne passe pas, on tente
 * l'avancee seule, puis l'ecart lateral seul. On longe ainsi les murs au lieu
 * de s'y coller net, et c'est aussi ce qui permet de contourner la tremie
 * sans avoir a viser.
 */
export function slide(from: Point2, to: Point2, margin: number): Point2 {
  if (insideLibrary(to, margin)) return to

  const du = along(to) - along(from)
  const dv = lateral(to) - lateral(from)

  /*
   * Attention au piege : si l'on marche pile dans l'axe, l'ecart lateral vaut
   * zero, et le candidat « lateral seul » EST la position actuelle : valide,
   * evidemment. On repondrait alors « je ne bouge pas » sans avoir rien tente.
   * D'ou le seuil : une composante nulle n'est pas un candidat.
   */
  const NEGLIGEABLE = 1e-6

  if (Math.abs(du) > NEGLIGEABLE) {
    const seulementAxe: Point2 = { x: from.x + AXIS.x * du, z: from.z + AXIS.z * du }
    if (insideLibrary(seulementAxe, margin)) return seulementAxe
  }

  if (Math.abs(dv) > NEGLIGEABLE) {
    const seulementLateral: Point2 = { x: from.x + LATERAL.x * dv, z: from.z + LATERAL.z * dv }
    if (insideLibrary(seulementLateral, margin)) return seulementLateral
  }

  /*
   * Le contournement.
   *
   * Les deux essais precedents suffisent le long d'un mur droit, mais pas
   * contre un obstacle ROND : en marchant droit sur la tremie du zaguan, ni
   * l'avancee seule ni l'ecart seul ne passent, et l'on resterait plante
   * devant le vide.
   *
   * On tente donc quelques directions deviees, de part et d'autre et de plus
   * en plus franches. La premiere qui passe est la bonne : c'est ce qui fait
   * qu'on longe naturellement le puits au lieu de s'y coller.
   */
  const dx = to.x - from.x
  const dz = to.z - from.z
  for (const angle of [0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.7, -1.7]) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const devie: Point2 = {
      x: from.x + dx * cos - dz * sin,
      z: from.z + dx * sin + dz * cos,
    }
    if (insideLibrary(devie, margin)) return devie
  }

  return from
}
