/**
 * Les dimensions du Seuil, en metres.
 *
 * Le Seuil est une scene AUTHOREE (decision D11) : contrairement a la
 * bibliotheque, elle est unique, finie, et jamais dupliquee. Elle a donc le
 * droit d'etre grande et couteuse — c'est la premiere impression du site.
 *
 * L'echelle vient des images de reference : le dome ecrase le visiteur, les
 * cypres qui le ceinturent font a peine quelques pixels a cote.
 */

/** Le dome : une demi-sphere posee dans un bassin. */
export const DOME_RADIUS = 46

/** Altitude de la base du dome, c'est-a-dire de la terrasse haute. */
export const DOME_BASE_Y = 18

/** Le bassin qui la recoit, evase vers le haut. */
export const BASIN_TOP_RADIUS = 61
export const BASIN_BOTTOM_RADIUS = 44
export const BASIN_HEIGHT = 26

/** Les deux terrasses annulaires plantees de cypres. */
export const TERRACE_RADII = [52, 60] as const
export const TERRACE_HEIGHTS = [18, 14.28] as const
export const CYPRESS_PER_RING = [70, 84] as const
export const CYPRESS_HEIGHT = 5.2
export const CYPRESS_RADIUS = 0.95

/** L'escalier unique qui monte a l'entree. */
export const STAIR_COUNT = 34
export const STAIR_RISE = 0.42
export const STAIR_RUN = 0.9
export const STAIR_WIDTH = 26

/** L'entree unique, au pied du dome, au sommet des marches. */
export const PORTAL_WIDTH = 9
export const PORTAL_HEIGHT = 14
export const PORTAL_Z = 45

/** Le grand hall, derriere l'entree. */
export const ATRIUM_RADIUS = 34
export const ATRIUM_WALL_HEIGHT = 19
export const ATRIUM_COLUMNS = 28
export const COFFER_RINGS = 7
export const COFFERS_PER_RING = 30

/** Le cube d'or, en levitation au centre du hall. */
export const CUBE_SIZE = 5.4
export const CUBE_Y = 11
