import { toLines, CHARS_PER_LINE, LINES_PER_PAGE } from '../core/index.ts'
import type { PageState } from './usePageText.ts'

/** Longueur de l'extrait annonce aux lecteurs d'ecran. */
const EXTRAIT = 60

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
    <>
      {/*
        Ce que la page RACONTE, pour qui ne la voit pas.

        Faire enoncer trois mille deux cents caracteres sans signification
        n'aide personne : le bloc est donc masque aux technologies
        d'assistance, et remplace par ce qu'un lecteur voyant percoit en un
        coup d'oeil — le format, et le debut du texte.
      */}
      <p className="visuellement-cache" role="status">
        {lines
          ? `Page de ${LINES_PER_LINE_TEXTE}. Elle commence par : ${lines[0]?.trimEnd().slice(0, EXTRAIT) || 'du blanc'}.`
          : 'Génération de la page en cours.'}
      </p>

      <pre className="page" aria-hidden="true" aria-busy={lines ? undefined : true}>
        {lines
          ? lines.join('\n')
          : Array.from({ length: LINES_PER_PAGE }, () => '·'.repeat(CHARS_PER_LINE)).join('\n')}
      </pre>
    </>
  )
}

/** « quarante lignes de quatre-vingts caractères », ecrit une fois. */
const LINES_PER_LINE_TEXTE = `${LINES_PER_PAGE} lignes de ${CHARS_PER_LINE} caractères`
