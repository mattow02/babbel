import { useEffect } from 'react'
import type { Address } from './core/index.ts'
import { AddressBar } from './ui/AddressBar.tsx'
import { Reader } from './ui/Reader.tsx'
import { resolveKey } from './ui/navigation.ts'
import { useAddress } from './ui/useAddress.ts'
import { useLibrary } from './ui/useLibrary.ts'
import { usePageText } from './ui/usePageText.ts'

/**
 * Le seuil de la bibliotheque, en attendant le vrai.
 *
 * On entre par la toute premiere page du tout premier volume de la toute
 * premiere galerie. Elle ne veut rien dire, evidemment : c'est le sujet.
 */
const ORIGIN: Address = { hexagon: 0n, wall: 0, shelf: 0, volume: 0, page: 1 }

export function App(): React.ReactElement {
  const library = useLibrary(ORIGIN)
  const [address, goTo] = useAddress(ORIGIN)
  const state = usePageText(library, address)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const move = resolveKey(event)
      if (!move) return
      event.preventDefault()
      goTo(move(address))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [address, goTo])

  return (
    <div className="shell">
      <AddressBar address={address} />
      <main className="stage">
        <Reader state={state} />
      </main>
      <footer className="hints">
        <span><kbd>←</kbd><kbd>→</kbd> tourner la page</span>
        <span><kbd>Maj</kbd> + flèches, ou <kbd>Pg↑</kbd><kbd>Pg↓</kbd> dix pages</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> volume voisin</span>
        <span><kbd>Début</kbd><kbd>Fin</kbd> bords du volume</span>
      </footer>
    </div>
  )
}
