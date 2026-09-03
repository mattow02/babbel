import { useEffect, useState } from 'react'
import { PAGES_PER_BOOK, toPath, type Address } from '../core/index.ts'
import { columnOf, floorOf } from '../vue2d/etages.ts'
import { Reader } from './Reader.tsx'
import { leafOf, stepPage, turnLeaf } from './navigation.ts'
import type { PageState } from './usePageText.ts'

/** En dessous, deux pages de quatre-vingts colonnes ne tiennent plus cote a cote. */
const ETROIT = '(max-width: 860px)'

/**
 * L'ecran est-il trop etroit pour un livre ouvert ?
 *
 * On n'ouvre alors qu'un feuillet, et l'on tourne une page a la fois. Le
 * dessin ne ment pas : sur un telephone, on ne voit vraiment qu'une page.
 */
function useEtroit(): boolean {
  const [etroit, setEtroit] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(ETROIT).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(ETROIT)
    const suivre = (): void => {
      setEtroit(mq.matches)
    }
    suivre()
    mq.addEventListener('change', suivre)
    return () => {
      mq.removeEventListener('change', suivre)
    }
  }, [])
  return etroit
}

/** Les galeries ont des noms de 2 870 caracteres : on n'en montre que les bouts. */
function abreger(hexagon: bigint): string {
  const nom = hexagon.toString(36)
  return nom.length <= 18 ? nom : `${nom.slice(0, 9)}…${nom.slice(-6)}`
}

/**
 * Le volume, ouvert.
 *
 * Il n'y a plus aucun tableau de bord autour de la lecture : le livre se
 * suffit. Ce qu'une barre d'outils affichait, l'objet le porte lui-meme, la ou
 * un livre le porte : l'adresse est le titre courant du verso, les numeros
 * sont aux angles exterieurs, et l'on tourne la page en cliquant dessus, a
 * droite pour avancer.
 *
 * La galerie reste visible derriere, dans le noir : on n'a pas quitte la
 * piece, on a pris un livre. Cliquer a cote du volume le repose.
 */
export function Livre({
  address,
  gauche,
  droite,
  onAller,
  onFermer,
}: {
  address: Address
  gauche: PageState
  droite: PageState
  onAller: (cible: Address) => void
  onFermer: () => void
}): React.ReactElement {
  const [copie, setCopie] = useState(false)
  const etroit = useEtroit()
  const page = leafOf(address.page)

  // Sur un ecran etroit on tourne une page, sur un livre ouvert un feuillet.
  const tourner = (sens: 1 | -1): void => {
    onAller(etroit ? stepPage(address, sens) : turnLeaf(address, sens))
  }

  /*
   * Sur un livre ouvert, chaque feuillet a son sens : la page de droite avance.
   * Sur un ecran etroit il n'y a qu'un feuillet, alors il se partage : la marge
   * de gauche recule, tout le reste avance, comme un pouce sur un livre de poche.
   */
  const tournerDepuis = (event: React.MouseEvent<HTMLDivElement>, sens: 1 | -1): void => {
    if (!etroit) {
      tourner(sens)
      return
    }
    const boite = event.currentTarget.getBoundingClientRect()
    tourner(event.clientX - boite.left < boite.width * 0.3 ? -1 : 1)
  }

  const copier = async (): Promise<void> => {
    const lien = `${window.location.origin}${window.location.pathname}#/${toPath(address)}`
    try {
      await navigator.clipboard.writeText(lien)
      setCopie(true)
      window.setTimeout(() => {
        setCopie(false)
      }, 1800)
    } catch {
      setCopie(false)
    }
  }

  const titre = [
    `étage ${abreger(floorOf(address.hexagon))}`,
    `galerie ${abreger(columnOf(address.hexagon))}`,
    `mur ${address.wall + 1}`,
    `étagère ${address.shelf + 1}`,
    `volume ${address.volume + 1}`,
  ].join(' · ')

  return (
    <div
      className="livre"
      role="dialog"
      aria-modal="true"
      aria-label={`Volume ouvert : ${titre}`}
      onClick={onFermer}
    >
      <div
        className="livre__objet"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="livre__chant livre__chant--gauche" aria-hidden="true" />

        <div
          className="feuillet feuillet--verso"
          onClick={(event) => {
            tournerDepuis(event, -1)
          }}
        >
          {/*
            Le titre courant EST l'adresse, et le toucher copie le lien. C'est
            la seule commande du lecteur, et elle n'ajoute rien a l'ecran :
            c'est deja ce qui etait imprime la.
          */}
          <button
            type="button"
            className="feuillet__titre"
            onClick={(event) => {
              event.stopPropagation()
              void copier()
            }}
          >
            {copie ? 'adresse copiée' : titre}
          </button>
          <div className="feuillet__texte" key={etroit ? address.page : page}>
            <Reader state={etroit && address.page !== page ? droite : gauche} />
          </div>
          <p className="feuillet__folio">{etroit ? address.page : page}</p>
        </div>

        <div className="livre__gouttiere" aria-hidden="true" />

        <div
          className="feuillet feuillet--recto"
          onClick={(event) => {
            tournerDepuis(event, 1)
          }}
        >
          <p className="feuillet__titre feuillet__titre--recto">{PAGES_PER_BOOK} pages</p>
          <div className="feuillet__texte" key={page + 1}>
            <Reader state={droite} />
          </div>
          <p className="feuillet__folio">{page + 1}</p>
        </div>

        <div className="livre__chant livre__chant--droite" aria-hidden="true" />
      </div>

      {/*
        Deux choses qui ne sont pas un tableau de bord : un mot qui s'efface au
        bout de quelques secondes, et un bouton qui n'apparait qu'au clavier.
        L'un se dit une fois, l'autre n'existe que pour qui ne peut pas cliquer.
      */}
      <p className="livre__souffle">cliquez à côté pour refermer</p>
      <button
        type="button"
        className="livre__refermer"
        onClick={(event) => {
          event.stopPropagation()
          onFermer()
        }}
      >
        refermer le livre
      </button>
    </div>
  )
}
