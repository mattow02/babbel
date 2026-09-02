import { useEffect, useState } from 'react'
import { Ambience } from '../audio/ambience.ts'
import { useLibraryStore } from '../store/useLibraryStore.ts'

/**
 * Le son d'ambiance, branche sur l'etat du site.
 *
 * Il ne demarre qu'au geste d'entree : les navigateurs l'exigent, et c'est de
 * toute facon la seule facon polie de faire du son sur le web.
 */
export function useAmbience(): { start: () => void } {

  // Creee une seule fois, hors du rendu : une `ref` lue pendant le rendu
  // n'est pas une facon sure de garder un objet vivant.
  const [ambience] = useState(() => new Ambience())
  const muted = useLibraryStore((state) => state.muted)

  useEffect(() => {
    ambience.setMuted(muted)
  }, [ambience, muted])

  useEffect(
    () => () => {
      void ambience.dispose()
    },
    [ambience],
  )

  return {
    start: () => {
      void ambience.start()
    },
  }
}
