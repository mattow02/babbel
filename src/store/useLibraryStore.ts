import { create } from 'zustand'
import type { Address } from '../core/index.ts'

/**
 * L'etat qui doit vivre HORS de React.
 *
 * Deux raisons, et elles sont differentes :
 *
 *  - le releve de performance est produit a chaque image, mais ne doit
 *    surtout pas provoquer un rendu React a chaque image. On l'ecrit quatre
 *    fois par seconde, et seul le composant qui l'affiche se rafraichit ;
 *  - la galerie courante change quand le visiteur franchit un couloir. C'est
 *    rare, mais cela doit etre lisible par toute l'application.
 *
 * La POSITION du visiteur, elle, n'est volontairement pas ici : elle change a
 * chaque image et ne concerne que la boucle de rendu. Elle vit dans une `ref`.
 */

export type Mode = 'gallery' | 'reader'

/**
 * Ou en est le visiteur dans le site.
 *
 * `threshold` : la sequence d'arrivee (le Seuil, decision D11).
 * `library`   : la bibliotheque infinie, ou l'on marche et l'on lit.
 */
export type Stage = 'threshold' | 'library'

export interface Perf {
  readonly fps: number
  readonly calls: number
  readonly triangles: number
}

interface LibraryState {
  stage: Stage
  enterLibrary: () => void

  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void

  /** Galerie ou se trouve le visiteur. Origine flottante : voir navigation/geometry.ts. */
  hexagon: bigint
  shiftHexagon: (delta: number) => void
  setHexagon: (hexagon: bigint) => void

  /** Le volume que le visiteur vient d'ouvrir, s'il y en a un. */
  opened: Address | null
  open: (address: Address) => void

  perf: Perf
  setPerf: (perf: Perf) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  stage: 'threshold',
  enterLibrary: () => {
    set({ stage: 'library' })
  },

  mode: 'gallery',
  setMode: (mode) => {
    set({ mode })
  },
  toggleMode: () => {
    set((state) => ({ mode: state.mode === 'gallery' ? 'reader' : 'gallery' }))
  },

  hexagon: 0n,
  shiftHexagon: (delta) => {
    set((state) => {
      const next = state.hexagon + BigInt(delta)
      // La bibliotheque est immense mais finie : on ne sort pas par les bords.
      return { hexagon: next < 0n ? 0n : next }
    })
  },
  setHexagon: (hexagon) => {
    set({ hexagon })
  },

  opened: null,
  open: (address) => {
    set({ opened: address, mode: 'reader' })
  },

  perf: { fps: 0, calls: 0, triangles: 0 },
  setPerf: (perf) => {
    set({ perf })
  },
}))
