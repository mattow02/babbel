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

  // Au premier rendu, l'URL peut etre vide : on l'ecrit sans creer d'entree
  // d'historique, pour que l'adresse soit toujours copiable.
  useEffect(() => {
    if (window.location.hash === '') {
      window.history.replaceState(null, '', toHash(address))
    }
  }, [address])

  return [address, goTo]
}
