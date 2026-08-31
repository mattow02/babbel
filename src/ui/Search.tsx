import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from './useFocusTrap.ts'
import { CHARS_PER_PAGE, type Address } from '../core/index.ts'
import type { PageLibrary } from '../workers/index.ts'
import { transcribe } from './transcribe.ts'

/**
 * Chercher une phrase dans la bibliotheque.
 *
 * Le mot « chercher » est trompeur, et c'est tout l'interet : rien n'est
 * parcouru. L'adresse est CALCULEE, en moins d'une milliseconde, par le sens
 * inverse de la bijection (decision D14). Quelle que soit la phrase — un vers,
 * votre nom, une chose que personne n'a jamais ecrite — elle est quelque part,
 * et l'on sait exactement ou.
 *
 * Le calcul passe par le worker, comme tout le reste.
 */
export function Search({
  library,
  onFound,
  onClose,
}: {
  library: PageLibrary
  onFound: (address: Address) => void
  onClose: () => void
}): React.ReactElement {
  const [saisie, setSaisie] = useState('')
  const [cherche, setCherche] = useState(false)
  const [echec, setEchec] = useState<string | null>(null)
  const champ = useRef<HTMLInputElement>(null)
  const panneau = useRef<HTMLDivElement>(null)

  // On annonce `aria-modal` : on doit donc vraiment tenir le focus.
  useFocusTrap(panneau)

  useEffect(() => {
    champ.current?.focus()
  }, [])

  const transcription = transcribe(saisie, CHARS_PER_PAGE)
  const pret = transcription.text.trim().length > 0

  const chercher = async (): Promise<void> => {
    if (!pret || cherche) return
    setCherche(true)
    setEchec(null)
    try {
      onFound(await library.locate(transcription.text))
    } catch (cause) {
      setEchec(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setCherche(false)
    }
  }

  return (
    <div
      ref={panneau}
      className="recherche"
      role="dialog"
      aria-modal="true"
      aria-label="Chercher une phrase dans la bibliothèque"
    >
      <form
        className="recherche__panneau"
        onSubmit={(event) => {
          event.preventDefault()
          void chercher()
        }}
      >
        <label className="recherche__label" htmlFor="recherche-champ">
          Écrivez une phrase. Elle est forcément quelque part.
        </label>
        <input
          id="recherche-champ"
          ref={champ}
          className="recherche__champ"
          type="text"
          value={saisie}
          spellCheck={false}
          autoComplete="off"
          placeholder="la bibliotheque est totale"
          onChange={(event) => {
            setSaisie(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              onClose()
            }
            event.stopPropagation()
          }}
        />

        {transcription.text !== saisie.toLowerCase() && transcription.text.length > 0 ? (
          <p className="recherche__transcrit">
            <span>transcrit&nbsp;:</span> <code>{transcription.text}</code>
          </p>
        ) : null}

        {transcription.substitutions.length > 0 ? (
          <p className="recherche__note">
            L’alphabet de Borges n’a que 22 lettres&nbsp;:{' '}
            {transcription.substitutions.map((s, index) => (
              <span key={s.from}>
                {index > 0 ? ', ' : ''}
                <code>{s.from}</code> → <code>{s.to}</code>
              </span>
            ))}
            .
          </p>
        ) : null}

        {echec ? <p className="recherche__echec">{echec}</p> : null}

        <div className="recherche__actions">
          <button type="submit" className="recherche__valider" disabled={!pret || cherche}>
            {cherche ? 'calcul…' : 'trouver'}
          </button>
          <button type="button" className="recherche__fermer" onClick={onClose}>
            annuler
          </button>
        </div>

        <p className="recherche__pied">
          Rien n’est parcouru&nbsp;: l’adresse est calculée. Le reste de la page sera du blanc.
        </p>
      </form>
    </div>
  )
}
