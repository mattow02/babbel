import { create } from 'zustand'
import type { Address } from '../core/index.ts'

/**
 * L'etat qui doit vivre HORS de React.
 *
 * La galerie courante change quand le visiteur franchit une porte. C'est rare,
 * mais cela doit etre lisible par toute l'application, et cela ne doit pas
 * dependre du composant qui se trouve monte a cet instant.
 */

/**
 * Ou en est le visiteur dans le site.
 *
 * `seuil`   : le dehors, au soleil rasant. C'est la premiere image du site :
 *             il n'y a plus de page d'accueil, on arrive devant la porte.
 * `library` : la bibliotheque infinie, ou l'on lit.
 *
 * Un seul geste entre les deux : pousser la porte. Il y a eu un hall entre
 * les deux, un sas ou l'on ne faisait que regarder ; il a ete retire. La
 * bibliotheque est l'univers, et un vestibule de monument la faisait passer
 * pour un batiment qu'on visite.
 */
export type Stage = 'seuil' | 'library'

interface LibraryState {
  stage: Stage
  enterLibrary: () => void

  muted: boolean
  toggleMuted: () => void

  /** Galerie ou se trouve le visiteur. */
  hexagon: bigint
  shiftHexagon: (delta: number) => void
  setHexagon: (hexagon: bigint) => void

  /** Le volume que le visiteur tient en main, s'il y en a un. */
  opened: Address | null
  open: (address: Address) => void
  close: () => void

}

export const useLibraryStore = create<LibraryState>((set) => ({
  stage: 'seuil',
  enterLibrary: () => {
    set({ stage: 'library' })
  },

  muted: false,
  toggleMuted: () => {
    set((state) => ({ muted: !state.muted }))
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
    set({ opened: address })
  },
  close: () => {
    set({ opened: null })
  },

}))
