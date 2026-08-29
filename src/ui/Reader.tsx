import { toLines, CHARS_PER_LINE, LINES_PER_PAGE } from '../core/index.ts'
import type { PageState } from './usePageText.ts'

/**
 * La page elle-meme : 40 lignes de 80 caracteres, pas une de plus.
 *
 * Pendant l'attente on affiche un bloc de la MEME taille exacte, en creux.
 * Rien ne bouge quand le texte arrive : la mise en page ne saute jamais.
 */
export function Reader({ state }: { state: PageState }): React.ReactElement {
  if (state.failure) {
    return (
      <pre className="page page--failure" role="alert">
        {state.failure}
      </pre>
    )
  }

  const lines = state.text ? toLines(state.text) : null

  return (
    <pre className="page" aria-busy={lines ? undefined : true} aria-label="page du livre">
      {lines
        ? lines.join('\n')
        : Array.from({ length: LINES_PER_PAGE }, () => '·'.repeat(CHARS_PER_LINE)).join('\n')}
    </pre>
  )
}
