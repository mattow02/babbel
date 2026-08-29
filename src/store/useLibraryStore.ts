import { create } from 'zustand'

/**
 * L'etat qui doit vivre HORS de React.
 *
 * C'est la raison d'etre de zustand ici (decision D21) : le releve de
 * performance est produit a chaque image, mais ne doit surtout pas provoquer
 * un rendu React a chaque image. On l'ecrit dans ce store quatre fois par
 * seconde, et seul le composant qui l'affiche se rafraichit.
 */

export type Mode = 'gallery' | 'reader'

export interface Perf {
  readonly fps: number
  readonly calls: number
  readonly triangles: number
}

interface LibraryState {
  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void
  perf: Perf
  setPerf: (perf: Perf) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  mode: 'gallery',
  setMode: (mode) => {
    set({ mode })
  },
  toggleMode: () => {
    set((state) => ({ mode: state.mode === 'gallery' ? 'reader' : 'gallery' }))
  },
  perf: { fps: 0, calls: 0, triangles: 0 },
  setPerf: (perf) => {
    set({ perf })
  },
}))
