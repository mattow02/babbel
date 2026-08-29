import { useLibraryStore } from '../store/useLibraryStore.ts'
import { BOOKS_PER_HEXAGON } from '../core/index.ts'

/**
 * Le releve, affiche.
 *
 * Ce composant est le SEUL a se rafraichir quand les chiffres changent, parce
 * qu'il est le seul a s'abonner a `perf`. La scene, elle, ne se rerend jamais.
 */
export function PerfHud({ galleries }: { galleries: number }): React.ReactElement {
  const perf = useLibraryStore((state) => state.perf)
  const livres = galleries * BOOKS_PER_HEXAGON

  return (
    <dl className="perf">
      <div>
        <dt>images/s</dt>
        <dd className={perf.fps >= 55 ? 'perf--bon' : 'perf--faible'}>{perf.fps}</dd>
      </div>
      <div>
        <dt>appels de rendu</dt>
        <dd className={perf.calls <= 100 ? 'perf--bon' : 'perf--faible'}>{perf.calls}</dd>
      </div>
      <div>
        <dt>galeries</dt>
        <dd>{galleries}</dd>
      </div>
      <div>
        <dt>volumes</dt>
        <dd>{livres.toLocaleString('fr-FR')}</dd>
      </div>
    </dl>
  )
}
