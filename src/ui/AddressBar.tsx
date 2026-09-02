import { useState } from 'react'
import { PAGES_PER_BOOK, toPath, type Address } from '../core/index.ts'
import { columnOf, floorOf } from '../vue2d/etages.ts'

/** Les galeries ont des noms de 2 870 caracteres : on n'en montre que les bouts. */
function shortenGallery(hexagon: bigint): string {
  const name = hexagon.toString(36)
  return name.length <= 24 ? name : `${name.slice(0, 12)}…${name.slice(-8)}`
}

export function AddressBar({ address }: { address: Address }): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    const url = `${window.location.origin}${window.location.pathname}#/${toPath(address)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className="address">
      <dl className="address__coords">
        <div>
          <dt>étage</dt>
          <dd>{shortenGallery(floorOf(address.hexagon))}</dd>
        </div>
        <div>
          <dt>galerie</dt>
          <dd title={address.hexagon.toString(36)}>{shortenGallery(columnOf(address.hexagon))}</dd>
        </div>
        <div>
          <dt>mur</dt>
          <dd>{address.wall + 1}<span className="address__of"> / 4</span></dd>
        </div>
        <div>
          <dt>étagère</dt>
          <dd>{address.shelf + 1}<span className="address__of"> / 5</span></dd>
        </div>
        <div>
          <dt>volume</dt>
          <dd>{address.volume + 1}<span className="address__of"> / 32</span></dd>
        </div>
        <div className="address__page">
          <dt>page</dt>
          <dd>{address.page}<span className="address__of"> / {PAGES_PER_BOOK}</span></dd>
        </div>
      </dl>
      <button type="button" className="address__copy" onClick={() => void copy()}>
        {copied ? 'adresse copiée' : "copier l'adresse"}
      </button>
    </header>
  )
}
