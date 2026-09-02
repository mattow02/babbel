import { useEffect, type RefObject } from 'react'
import { FOCUSABLE_SELECTOR, cycleIndex } from './focus.ts'

/**
 * Retient le focus dans un conteneur, et le rend en partant.
 *
 * Annoncer `aria-modal` sans piéger le focus est pire que ne rien annoncer :
 * on promet a qui navigue au clavier que le reste de la page est hors jeu, et
 * la tabulation s'echappe quand meme derriere la modale.
 *
 * Rend aussi le focus a l'element qui l'avait avant : sans cela, fermer une
 * modale renvoie au tout debut du document.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true): void {
  useEffect(() => {
    if (!active) return
    const conteneur = ref.current
    if (!conteneur) return

    const precedent = document.activeElement as HTMLElement | null

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return
      /*
       * On ne filtre PAS sur la visibilite calculee (`offsetParent`, boites
       * clientes) : cela depend de la mise en page, donc du moteur de rendu, et
       * cela ne veut rien dire hors d'un navigateur. Le selecteur ecarte deja
       * ce qui est desactive, et une modale ne contient que ses propres
       * commandes : c'est suffisant, et c'est verifiable.
       */
      const elements = [...conteneur.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      if (elements.length === 0) return

      event.preventDefault()
      const courant = elements.indexOf(document.activeElement as HTMLElement)
      const cible = elements[cycleIndex(courant, elements.length, event.shiftKey)]
      cible?.focus()
    }

    conteneur.addEventListener('keydown', onKeyDown)
    return () => {
      conteneur.removeEventListener('keydown', onKeyDown)
      precedent?.focus?.()
    }
  }, [ref, active])
}
