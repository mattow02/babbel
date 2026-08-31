/**
 * Le calcul du piege a focus, isole de tout DOM.
 *
 * Le reste — trouver les elements focalisables, poser les ecouteurs — est de
 * la plomberie ; ce qui peut se tromper, c'est le choix de l'element suivant
 * aux extremites. C'est donc cela qu'on isole et qu'on teste.
 */

/**
 * Indice de l'element a focaliser ensuite, en bouclant.
 *
 * @param index    element focalise aujourd'hui, ou -1 si aucun ne l'est
 * @param count    nombre d'elements focalisables
 * @param backwards vrai pour Maj+Tab
 */
export function cycleIndex(index: number, count: number, backwards: boolean): number {
  if (count <= 0) return -1
  // Aucun element focalise : on entre par le debut, ou par la fin en arriere.
  if (index < 0 || index >= count) return backwards ? count - 1 : 0
  const suivant = backwards ? index - 1 : index + 1
  // Le modulo de JavaScript garde le signe : on le remet dans les clous.
  return ((suivant % count) + count) % count
}

/** Les selecteurs de ce qui peut recevoir le focus, hors elements desactives. */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')
