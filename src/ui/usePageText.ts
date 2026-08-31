import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { locationOf, type Address } from '../core/index.ts'
import { readingNeighbourhood, type PageLibrary } from '../workers/index.ts'

export interface PageState {
  readonly text: string | null
  readonly failure: string | null
}

/**
 * Le texte de la page demandee.
 *
 * L'etat n'est PAS recopie depuis le cache : il en est LU, par abonnement.
 * Une page deja generee s'affiche donc dans le rendu meme ou elle est
 * demandee — sans clignotement, et sans le rendu en cascade qu'imposerait un
 * `setState` dans un effet.
 *
 * On passe par `useSyncExternalStore` plutot que par un simple appel pendant
 * le rendu : le cache est un etat mutable exterieur a React, et le lire
 * directement ne resisterait pas a un rendu interrompu puis repris. C'est
 * exactement ce a quoi sert cette API.
 *
 * L'effet, lui, ne fait que ce pour quoi les effets existent : parler a un
 * systeme exterieur — demander la generation, precharger les voisines.
 */
export function usePageText(library: PageLibrary, address: Address): PageState {
  /*
   * On compare les adresses par VALEUR, jamais par reference.
   *
   * Le numero d'emplacement identifie une page sans ambiguite, et deux BigInt
   * egaux le sont pour `===`. Se fier a l'identite de l'objet rendrait ce hook
   * dependant de la discipline de son appelant : un parent qui reconstruit
   * l'adresse a chaque rendu ferait disparaitre les erreurs — et relancerait
   * l'effet en boucle, donc la generation.
   */
  const key = locationOf(address)

  const [echec, setEchec] = useState<{ key: bigint; message: string } | null>(null)

  const subscribe = useCallback(
    (listener: () => void) => library.subscribe(listener),
    [library],
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifie `address`
  const getSnapshot = useCallback(() => library.peek(address) ?? null, [library, key])

  const text = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    let cancelled = false
    library
      .read(address)
      .catch((cause: unknown) => {
        if (!cancelled) {
          setEchec({ key, message: cause instanceof Error ? cause.message : String(cause) })
        }
      })
    library.prefetch(readingNeighbourhood(address))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifie `address`
  }, [library, key])

  return { text, failure: echec && echec.key === key ? echec.message : null }
}
