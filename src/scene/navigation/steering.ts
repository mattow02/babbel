/**
 * Comment la souris oriente le regard.
 *
 * La decision D13 demande un regard qui s'oriente EN CONTINU, un clic maintenu
 * pour avancer, et un clic sur un point d'interet pour declencher un travelling.
 * Ces trois exigences se contredisent si l'on capture le pointeur : sans
 * curseur visible, on ne peut plus viser un livre.
 *
 * D'ou ce schema : le curseur reste visible et sert de reticule. Il ne tourne
 * la tete que lorsqu'il s'approche des BORDS de l'ecran, avec une large zone
 * morte au centre ou l'on ne fait que viser. On garde donc le regard continu,
 * sans capture de pointeur, et le clic reste disponible pour designer.
 *
 * Fonction pure : elle se teste sans navigateur.
 */

/** Vitesse maximale de rotation, en radians par seconde. */
export const MAX_YAW_RATE = 1.9
export const MAX_PITCH_RATE = 1.1

/** Part de l'ecran, au centre, ou le curseur ne fait que viser. */
export const DEAD_ZONE = 0.45

/** Bornes de l'inclinaison verticale, pour ne jamais se retourner. */
export const MIN_PITCH = -0.85
export const MAX_PITCH = 0.85

export interface Rates {
  /** Rotation horizontale, radians par seconde. */
  readonly yaw: number
  /** Rotation verticale, radians par seconde. */
  readonly pitch: number
}

/**
 * Reponse progressive : nulle dans la zone morte, puis quadratique jusqu'au
 * bord. Le quadratique evite l'a-coup au sortir de la zone morte et laisse un
 * bon controle a mi-course.
 */
function response(normalized: number): number {
  const magnitude = Math.abs(normalized)
  if (magnitude <= DEAD_ZONE) return 0
  const t = Math.min(1, (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE))
  return Math.sign(normalized) * t * t
}

/**
 * Vitesses de rotation induites par la position du curseur.
 *
 * @param cursor position du curseur, en pixels dans la fenetre
 * @param size   taille de la fenetre, en pixels
 */
export function steerRates(
  cursor: { x: number; y: number },
  size: { width: number; height: number },
): Rates {
  if (size.width <= 0 || size.height <= 0) return { yaw: 0, pitch: 0 }
  const nx = (cursor.x / size.width) * 2 - 1
  const ny = (cursor.y / size.height) * 2 - 1
  return {
    // Vers la droite de l'ecran, on tourne vers la droite : le lacet decroit.
    yaw: -response(nx) * MAX_YAW_RATE,
    // Vers le haut de l'ecran, on leve les yeux.
    pitch: -response(ny) * MAX_PITCH_RATE,
  }
}

/** Borne l'inclinaison verticale. */
export function clampPitch(pitch: number): number {
  return Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitch))
}
