import { useEffect, useState } from 'react'
import { PageLibrary } from '../workers/index.ts'
import type { Address } from '../core/index.ts'

/**
 * Une seule bibliotheque pour toute la duree de vie de l'application.
 *
 * Elle est reveillee des le montage : le demarrage du worker coute environ
 * 60 ms (chargement et compilation du module), et il vaut mieux les payer
 * pendant que le visiteur regarde l'ecran d'entree que lorsqu'il tourne sa
 * premiere page. C'est le point releve a la fin de la phase 2.
 */
export function useLibrary(warmUpAt: Address): PageLibrary {

  // Creee une seule fois, hors du rendu.
  const [library] = useState(() => new PageLibrary())

  useEffect(() => {
    library.prefetch([warmUpAt])
    return () => {
      library.dispose()
    }
    // Volontairement monte une seule fois : la bibliotheque survit aux rendus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return library
}
