import { useEffect } from 'react'
import type { Address } from './core/index.ts'
import { Gallery } from './scene/Gallery.tsx'
import { useLibraryStore } from './store/useLibraryStore.ts'
import { AddressBar } from './ui/AddressBar.tsx'
import { PerfHud } from './ui/PerfHud.tsx'
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

/** Profondeur de galeries visibles de part et d'autre. 1 => trois galeries. */
const DEPTH = 1
const GALLERIES = DEPTH * 2 + 1

export function App(): React.ReactElement {
  const library = useLibrary(ORIGIN)
  const [address, goTo] = useAddress(ORIGIN)
  const state = usePageText(library, address)
  const mode = useLibraryStore((store) => store.mode)
  const toggleMode = useLibraryStore((store) => store.toggleMode)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Escape') {
        event.preventDefault()
        toggleMode()
        return
      }
      if (mode !== 'reader') return
      const move = resolveKey(event)
      if (!move) return
      event.preventDefault()
      goTo(move(address))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [address, goTo, mode, toggleMode])

  if (mode === 'gallery') {
    return (
      <div className="shell shell--gallery">
        <div className="canvas">
          <Gallery />
        </div>
        <div className="overlay">
          <PerfHud galleries={GALLERIES} />
          <p className="overlay__hint">
            <kbd>Échap</kbd> ouvrir un livre · glisser pour regarder · molette pour approcher
          </p>
        </div>
      </div>
    )
  }

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
        <span><kbd>Échap</kbd> retour à la galerie</span>
      </footer>
    </div>
  )
}
