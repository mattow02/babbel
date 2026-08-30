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
export const CORRIDOR_WIDTH = 1.62
export const CORRIDOR_HEIGHT = 2.2

/**
 * Le zaguan : le vestibule qui separe deux galeries.
 *
 * Borges ne relie pas ses salles par un simple trou de souris : « dans le
 * zaguan il y a un miroir... une escalier spirale, qui s'abime et s'eleve vers
 * le lointain ». C'est la, et nulle part ailleurs, que se trouve l'escalier.
 *
 * Nous en faisons une petite salle carree, plus large et plus haute que les
 * passages qui y menent, percee en son centre d'une TREMIE : le sol et le
 * plafond s'ouvrent autour de l'escalier, et l'on voit le puits s'abimer et
 * s'elever. C'est ce qui donne le vertige que la nouvelle decrit.
 *
 * Un anneau de marche fait tout le tour du puits : le passage n'est jamais
 * bouche, ce qui etait impossible tant que l'escalier tenait dans le couloir.
 */
export const PASSAGE_LENGTH = 1.15
export const VESTIBULE_SIZE = 3.6
export const VESTIBULE_HEIGHT = 3
export const STAIRWELL_RADIUS = 0.7

/** Profondeur visible du puits, au-dessus et en dessous du vestibule. */
export const SHAFT_DEPTH = 5.5

/** Longueur totale du chemin d'une galerie a l'autre. */
export const CORRIDOR_LENGTH = 2 * PASSAGE_LENGTH + VESTIBULE_SIZE

/** Distance entre deux centres de galeries voisines, le long d'un couloir. */
export const GALLERY_PITCH = 2 * HEXAGON_APOTHEM + CORRIDOR_LENGTH

/** La lampe spherique, suspendue au centre. */
export const LAMP_RADIUS = 0.16
export const LAMP_Y = ROOM_HEIGHT - 0.75

/** L'escalier en colimacon du zaguan : « qui s'abime et s'eleve vers le lointain ». */
export const STAIR_RADIUS = 0.5
export const STAIR_STEPS = 34
export const STAIR_RISE = 0.2
export const STAIR_TREAD_WIDTH = 0.52
export const STAIR_TREAD_THICKNESS = 0.055
