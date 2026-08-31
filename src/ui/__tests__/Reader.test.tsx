// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CHARS_PER_LINE, LINES_PER_PAGE, pageAt, type Address } from '../../core/index.ts'
import { Reader } from '../Reader.tsx'

afterEach(cleanup)

const ADRESSE: Address = { hexagon: 7n, wall: 1, shelf: 2, volume: 3, page: 4 }

describe('Reader', () => {
  it('affiche les 40 lignes de 80 caracteres', () => {
    render(<Reader state={{ text: pageAt(ADRESSE), failure: null }} />)
    const bloc = document.querySelector('pre')
    const lignes = bloc?.textContent?.split('\n') ?? []
    expect(lignes).toHaveLength(LINES_PER_PAGE)
    for (const ligne of lignes) expect(ligne).toHaveLength(CHARS_PER_LINE)
  })

  it('masque le bloc aux lecteurs decran, au lieu de leur enoncer 3 200 caracteres', () => {
    render(<Reader state={{ text: pageAt(ADRESSE), failure: null }} />)
    expect(document.querySelector('pre')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('leur dit a la place ce que la page raconte', () => {
    render(<Reader state={{ text: pageAt(ADRESSE), failure: null }} />)
    const resume = screen.getByRole('status')
    expect(resume.textContent).toContain('40 lignes de 80 caractères')
    expect(resume.textContent).toContain('commence par')
  })

  it('annonce lattente pendant la generation', () => {
    render(<Reader state={{ text: null, failure: null }} />)
    expect(screen.getByRole('status').textContent).toContain('cours')
    expect(document.querySelector('pre')?.getAttribute('aria-busy')).toBe('true')
  })

  it('garde exactement la meme taille pendant lattente : la mise en page ne saute pas', () => {
    render(<Reader state={{ text: null, failure: null }} />)
    const attente = document.querySelector('pre')?.textContent ?? ''
    cleanup()
    render(<Reader state={{ text: pageAt(ADRESSE), failure: null }} />)
    const pleine = document.querySelector('pre')?.textContent ?? ''
    expect(attente.split('\n')).toHaveLength(pleine.split('\n').length)
    expect(attente.split('\n')[0]).toHaveLength((pleine.split('\n')[0] ?? '').length)
  })

  it('signale un echec comme une alerte', () => {
    render(<Reader state={{ text: null, failure: 'worker mort' }} />)
    expect(screen.getByRole('alert').textContent).toBe('worker mort')
  })
})
