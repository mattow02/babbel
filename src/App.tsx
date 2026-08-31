import { Suspense, lazy, useEffect, useState } from 'react'
import type { Address } from './core/index.ts'
import { hasWebGL } from './scene/webgl.ts'
import { Entry } from './ui/Entry.tsx'
import { useAmbience } from './ui/useAmbience.ts'
import { fromHash } from './ui/route.ts'
import { useLibraryStore } from './store/useLibraryStore.ts'
import { AddressBar } from './ui/AddressBar.tsx'
import { PerfHud } from './ui/PerfHud.tsx'
import { Reader } from './ui/Reader.tsx'
import { Search } from './ui/Search.tsx'
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

/**
 * La 3D n'est chargee que si l'on entre.
 *
 * three.js et sa chaine d'effets pesent l'essentiel du site. Or le cas le plus
 * probable de partage est une URL de LECTURE — c'est ce que produit la
 * recherche — et il serait absurde de faire telecharger toute la machinerie a
 * quelqu'un qui vient lire une page de texte.
 *
 * Le coeur, le worker et le lecteur pesent quelques kilo-octets. Tout le reste
 * attend que le visiteur veuille entrer.
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
  const muted = useLibraryStore((store) => store.muted)
  const toggleMuted = useLibraryStore((store) => store.toggleMuted)
  const ambience = useAmbience()
  const profile = useLibraryStore((store) => store.profile)
  const [recherche, setRecherche] = useState(false)
  // Sans WebGL, il n'y a ni Seuil ni galerie — mais la bibliotheque, elle,
  // reste entierement lisible. On ne prive personne des livres.
  const troisD = hasWebGL()
  // L'URL portait-elle deja une adresse au chargement ? On ne le lit qu'une
  // fois : ensuite, c'est la navigation qui decide.
  const [lienPartage] = useState(() =>
    typeof window === 'undefined' ? null : fromHash(window.location.hash),
  )
  const mode = useLibraryStore((store) => store.mode)
  const setMode = useLibraryStore((store) => store.setMode)
  const opened = useLibraryStore((store) => store.opened)
  const hexagon = useLibraryStore((store) => store.hexagon)
  const setHexagon = useLibraryStore((store) => store.setHexagon)

  // L'URL reste la source de verite : au premier chargement, elle decide dans
  // quelle galerie on se trouve.
  useEffect(() => {
    setHexagon(address.hexagon)
    // Volontairement au montage seulement : ensuite, c'est la marche qui decide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Un volume designe dans la galerie devient l'adresse courante.
  useEffect(() => {
    if (opened) goTo(opened)
  }, [opened, goTo])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (recherche) return
      // « / » ouvre la recherche, ou que l'on soit. C'est le raccourci que
      // tout le monde essaie.
      if (event.key === '/') {
        event.preventDefault()
        setRecherche(true)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMode(mode === 'reader' ? 'gallery' : 'reader')
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
  }, [address, goTo, mode, setMode, recherche])

  const panneau = recherche ? (
    <Search
      library={library}
      onClose={() => {
        setRecherche(false)
      }}
      onFound={(trouve) => {
        goTo(trouve)
        setHexagon(trouve.hexagon)
        // Trouver une phrase interrompt tout le reste : on quitte la sequence
        // d'arrivee s'il le faut, et l'on ouvre la page. C'est ce que le
        // visiteur a demande.
        enterLibrary()
        setMode('reader')
        setRecherche(false)
      }}
    />
  ) : null

  if (stage === 'entry') {
    return (
      <Entry
        onOpenShared={
          lienPartage
            ? () => {
                ambience.start()
                goTo(lienPartage)
                setHexagon(lienPartage.hexagon)
                enterLibrary()
                setMode('reader')
              }
            : undefined
        }
        onEnter={() => {
          // Le geste d'entree fait trois choses d'un coup : il autorise le son,
          // il reveille le worker, et il lance la sequence.
          ambience.start()
          library.prefetch([ORIGIN])
          /*
           * Quand le visiteur demande moins d'animations, on ne lui impose pas
           * trente secondes de travelling : on le pose directement dans la
           * bibliotheque. Le Seuil reste accessible, mais il ne s'impose plus.
           */
          if (profile.sequence && troisD) begin()
          else enterLibrary()
        }}
      />
    )
  }

  if (stage === 'threshold' && troisD) {
    return (
      <div className="shell shell--gallery">
        <div className="canvas">
          <Suspense fallback={<Chargement />}>
            <Gallery />
          </Suspense>
        </div>
        <div className="overlay overlay--seuil">
          <p className="seuil__titre">
            <span>La Bibliothèque</span>
            <span>de Babel</span>
          </p>
          <div className="seuil__actions">
            <button type="button" className="seuil__passer" onClick={toggleMuted}>
              {muted ? 'son coupé' : 'son'}
            </button>
            <button type="button" className="seuil__passer" onClick={enterLibrary}>
              entrer directement
            </button>
          </div>
        </div>
        {panneau}
      </div>
    )
  }

  if (mode === 'gallery' && troisD) {
    return (
      <div className="shell shell--gallery">
        <div className="canvas">
          <Suspense fallback={<Chargement />}>
            <Gallery />
          </Suspense>
        </div>
        <div className="reticle" aria-hidden="true" />
        <div className="overlay">
          <PerfHud hexagon={hexagon} />
          <p className="overlay__hint">
            maintenir le <kbd>clic</kbd> pour avancer · curseur vers les bords pour regarder ·
            <kbd>E</kbd> ou clic bref pour prendre le volume visé · l’escalier change d’étage
            <button type="button" className="overlay__son" onClick={() => { setRecherche(true) }}>
              chercher une phrase
            </button>
            <button type="button" className="overlay__son" onClick={toggleMuted}>
              {muted ? 'son coupé' : 'son'}
            </button>
          </p>
        </div>
        {panneau}
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
        <span>
          <kbd>/</kbd> chercher une phrase
          <button type="button" className="overlay__son" onClick={toggleMuted}>
            {muted ? 'son coupé' : 'son'}
          </button>
        </span>
      </footer>
      {panneau}
    </div>
  )
}
