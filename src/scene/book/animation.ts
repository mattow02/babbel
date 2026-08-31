/**
 * Les courbes du livre : quand il vole, quand il s'ouvre, quand il se tourne.
 *
 * Fonctions pures, sans three.js. Ce sont elles qui donnent au geste son poids
 * — un livre qui arrive a vitesse constante puis s'arrete net n'a l'air de
 * rien — et ce sont elles qu'on peut verifier.
 */

/**
 * Adoucit le depart ET l'arrivee.
 *
 * Le livre part lentement de l'etagere, prend de la vitesse, puis se pose.
 */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
}

/**
 * Une arrivee qui depasse legerement, puis revient.
 *
 * C'est ce petit depassement qui fait qu'un objet semble avoir une masse au
 * lieu de glisser sur des rails.
 */
export function easeOutBack(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  const c = 1.24
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
}

/** Une arrivee simplement freinee, sans depassement. */
export function easeOut(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

/**
 * L'angle d'une couverture pendant l'ouverture.
 *
 * Fermee, la couverture gauche est rabattue sur la droite : une demi-tour.
 * Ouverte, les deux moities sont a plat.
 */
export function coverAngle(progress: number): number {
  return Math.PI * (1 - easeInOut(progress))
}

/**
 * L'instant ou la page qui se tourne masque ce qu'il y a dessous.
 *
 * On echange les textures a ce moment precis : avant, on verrait la page
 * changer sous nos yeux ; apres, on aurait un temps mort.
 */
export const TURN_SWAP_AT = 0.5

/** L'angle de la page en train de se tourner, de la droite vers la gauche. */
export function turnAngle(progress: number, backwards: boolean): number {
  const t = easeInOut(progress)
  return backwards ? Math.PI * (1 - t) : Math.PI * t
}

/**
 * La respiration du livre tenu en main.
 *
 * Un objet parfaitement immobile devant la camera n'a pas l'air tenu, il a
 * l'air colle a l'ecran. Une derive tres lente et non periodique suffit a le
 * rendre vivant.
 */
export function breathe(time: number): { x: number; y: number; roll: number } {
  return {
    x: Math.sin(time * 0.43) * 0.0016 + Math.sin(time * 0.191) * 0.0011,
    y: Math.sin(time * 0.31 + 1.7) * 0.0019,
    roll: Math.sin(time * 0.237 + 0.6) * 0.0042,
  }
}
