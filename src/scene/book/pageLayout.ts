/**
 * Ou tombe chaque caractere sur une page dessinee.
 *
 * Le texte des livres n'est pas affiche par le navigateur : il est DESSINE sur
 * une toile, puis colle sur la page du livre en trois dimensions. C'est la
 * seule facon d'avoir un vrai livre qui s'ouvre plutot qu'un panneau de texte
 * pose par-dessus la scene.
 *
 * Et cela ne telecharge rien : on dessine avec la police a chasse fixe du
 * systeme, comme le reste du site ne charge ni texture ni son.
 *
 * Ce module ne contient que la geometrie du texte, sans toile ni navigateur :
 * c'est la partie qui peut se tromper, donc celle qu'on teste.
 */

import { CHARS_PER_LINE, LINES_PER_PAGE } from '../../core/index.ts'

/** Part de la page laissee en marge, de chaque cote. */
export const MARGIN = 0.085

/**
 * Largeur d'un caractere a chasse fixe, en fraction de sa hauteur.
 *
 * Toutes les polices a chasse fixe usuelles tournent autour de 0,6. On ne la
 * mesure pas : on la choisit, et l'on dimensionne la police pour que
 * quatre-vingts caracteres tiennent a coup sur.
 */
export const CHAR_RATIO = 0.6

export interface PageLayout {
  /** Taille de police a employer, en pixels de toile. */
  readonly fontSize: number
  /** Hauteur d'une ligne, en pixels. */
  readonly lineHeight: number
  /** Abscisse du premier caractere. */
  readonly left: number
  /** Ordonnee de la ligne de base de la premiere ligne. */
  readonly top: number
  /** Largeur reellement occupee par les 80 caracteres. */
  readonly textWidth: number
  /** Hauteur reellement occupee par les 40 lignes. */
  readonly textHeight: number
}

/**
 * Calcule le gabarit pour une toile donnee.
 *
 * La police est dimensionnee par la contrainte la plus SERREE des deux,
 * quatre-vingts caracteres en largeur, quarante lignes en hauteur, puis le
 * bloc est centre. Sans cela, une page un peu large deborderait par le bas.
 */
export function pageLayout(width: number, height: number): PageLayout {
  const usableWidth = width * (1 - 2 * MARGIN)
  const usableHeight = height * (1 - 2 * MARGIN)

  const parLargeur = usableWidth / (CHARS_PER_LINE * CHAR_RATIO)
  // 1,15 : l'interligne d'un texte serre. En dessous, les lignes se touchent.
  const parHauteur = usableHeight / (LINES_PER_PAGE * 1.15)
  const fontSize = Math.min(parLargeur, parHauteur)

  const lineHeight = fontSize * 1.15
  const textWidth = fontSize * CHAR_RATIO * CHARS_PER_LINE
  const textHeight = lineHeight * LINES_PER_PAGE

  return {
    fontSize,
    lineHeight,
    left: (width - textWidth) / 2,
    top: (height - textHeight) / 2 + fontSize,
    textWidth,
    textHeight,
  }
}
