/**
 * Les dimensions du Seuil, en metres.
 *
 * Le Seuil est une scene AUTHOREE (decision D11) : contrairement a la
 * bibliotheque, elle est unique, finie, et jamais dupliquee. Elle a donc le
 * droit d'etre grande et couteuse : c'est la premiere impression du site.
 *
 * L'echelle vient des images de reference : le dome ecrase le visiteur, les
 * cypres qui le ceinturent font a peine quelques pixels a cote.
 */

/** Le dome : une demi-sphere posee dans un bassin. */
export const DOME_RADIUS = 46

/** Altitude de la base du dome, c'est-a-dire de la terrasse haute. */
export const DOME_BASE_Y = 18

/** Le bassin qui la recoit, evase vers le haut. */
export const BASIN_TOP_RADIUS = 76
export const BASIN_BOTTOM_RADIUS = 44
export const BASIN_HEIGHT = 26

/**
 * L'esplanade : le sol du parvis, devant l'entree.
 *
 * C'est une PLEINE terrasse, et non plus un anneau, parce qu'on y marche
 * desormais. Elle porte le dome, elle recoit le sommet de l'escalier, et elle
 * est assez large pour qu'on puisse s'y retourner et regarder la plaine.
 */
export const ESPLANADE_RADIUS = 76

/** Les deux anneaux de cypres, l'un sur l'esplanade, l'autre en contrebas. */
export const TERRACE_RADII = [70, 80] as const
export const TERRACE_HEIGHTS = [18, 14.28] as const
export const CYPRESS_PER_RING = [88, 104] as const

/**
 * L'ouverture laissee dans les cypres, dans l'axe de l'entree.
 *
 * Sans elle, on arriverait au sommet des marches nez a nez avec un arbre. Le
 * demi-angle est genereux : c'est une allee d'honneur, pas un passage.
 */
export const CYPRESS_GAP = 0.34
export const CYPRESS_HEIGHT = 5.2
export const CYPRESS_RADIUS = 0.95

/** L'escalier unique qui monte a l'entree. */
/*
 * La volee tombe JUSTE sur la terrasse haute : 36 x 0,5 m = 18 m, soit
 * exactement la base du dome. Ce n'est pas de la coquetterie : c'est desormais
 * le visiteur lui-meme qui monte ces marches, et un demi-metre d'ecart entre
 * le sommet de l'escalier et le parvis se verrait immediatement.
 */
export const STAIR_COUNT = 36
export const STAIR_RISE = 0.5
export const STAIR_RUN = 0.9
export const STAIR_WIDTH = 26

/** L'entree unique, au pied du dome, au sommet des marches. */
export const PORTAL_WIDTH = 9
export const PORTAL_HEIGHT = 14
export const PORTAL_Z = 45

/**
 * Les caissons de la coupole.
 *
 * Le hall lui-meme a demenage dans `scene/hall/` le jour ou l'on a cesse de le
 * traverser en cinematique pour y marcher (D52). Il n'en reste ici que le
 * motif des caissons, qui sert encore a coiffer la nef.
 */
export const COFFER_RINGS = 7
export const COFFERS_PER_RING = 30
