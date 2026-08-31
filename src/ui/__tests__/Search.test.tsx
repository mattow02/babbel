// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Address } from '../../core/index.ts'
import { PageLibrary, createInlineEngine } from '../../workers/index.ts'
import { Search } from '../Search.tsx'

afterEach(cleanup)

function monter(): { onFound: ReturnType<typeof vi.fn>; onClose: ReturnType<typeof vi.fn> } {
  const onFound = vi.fn()
  const onClose = vi.fn()
  const library = new PageLibrary({ engine: createInlineEngine() })
  render(<Search library={library} onFound={onFound} onClose={onClose} />)
  return { onFound, onClose }
}

const champ = (): HTMLInputElement => screen.getByRole('textbox') as HTMLInputElement

describe('Search', () => {
  it('donne le focus au champ des louverture', () => {
    monter()
    expect(document.activeElement).toBe(champ())
  })

  it('transcrit ce quon tape, et le montre', () => {
    monter()
    fireEvent.change(champ(), { target: { value: 'Kafka' } })
    expect(document.body.textContent).toContain('cafca')
  })

  it('explique ce quil a remplace', () => {
    monter()
    fireEvent.change(champ(), { target: { value: 'Kafka' } })
    expect(document.body.textContent).toContain('22 lettres')
    expect(document.body.textContent).toContain('→')
  })

  it('ne dit rien quand rien na ete transcrit', () => {
    monter()
    fireEvent.change(champ(), { target: { value: 'la bibliotheque' } })
    expect(document.body.textContent).not.toContain('22 lettres')
  })

  it('refuse de chercher tant que rien nest ecrit', () => {
    monter()
    const bouton = (): HTMLButtonElement =>
      screen.getByRole('button', { name: /trouver|calcul/i }) as HTMLButtonElement
    expect(bouton().disabled).toBe(true)
    fireEvent.change(champ(), { target: { value: 'a' } })
    expect(bouton().disabled).toBe(false)
  })

  it('calcule ladresse et la rend, transcrite', async () => {
    const { onFound } = monter()
    fireEvent.change(champ(), { target: { value: 'Kafka a ecrit' } })
    fireEvent.click(screen.getByRole('button', { name: /trouver/i }))
    await waitFor(() => {
      expect(onFound).toHaveBeenCalledTimes(1)
    })
    /*
     * L'adresse rendue est celle que la bijection CALCULE pour ce texte : sa
     * page n'a aucune raison d'etre la premiere. Ce qu'on verifie, c'est
     * qu'elle est bien une adresse valide de la bibliotheque.
     */
    const adresse = onFound.mock.calls[0]?.[0] as Address
    expect(adresse.page).toBeGreaterThanOrEqual(1)
    expect(adresse.page).toBeLessThanOrEqual(410)
    expect(adresse.wall).toBeGreaterThanOrEqual(0)
    expect(adresse.wall).toBeLessThan(4)
    expect(adresse.hexagon).toBeGreaterThan(0n)
  })

  it('se ferme sur Echap sans rien chercher', () => {
    const { onClose, onFound } = monter()
    fireEvent.keyDown(champ(), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onFound).not.toHaveBeenCalled()
  })

  it('annonce une modale ET tient le focus a linterieur', () => {
    monter()
    const modale = screen.getByRole('dialog')
    expect(modale.getAttribute('aria-modal')).toBe('true')

    // On tabule depuis le dernier element : on doit revenir au premier, pas
    // s'echapper derriere la modale.
    const focalisables = [...modale.querySelectorAll<HTMLElement>('input, button')]
    focalisables[focalisables.length - 1]?.focus()
    fireEvent.keyDown(modale, { key: 'Tab' })
    expect(modale.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(focalisables[0])
  })

  it('revient en arriere avec Maj+Tab, toujours sans sortir', () => {
    monter()
    const modale = screen.getByRole('dialog')
    const focalisables = [...modale.querySelectorAll<HTMLElement>('input, button')]
    focalisables[0]?.focus()
    fireEvent.keyDown(modale, { key: 'Tab', shiftKey: true })
    expect(modale.contains(document.activeElement)).toBe(true)
  })
})
