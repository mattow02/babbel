import { Suspense, lazy, useEffect, useState } from 'react'
import type { Address } from './core/index.ts'
import { hasWebGL } from './scene/webgl.ts'
import { useLibraryStore } from './store/useLibraryStore.ts'
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

/**
 * La 3D n'est chargee que si l'on entre.
 *
 * three.js et sa chaine d'effets pesent l'essentiel du site. Or le cas le plus
 * probable de partage est une URL de LECTURE : c'est ce que produit la
 * recherche, et il serait absurde de faire telecharger toute la machinerie a
 * quelqu'un qui vient lire une page de texte.
 */
const Gallery = lazy(async () => {
  const module = await import('./scene/Gallery.tsx')
  return { default: module.Gallery }
})

/** Ce qu'on montre pendant que la galerie se telecharge. */
function Chargement(): React.ReactElement {
  return (
    <div className="chargement" role="status">
      <span>la bibliothèque s’ouvre…</span>
    </div>
  )
}

export function App(): React.ReactElement {
  const library = useLibrary(ORIGIN)
  const [address, goTo] = useAddress(ORIGIN)
  const state = usePageText(library, address)

  const stage = useLibraryStore((store) => store.stage)
  const begin = useLibraryStore((store) => store.begin)
  const enterLibrary = useLibraryStore((store) => store.enterLibrary)
  const arrive = useLibraryStore((store) => store.arrive)
  const setHexagon = useLibraryStore((store) => store.setHexagon)
  const opened = useLibraryStore((store) => store.opened)
  const open = useLibraryStore((store) => store.open)
  const close = useLibraryStore((store) => store.close)
  const muted = useLibraryStore((store) => store.muted)
  const toggleMuted = useLibraryStore((store) => store.toggleMuted)
  const profile = useLibraryStore((store) => store.profile)
  const ambience = useAmbience()

  const [recherche, setRecherche] = useState(false)
  const troisD = hasWebGL()
  const [lienPartage] = useState(() =>
    typeof window === 'undefined' ? null : fromHash(window.location.hash),
  )
  /** On compare des directions visuelles : le detour par le Seuil n'a pas lieu d'etre. */
  const [comparaison] = useState(() =>
    typeof window === 'undefined'
      ? false
      : new URLSearchParams(window.location.search).has('look'),
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
            /*
             * Sans la sequence, on arrive quand meme DEHORS.
             *
             * Une demande d'animations reduites, ou une machine modeste,
             * supprimait le Seuil entier et deposait le visiteur au milieu
             * des rayonnages : on entrait dans une bibliotheque sans jamais
             * l'avoir vue, ni comprendre ou l'on etait. Ce qu'il faut retirer
             * dans ce cas, c'est le mouvement de camera, pas le lieu. On se
             * tient donc sur le parvis, face au portail, et l'on entre a pied.
             */
            /*
             * Une direction visuelle demandee mene DIRECTEMENT au rayonnage.
             *
             * Les reglages de `?look=` ne touchent que la bibliotheque. Sans
             * ce raccourci, comparer deux variantes obligeait a traverser la
             * sequence d'arrivee, le parvis et la nef a chaque fois : on ne
             * voyait donc que le Seuil, rigoureusement identique dans les cinq
             * cas, et l'on concluait a juste titre que rien n'avait change.
             */
            if (!troisD || comparaison) enterLibrary()
            else if (profile.sequence) begin()
            else arrive()
          }}
        />
        {panneau}
      </>
    )
  }

  /*
   * Sans WebGL, on garde le lecteur de texte : personne n'est prive des livres
   * pour une carte graphique. C'est le seul endroit ou une interface s'affiche
   * par-dessus la page.
   */
  if (!troisD) {
    return (
      <div className="shell">
        <AddressBar address={address} />
        <main className="stage">
          <Reader state={state} />
        </main>
        {panneau}
      </div>
    )
  }

  return (
    <div className="shell shell--gallery">
      <div className="canvas">
        <Suspense fallback={<Chargement />}>
          <Gallery library={library} />
        </Suspense>
      </div>

      {/*
        La seule chose qui s'affiche par-dessus le monde : de quoi refermer le
        livre. Tout le reste, position, performance, aide, a disparu : on ne
        met pas de tableau de bord dans une bibliotheque.
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
