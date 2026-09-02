import { useEffect, useState } from 'react'
import { BATTEMENTS, INVITE, battementA } from './intro.ts'

/**
 * L'introduction, ecrite par-dessus la bibliotheque.
 *
 * Elle ne prend aucun clic : la porte reste atteignable a chaque instant, et
 * le visiteur presse n'a pas a chercher comment passer. Un geste, n'importe
 * lequel, abrege le texte.
 */
export function Intro(): React.ReactElement {
  // Certains ne veulent pas d'animation. On leur donne alors tout le texte
  // d'un coup : la meme information, sans le temps.
  const [sobre] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [index, setIndex] = useState(sobre ? -1 : 0)

  useEffect(() => {
    if (sobre) return undefined
    const debut = performance.now()
    const id = window.setInterval(() => {
      const suivant = battementA(performance.now() - debut)
      setIndex(suivant)
      if (suivant === -1) window.clearInterval(id)
    }, 150)
    return () => {
      window.clearInterval(id)
    }
  }, [sobre])

  // Un geste, n'importe lequel, abrege. On n'affiche pas de bouton « passer » :
  // ce serait un troisieme element d'interface dans un lieu qui n'en a aucun.
  useEffect(() => {
    if (index === -1) return undefined
    const abreger = (): void => {
      setIndex(-1)
    }
    window.addEventListener('pointerdown', abreger)
    window.addEventListener('keydown', abreger)
    return () => {
      window.removeEventListener('pointerdown', abreger)
      window.removeEventListener('keydown', abreger)
    }
  }, [index])

  const fini = index === -1

  return (
    <div className="intro" aria-live="polite">
      <div className="intro__voile" style={fini ? { opacity: 0 } : undefined} />
      {sobre ? (
        <div className="intro__tout">
          {BATTEMENTS.map((battement, i) => (
            <p key={battement.texte} className={i === 0 ? 'intro__ligne intro__ligne--titre' : 'intro__ligne'}>
              {battement.texte}
            </p>
          ))}
        </div>
      ) : fini ? null : (
        <p
          key={index}
          className={index === 0 ? 'intro__ligne intro__ligne--titre' : 'intro__ligne'}
        >
          {BATTEMENTS[index]?.texte}
        </p>
      )}
      <p className="intro__invite">{INVITE}</p>
    </div>
  )
}
