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
 * `entry`     : l'ecran d'entree. Il existe pour une raison technique autant
 *               qu'esthetique : aucun navigateur n'autorise le son avant un
 *               geste du visiteur, et c'est aussi le moment ou l'on reveille
 *               le worker de generation.
 * `threshold` : la sequence d'arrivee (le Seuil, decision D11). Elle
 *               s'interrompt DEVANT l'entree, elle ne la franchit pas.
 * `parvis`    : le visiteur a repris la main, dehors, face au portail. C'est
 *               lui qui decide d'entrer, et c'est tout le sujet du lieu.
 * `hall`      : la nef d'accueil, ou l'on marche jusqu'au cube.
 * `library`   : la bibliotheque infinie, ou l'on marche et l'on lit.
 */
export type Stage = 'entry' | 'seuil' | 'library'

interface LibraryState {
  stage: Stage
  /** On pousse la porte : le Seuil, dessine. */
  begin: () => void
  enterLibrary: () => void

  muted: boolean
  toggleMuted: () => void

  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void

  /** Galerie ou se trouve le visiteur. Origine flottante : voir navigation/geometry.ts. */
  hexagon: bigint
  shiftHexagon: (delta: number) => void
  setHexagon: (hexagon: bigint) => void

  /** Le volume que le visiteur tient en main, s'il y en a un. */
  opened: Address | null
  open: (address: Address) => void
  close: () => void

}

export const useLibraryStore = create<LibraryState>((set) => ({
  stage: 'entry',
  begin: () => {
    set({ stage: 'seuil' })
  },
  enterLibrary: () => {
    set({ stage: 'library' })
  },

  muted: false,
  toggleMuted: () => {
    set((state) => ({ muted: !state.muted }))
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
    set({ opened: address })
  },
  close: () => {
    set({ opened: null })
  },

}))
