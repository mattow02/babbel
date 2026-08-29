/**
 * Les constantes du format de Borges.
 *
 * « La Biblioteca de Babel », Ficciones, 1941. Ces nombres sont la contrainte
 * du projet : rien ici ne doit etre modifie sans changer la nouvelle.
 *
 * Voir docs/RECHERCHE.md § 1.
 */

/** 410 pages par livre. */
export const PAGES_PER_BOOK = 410

/** 40 lignes par page. */
export const LINES_PER_PAGE = 40

/** 80 caracteres par ligne. */
export const CHARS_PER_LINE = 80

/** 3 200 caracteres par page. C'est l'unite adressable du projet (decision D2). */
export const CHARS_PER_PAGE = LINES_PER_PAGE * CHARS_PER_LINE

/** 1 312 000 caracteres par livre. */
export const CHARS_PER_BOOK = CHARS_PER_PAGE * PAGES_PER_BOOK

/** 32 volumes par etagere. */
export const VOLUMES_PER_SHELF = 32

/** 5 etageres par mur. */
export const SHELVES_PER_WALL = 5

/** 4 murs porteurs sur 6 : les deux autres sont les couloirs. */
export const WALLS_PER_HEXAGON = 4

/** 640 livres par galerie hexagonale. */
export const BOOKS_PER_HEXAGON = WALLS_PER_HEXAGON * SHELVES_PER_WALL * VOLUMES_PER_SHELF

/** 262 400 pages par galerie. */
export const PAGES_PER_HEXAGON = BOOKS_PER_HEXAGON * PAGES_PER_BOOK
