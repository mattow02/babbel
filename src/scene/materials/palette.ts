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
 * Tires de la capture 5 de `design/` : des bruns, des rouges eteints, des
 * verts sourds, jamais saturés. La couleur d'un volume est deterministe,
 * derivee de son indice — comme tout le reste de la bibliotheque.
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

/** Choisit un dos de facon deterministe a partir de l'indice du volume. */
export function spineOf(index: number): string {
  // Un melange bon marche, juste assez pour casser les alignements visibles.
  const mixed = (index * 2654435761) >>> 0
  return SPINES[(mixed >>> 13) % SPINES.length] as string
}

/** Petite variation de hauteur, pour que les tranches ne soient pas alignees. */
export function spineHeightFactor(index: number): number {
  const mixed = (index * 40503 + 12345) >>> 0
  return 0.9 + ((mixed >>> 16) % 100) / 500 // entre 0,90 et 1,10
}
