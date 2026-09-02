import { useEffect, useState } from 'react'
import type { Address } from './core/index.ts'
import { useLibraryStore } from './store/useLibraryStore.ts'
import { Galerie } from './vue2d/Galerie.tsx'
import { Seuil } from './vue2d/Seuil.tsx'
import { above, below } from './vue2d/etages.ts'
import { AddressBar } from './ui/AddressBar.tsx'
import { Entry } from './ui/Entry.tsx'
import { Reader } from './ui/Reader.tsx'
import { Search } from './ui/Search.tsx'
import { resolveKey } from './ui/navigation.ts'
import { fromHash } from './ui/route.ts'
import { useAddress } from './ui/useAddress.ts'
import { useAmbience } from './ui/useAmbience.ts'
import { useLibrary } from './ui/useLibrary.ts'
import { usePageText } from './ui/usePageText.ts'

/**
 * Le seuil de la bibliotheque.
 *
 * On entre par la toute premiere page du tout premier volume de la toute
 * premiere galerie. Elle ne veut rien dire, evidemment : c'est le sujet.
 */
const ORIGIN: Address = { hexagon: 0n, wall: 0, shelf: 0, volume: 0, page: 1 }

export function App(): React.ReactElement {
  const library = useLibrary(ORIGIN)
  const [address, goTo] = useAddress(ORIGIN)
  const state = usePageText(library, address)

  const stage = useLibraryStore((store) => store.stage)
  const begin = useLibraryStore((store) => store.begin)
  const enterLibrary = useLibraryStore((store) => store.enterLibrary)
  const setHexagon = useLibraryStore((store) => store.setHexagon)
  const opened = useLibraryStore((store) => store.opened)
  const open = useLibraryStore((store) => store.open)
  const close = useLibraryStore((store) => store.close)
  const muted = useLibraryStore((store) => store.muted)
  const toggleMuted = useLibraryStore((store) => store.toggleMuted)
  const ambience = useAmbience()

  const [recherche, setRecherche] = useState(false)
  const [lienPartage] = useState(() =>
    typeof window === 'undefined' ? null : fromHash(window.location.hash),
  )

  // L'URL reste la source de verite : au premier chargement, elle decide dans
  // quelle galerie on se trouve.
  useEffect(() => {
    setHexagon(address.hexagon)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Le volume tenu en main devient l'adresse courante, donc l'URL partageable.
  useEffect(() => {
    if (opened) goTo(opened)
  }, [opened, goTo])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (recherche) return

      if (event.key === '/') {
        event.preventDefault()
        setRecherche(true)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        if (opened) close()
        return
      }
      if (event.key === 'm') {
        toggleMuted()
        return
      }
      // Les fleches tournent les pages du livre ouvert.
      if (!opened) return
      const move = resolveKey(event)
      if (!move) return
      event.preventDefault()
      open(move(opened))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [opened, open, close, recherche, toggleMuted])

  /**
   * La recherche.
   *
   * Elle n'a AUCUN bouton a l'ecran : le site doit avoir l'air d'un lieu, pas
   * d'une application. On l'ouvre avec « / », comme partout ailleurs.
   */
  const panneau = recherche ? (
    <Search
      library={library}
      onClose={() => {
        setRecherche(false)
      }}
      onFound={(trouve) => {
        goTo(trouve)
        setHexagon(trouve.hexagon)
        enterLibrary()
        open(trouve)
        setRecherche(false)
      }}
    />
  ) : null

  if (stage === 'entry') {
    return (
      <>
        <Entry
          onOpenShared={
            lienPartage
              ? () => {
                  ambience.start()
                  goTo(lienPartage)
                  setHexagon(lienPartage.hexagon)
                  enterLibrary()
                  open(lienPartage)
                }
              : undefined
          }
          onEnter={() => {
            ambience.start()
            library.prefetch([ORIGIN])
            begin()
          }}
        />
        {panneau}
      </>
    )
  }

  if (stage === 'seuil') {
    return (
      <div className="shell shell--scene">
        <Seuil onEntrer={enterLibrary} />
        {panneau}
      </div>
    )
  }

  return (
    <div className="shell shell--scene">
      {opened ? (
        <div className="lecture">
          <AddressBar address={address} />
          <main className="stage">
            <Reader state={state} />
          </main>
        </div>
      ) : (
        <Galerie
          hexagon={address.hexagon}
          onOuvrir={(cible) => {
            open(cible)
          }}
          onZaguan={() => {
            const suivante = address.hexagon + 1n
            setHexagon(suivante)
            goTo({ ...address, hexagon: suivante, wall: 0, shelf: 0, volume: 0, page: 1 })
          }}
          onEtage={(sens) => {
            const cible = sens === 1 ? above(address.hexagon) : below(address.hexagon)
            if (cible === null) return
            setHexagon(cible)
            goTo({ ...address, hexagon: cible, wall: 0, shelf: 0, volume: 0, page: 1 })
          }}
        />
      )}

      {/*
        La seule chose qui s'affiche par-dessus le lieu : de quoi refermer le
        livre. On ne met pas de tableau de bord dans une bibliotheque.
      */}
      {opened ? (
        <button type="button" className="fermer" onClick={close} aria-label="Fermer le livre">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5 19 19M19 5 5 19" />
          </svg>
        </button>
      ) : null}

      {panneau}
      <span className="visuellement-cache" aria-live="polite">
        {muted ? 'son coupé' : ''}
      </span>
    </div>
  )
}
