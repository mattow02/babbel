import { useCallback, useEffect, useState } from 'react'
import type { Address } from '../core/index.ts'
import { fromHash, toHash } from './route.ts'

/**
 * L'adresse courante, tenue en phase avec le fragment de l'URL.
 *
 * L'URL est la source de verite : le bouton retour du navigateur fonctionne,
 * et une adresse collee dans la barre ramene exactement la meme page.
 */
export function useAddress(fallback: Address): [Address, (next: Address) => void] {
  const [address, setAddress] = useState<Address>(() => fromHash(window.location.hash) ?? fallback)

  useEffect(() => {
    const onHashChange = (): void => {
      setAddress(fromHash(window.location.hash) ?? fallback)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [fallback])

  const goTo = useCallback((next: Address) => {
    setAddress(next)
    const hash = toHash(next)
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [])

  /*
   * On n'ecrit RIEN dans l'URL tant que le visiteur n'a rien fait.
   *
   * Le lecteur, autrefois, etait tout le site : ecrire l'adresse des le
   * chargement avait alors un sens. Depuis qu'on arrive devant le monument,
   * cela affichait l'adresse d'un livre qu'on n'avait pas ouvert, et le lien
   * qu'on copiait ne designait rien de ce qu'on avait vu. L'URL ne se remplit
   * donc qu'au premier geste, par `goTo`.
   */
  return [address, goTo]
}
