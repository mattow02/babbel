import { hash32, unitOf } from '../hash.ts'

/**
 * La palette de la direction artistique, cote 3D.
 *
 * Voir docs/DIRECTION-ARTISTIQUE.md § 2. Regle absolue : aucun gris neutre.
 * Les ombres tirent vers le brun-violace, les lumieres vers l'ambre.
 */
export const PALETTE = {
  /** Calcaire des murs, eclaire. */
  calcaire: '#c9b697',
  /** Sol, plus sombre et poli. */
  dalle: '#6a5847',
  /** Plafond, dans l'ombre. */
  plafond: '#6d5c4b',
  /** Boiseries des etageres. */
  bois: '#2a2320',
  /** La lampe spherique. */
  lampe: '#f2c078',
  /** Le noir chaud du fond. */
  nuit: '#0d0b0a',
} as const

/**
 * Les dos de livres.
 *
 * Tires de la cinquieme capture de reference : des bruns, des rouges eteints, des
 * verts sourds, jamais saturés. La couleur d'un volume est deterministe,
 * derivee de son indice : comme tout le reste de la bibliotheque.
 */
export const SPINES: readonly string[] = [
  '#5c3a38',
  '#4a3b35',
  '#3b3129',
  '#54402c',
  '#33372c',
  '#6b4a35',
  '#2f2a26',
  '#5a4632',
]

/**
 * Choisit un dos de facon deterministe a partir de l'indice du volume.
 *
 * Le melange passe par `hash32` et non par une simple multiplication : une
 * multiplication est affine, et les couleurs se mettraient a defiler selon un
 * motif qui se repete le long des etageres. Voir scene/hash.ts.
 */
export function spineOf(index: number): string {
  return SPINES[hash32(index) % SPINES.length] as string
}

/** Petite variation de hauteur, pour que les tranches ne soient pas alignees. */
export function spineHeightFactor(index: number): number {
  return 0.9 + unitOf(index ^ 0x5bf03635) * 0.2 // entre 0,90 et 1,10
}
