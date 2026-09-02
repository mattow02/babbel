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
  /**
   * Sol : sombre et poli.
   *
   * Il etait a #6a5847, soit dix fois plus clair que celui de l'illustration,
   * mesure a 0,002 de luminance. Un sol clair renvoie la lumiere partout et
   * il n'y a plus d'ombre nulle part ; un sol noir, lui, ne montre que le
   * reflet de la lampe, et c'est ce qui creuse la salle.
   */
  dalle: '#241c17',
  /** Plafond : dans l'ombre, et il doit y rester. */
  plafond: '#2b241d',
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
  // L'ecart de valeur EST le sujet.
  //
  // Mesure case par case : dans l'illustration, la bande des rayonnages a une
  // variation locale de 0,053 quand la notre plafonnait a 0,023, pour une
  // luminance moyenne pourtant identique. Ce n'est donc pas la lumiere qui
  // manquait, c'est l'ecart entre deux dos voisins : douze bruns de meme
  // valeur font une masse, pas une bibliotheque. La palette va desormais du
  // presque noir au parchemin, sans jamais saturer, comme le demande la
  // direction artistique.
  '#141110',
  '#1d1917',
  '#241d18',
  '#2f2a26',
  '#3b3129',
  '#4a3b35',
  '#5c3a38',
  '#6b6a45',
  '#7d5a3a',
  '#8a7250',
  '#a98a5c',
  '#c2a878',
  '#d6c096',
  '#e3d2ac',
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

/**
 * L'usure d'un volume : un facteur applique a sa couleur.
 *
 * Douze teintes ne suffisent pas a rompre l'alignement quand mille neuf cent
 * vingt volumes se suivent : on retrouve la meme couleur tous les douze
 * livres, et l'oeil voit le motif. Ce facteur, tire du meme hachage, decale
 * chaque volume dans sa propre nuance sans changer sa teinte.
 */
export function spineShade(index: number): number {
  return 0.72 + unitOf(index ^ 0x2f1e5ac3) * 0.56 // entre 0,72 et 1,28
}
