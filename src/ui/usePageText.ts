import { useEffect, useState } from 'react'
import type { Address } from '../core/index.ts'
import { readingNeighbourhood, type PageLibrary } from '../workers/index.ts'

export interface PageState {
  readonly text: string | null
  readonly failure: string | null
}

interface Settled {
  readonly address: Address
  readonly text: string | null
  readonly failure: string | null
}

/**
 * Le texte de la page demandee.
 *
 * L'etat n'est PAS recopie depuis le cache : il est lu pendant le rendu, par
 * `peek`. Une page deja generee s'affiche donc dans le rendu meme ou elle est
 * demandee — sans clignotement, et sans le rendu en cascade qu'imposerait un
 * `setState` dans un effet.
 *
 * L'effet ne sert qu'a ce pour quoi les effets existent : parler a un systeme
 * exterieur. Ici, demander la generation et precharger les voisines.
 */
export function usePageText(library: PageLibrary, address: Address): PageState {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    let cancelled = false
    library
      .read(address)
      .then((text) => {
        if (!cancelled) setSettled({ address, text, failure: null })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setSettled({
            address,
            text: null,
            failure: cause instanceof Error ? cause.message : String(cause),
          })
        }
      })
    library.prefetch(readingNeighbourhood(address))
    return () => {
      cancelled = true
    }
  }, [library, address])

  const cached = library.peek(address)
  if (cached !== undefined) return { text: cached, failure: null }
  if (settled && settled.address === address) {
    return { text: settled.text, failure: settled.failure }
  }
  return { text: null, failure: null }
}
