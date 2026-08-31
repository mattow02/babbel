/**
 * Le grand hall d'accueil, en metres.
 *
 * Ce n'est plus une rotonde traversee par un plan de cinema : c'est une NEF,
 * dans laquelle on marche. Sa forme suit ce que le lieu doit faire ressentir :
 *
 *  - une allee centrale tres longue, pour que le regard file jusqu'au fond et
 *    que le cube reste loin quand on entre ;
 *  - deux files de piliers qui la bordent, parce que rien ne donne l'echelle
 *    comme une colonne qu'on longe et qui defile ;
 *  - deux bas-cotes, plus bas et plus sombres, ou l'on peut s'ecarter ;
 *  - au fond, deux escaliers symetriques qui montent aux tribunes, d'ou l'on
 *    domine la nef avant d'entrer dans la bibliotheque.
 *
 * Le tout tient sous la coupole existante (rayon 46), c'est ce qui borne la
 * longueur de la nef.
 */

/** Rayon utile sous la coupole : au-dela, on touche le mur. */
export const HALL_RADIUS = 43

/** Demi-largeur de l'allee centrale, entre les deux files de piliers. */
export const NAVE_HALF_WIDTH = 9.5

/** L'axe de la nef va du portail (z positif) au fond (z negatif). */
export const NAVE_ENTRY_Z = 41
export const NAVE_END_Z = -37

/** Les piliers : deux files, de part et d'autre de l'allee. */
export const PILLAR_X = 11.6
export const PILLAR_RADIUS = 1.35
export const PILLAR_HEIGHT = 17.5
export const PILLAR_SPACING = 8.2
export const PILLAR_COUNT = 9

/** Les bas-cotes, derriere les piliers. */
export const AISLE_OUTER_X = 24
export const AISLE_CEILING = 9.4

/** Les tribunes : le premier etage des bas-cotes, au fond de la nef. */
export const TRIBUNE_Y = 9.4
export const TRIBUNE_INNER_X = 13.2
export const TRIBUNE_FRONT_Z = -6
export const TRIBUNE_BACK_Z = -36

/** Les deux escaliers qui y montent, un par bas-cote. */
export const STAIR_STEPS = 24
export const STAIR_RISE = TRIBUNE_Y / STAIR_STEPS
export const STAIR_RUN = 0.65
export const STAIR_WIDTH = 6.4
/** Centre lateral d'une volee, et depart de la montee (cote entree). */
export const STAIR_X = 18.2
export const STAIR_FOOT_Z = TRIBUNE_FRONT_Z + STAIR_STEPS * STAIR_RUN

/** Le cube d'or, en levitation au bout de l'allee. */
export const CUBE_SIZE = 5.4
export const CUBE_Y = 12.5
export const CUBE_Z = -22

/** A quelle distance du cube on bascule dans la bibliotheque. */
export const CUBE_REACH = 9

/** Ou l'on se tient en arrivant, juste apres avoir franchi le portail. */
export const SPAWN_Z = NAVE_ENTRY_Z - 2.5

/** Hauteur des yeux. */
export const EYE_HEIGHT = 1.7
