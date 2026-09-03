import { useEffect, useState } from 'react'
import type { Address } from './core/index.ts'
import { useLibraryStore } from './store/useLibraryStore.ts'
import { Galerie } from './vue2d/Galerie.tsx'
import { Seuil } from './vue2d/Seuil.tsx'
import { above, below } from './vue2d/etages.ts'
import { Intro } from './ui/Intro.tsx'
import { Livre } from './ui/Livre.tsx'
import { Search } from './ui/Search.tsx'
import { leafOf, resolveKey } from './ui/navigation.ts'
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

  const stage = useLibraryStore((store) => store.stage)
  const enterLibrary = useLibraryStore((store) => store.enterLibrary)
  const setHexagon = useLibraryStore((store) => store.setHexagon)
  const opened = useLibraryStore((store) => store.opened)
  const open = useLibraryStore((store) => store.open)
  const close = useLibraryStore((store) => store.close)
  const muted = useLibraryStore((store) => store.muted)
  const toggleMuted = useLibraryStore((store) => store.toggleMuted)
  const ambience = useAmbience()

  /*
   * Un livre ouvert montre DEUX pages, donc deux textes.
   *
   * L'adresse partagee, elle, en designe toujours une seule : c'est celle qui
   * decide du feuillet, et elle se lit a gauche quand elle est impaire, a
   * droite sinon. Le surcout est nul, la generation etant en cache et hors du
   * thread de rendu.
   */
  const lu = opened ?? address
  const gauche = usePageText(library, { ...lu, page: leafOf(lu.page) })
  const droite = usePageText(library, { ...lu, page: leafOf(lu.page) + 1 })

  const [recherche, setRecherche] = useState(false)
  const [partage] = useState(() =>
    typeof window === 'undefined' ? null : fromHash(window.location.hash),
  )

  /*
   * Un lien partage ouvre la page tout de suite.
   *
   * C'est le sujet meme du lien : celui qui le recoit veut voir CETTE page, pas
   * visiter un monument. Il n'y a plus d'ecran a franchir pour l'atteindre, et
   * la bibliotheque reste derriere le livre, atteignable en le refermant.
   */
  useEffect(() => {
    setHexagon(address.hexagon)
    library.prefetch([address])
    if (partage) {
      enterLibrary()
      open(partage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /*
   * Le son attend un geste, n'importe lequel.
   *
   * Aucun navigateur n'autorise le son avant que le visiteur n'ait touche la
   * page. C'etait la vraie raison d'etre de l'ecran d'accueil ; comme il n'y en
   * a plus, on ecoute simplement le premier geste, quel qu'il soit.
   */
  useEffect(() => {
    const eveiller = (): void => {
      ambience.start()
    }
    window.addEventListener('pointerdown', eveiller, { once: true })
    window.addEventListener('keydown', eveiller, { once: true })
    return () => {
      window.removeEventListener('pointerdown', eveiller)
      window.removeEventListener('keydown', eveiller)
    }
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

  /*
   * Le dehors, et l'introduction ecrite par-dessus lui.
   *
   * La bibliotheque est deja la, des la premiere image : on n'attend pas
   * derriere un ecran de titre pour la voir. Le texte s'efface tout seul, ou au
   * premier geste, et l'on entre en poussant la porte.
   */
  if (stage === 'seuil') {
    return (
      <div className="shell shell--scene">
        <Seuil onEntrer={enterLibrary} />
        <Intro />
        {panneau}
      </div>
    )
  }

  /*
   * La galerie reste montee sous le livre.
   *
   * On n'a pas quitte la piece pour lire : on y a pris un volume. Le refermer
   * ne recharge donc rien, et le lieu reste visible dans le noir derriere le
   * papier.
   */
  return (
    <div className="shell shell--scene">
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

      {opened ? (
        <Livre
          address={opened}
          gauche={gauche}
          droite={droite}
          onAller={(cible) => {
            open(cible)
          }}
          onFermer={close}
        />
      ) : null}

      {panneau}
      <span className="visuellement-cache" aria-live="polite">
        {muted ? 'son coupé' : ''}
      </span>
    </div>
  )
}
