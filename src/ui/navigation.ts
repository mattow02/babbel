/**
 * Les deplacements du lecteur, en logique pure.
 *
 * Tout est borne : on ne sort jamais d'un livre par les pages, ni d'une
 * etagere par les volumes. Franchir ces limites releve de la navigation dans
 * la galerie, qui viendra avec la 3D, pas du fait de tourner une page.
 */

import { PAGES_PER_BOOK, VOLUMES_PER_SHELF, type Address } from '../core/index.ts'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Avance ou recule de `delta` pages, sans sortir du volume. */
export function stepPage(address: Address, delta: number): Address {
  return { ...address, page: clamp(address.page + delta, 1, PAGES_PER_BOOK) }
}

/** Passe au volume voisin sur l'etagere, en revenant a la premiere page. */
export function stepVolume(address: Address, delta: number): Address {
  const volume = clamp(address.volume + delta, 0, VOLUMES_PER_SHELF - 1)
  return volume === address.volume ? address : { ...address, volume, page: 1 }
}

/** Premiere ou derniere page du volume. */
export function jumpToEdge(address: Address, edge: 'first' | 'last'): Address {
  return { ...address, page: edge === 'first' ? 1 : PAGES_PER_BOOK }
}

/** Traduit une touche en deplacement. Rend `null` si la touche ne nous concerne pas. */
export function resolveKey(event: {
  key: string
  shiftKey: boolean
}): ((address: Address) => Address) | null {
  const big = event.shiftKey ? 10 : 1
  switch (event.key) {
    case 'ArrowRight':
      return (address) => stepPage(address, big)
    case 'ArrowLeft':
      return (address) => stepPage(address, -big)
    case 'PageDown':
      return (address) => stepPage(address, 10)
    case 'PageUp':
      return (address) => stepPage(address, -10)
    case 'Home':
      return (address) => jumpToEdge(address, 'first')
    case 'End':
      return (address) => jumpToEdge(address, 'last')
    case 'ArrowDown':
      return (address) => stepVolume(address, 1)
    case 'ArrowUp':
      return (address) => stepVolume(address, -1)
    default:
      return null
  }
}
