import { useLibraryStore } from '../store/useLibraryStore.ts'

/** Raccourcit un numero de galerie, qui compte des milliers de chiffres. */
function shortenGallery(hexagon: bigint): string {
  const name = hexagon.toString(36)
  return name.length <= 18 ? name : `${name.slice(0, 9)}…${name.slice(-6)}`
}

/**
 * Le releve, affiche.
 *
 * Ce composant est le SEUL a se rafraichir quand les chiffres changent, parce
 * qu'il est le seul a s'abonner a `perf`. La scene, elle, ne se rerend jamais.
 */
export function PerfHud({ hexagon }: { hexagon: bigint }): React.ReactElement {
  const perf = useLibraryStore((state) => state.perf)

  return (
    <dl className="perf">
      <div>
        <dt>galerie</dt>
        <dd title={hexagon.toString(36)}>{shortenGallery(hexagon)}</dd>
      </div>
      <div>
        <dt>images/s</dt>
        <dd className={perf.fps >= 55 ? 'perf--bon' : 'perf--faible'}>{perf.fps}</dd>
      </div>
      <div>
        <dt>appels de rendu</dt>
        <dd className={perf.calls <= 100 ? 'perf--bon' : 'perf--faible'}>{perf.calls}</dd>
      </div>
    </dl>
  )
}
