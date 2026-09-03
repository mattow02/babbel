/**
 * Les deplacements du lecteur, en logique pure.
 *
 * Tout est borne : on ne sort jamais d'un livre par les pages, ni d'une
 * etagere par les volumes. Franchir ces limites releve de la galerie, pas du
 * fait de tourner une page.
 *
 * Depuis que le livre est dessine ouvert, l'unite de deplacement n'est plus la
 * page mais le FEUILLET : on en voit deux a la fois, et une fleche en tourne
 * un. `stepPage` reste la primitive, parce que la recherche et les liens
 * partages, eux, designent bien une page.
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

/**
 * La page de gauche du feuillet qui porte cette page.
 *
 * Les pages vont par deux et la premiere est a gauche : un feuillet commence
 * donc toujours sur un numero impair. Une page paire, celle qu'a pu designer
 * un lien partage, se lit sur le feuillet ouvert a la page precedente.
 */
export function leafOf(page: number): number {
  return page % 2 === 1 ? page : page - 1
}

/** Tourne `delta` feuillets, sans sortir du volume. */
export function turnLeaf(address: Address, delta: number): Address {
  return { ...address, page: clamp(leafOf(address.page) + delta * 2, 1, PAGES_PER_BOOK - 1) }
}

/** Premier ou dernier feuillet du volume. */
export function jumpToEdge(address: Address, edge: 'first' | 'last'): Address {
  return { ...address, page: edge === 'first' ? 1 : PAGES_PER_BOOK - 1 }
}

/** Traduit une touche en deplacement. Rend `null` si la touche ne nous concerne pas. */
export function resolveKey(event: {
  key: string
  shiftKey: boolean
}): ((address: Address) => Address) | null {
  const feuillets = event.shiftKey ? 5 : 1
  switch (event.key) {
    case 'ArrowRight':
      return (address) => turnLeaf(address, feuillets)
    case 'ArrowLeft':
      return (address) => turnLeaf(address, -feuillets)
    case 'PageDown':
      return (address) => turnLeaf(address, 5)
    case 'PageUp':
      return (address) => turnLeaf(address, -5)
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
