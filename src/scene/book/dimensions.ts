/** Les cotes du livre ouvert, en metres. */

/** Une page. Un in-octavo, tenu a deux mains. */
export const PAGE_WIDTH = 0.155
export const PAGE_HEIGHT = 0.225

/** La couverture deborde legerement de la page, comme sur un vrai livre. */
export const COVER_OVERHANG = 0.006
export const COVER_THICKNESS = 0.007

/** Epaisseur du bloc de pages, de chaque cote. */
export const LEAVES_THICKNESS = 0.014

/** Ou le livre se tient, dans le repere de la camera. */
export const HELD_POSITION: readonly [number, number, number] = [0, -0.085, -0.42]

/** Duree du vol depuis l'etagere, en secondes. */
export const FLIGHT_SECONDS = 1.15
/** Duree de l'ouverture. */
export const OPENING_SECONDS = 0.9
/** Duree du tournage d'une page. */
export const TURN_SECONDS = 0.55
