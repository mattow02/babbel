/**
 * Les dimensions physiques d'une galerie, en metres.
 *
 * Borges donne les nombres (4 murs, 5 etageres, 32 volumes) mais aucune
 * mesure. On choisit donc des dimensions plausibles, coherentes entre elles,
 * et on les rassemble ici : aucune constante metrique ne doit apparaitre en
 * dur ailleurs dans la scene.
 *
 * Un indice du texte : « la hauteur des etageres depasse a peine celle d'un
 * bibliothecaire normal ». Les rayonnages sont donc a taille humaine ; la
 * demesure vient de la repetition et des couloirs, pas du gigantisme de la
 * piece.
 */

/** Rayon circonscrit de l'hexagone. Egal a la longueur d'un mur. */
export const HEXAGON_RADIUS = 2.4

/** Distance du centre au milieu d'un mur : R * cos(30 deg). */
export const HEXAGON_APOTHEM = (HEXAGON_RADIUS * Math.sqrt(3)) / 2

/** Hauteur sous plafond. */
export const ROOM_HEIGHT = 3

/** Epaisseur des murs, du sol et du plafond. */
export const WALL_THICKNESS = 0.18

/** Un volume : 5,5 cm d'epaisseur pour 410 pages, 24 cm de haut. */
export const BOOK_WIDTH = 0.055
export const BOOK_HEIGHT = 0.24
export const BOOK_DEPTH = 0.16

/** Part du mur réellement occupee par les livres : on laisse une marge. */
export const SHELF_FILL = 0.9

/** Hauteur du premier rayon, puis pas entre rayons. */
export const SHELF_BASE_Y = 0.34
export const SHELF_SPACING = 0.34
export const SHELF_THICKNESS = 0.025

/** Ouverture d'un couloir. */
export const CORRIDOR_WIDTH = 1.2
export const CORRIDOR_HEIGHT = 2.2
export const CORRIDOR_LENGTH = 1.6

/** Distance entre deux centres de galeries voisines, le long d'un couloir. */
export const GALLERY_PITCH = 2 * HEXAGON_APOTHEM + CORRIDOR_LENGTH

/** La lampe spherique, suspendue au centre. */
export const LAMP_RADIUS = 0.16
export const LAMP_Y = ROOM_HEIGHT - 0.75
