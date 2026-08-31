// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { pageAt, type Address } from '../../core/index.ts'
import { PageLibrary, createInlineEngine, type PageEngine } from '../../workers/index.ts'
import { usePageText } from '../usePageText.ts'

afterEach(cleanup)

const AT = (page: number): Address => ({ hexagon: 21n, wall: 0, shelf: 1, volume: 2, page })

describe('usePageText', () => {
  it('rend le texte une fois genere', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    const { result } = renderHook(() => usePageText(library, AT(3)))
    expect(result.current.text).toBeNull()
    await waitFor(() => {
      expect(result.current.text).toBe(pageAt(AT(3)))
    })
  })

  it("affiche SANS clignoter une page deja en cache", async () => {
    // C'est la raison d'etre du `peek` : une page deja generee doit apparaitre
    // dans le rendu meme ou elle est demandee, pas au rendu suivant.
    const library = new PageLibrary({ engine: createInlineEngine() })
    await act(async () => {
      await library.read(AT(9))
    })
    const { result } = renderHook(() => usePageText(library, AT(9)))
    expect(result.current.text).toBe(pageAt(AT(9)))
  })

  it('suit le changement dadresse', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    const { result, rerender } = renderHook(({ page }) => usePageText(library, AT(page)), {
      initialProps: { page: 1 },
    })
    await waitFor(() => {
      expect(result.current.text).toBe(pageAt(AT(1)))
    })
    rerender({ page: 2 })
    await waitFor(() => {
      expect(result.current.text).toBe(pageAt(AT(2)))
    })
  })

  it('fait remonter un echec du moteur', async () => {
    const casse: PageEngine = {
      compute: () => Promise.reject(new Error('worker mort')),
      locate: () => Promise.reject(new Error('worker mort')),
      dispose() {},
    }
    const library = new PageLibrary({ engine: casse })
    const { result } = renderHook(() => usePageText(library, AT(4)))
    await waitFor(() => {
      expect(result.current.failure).toBe('worker mort')
    })
    expect(result.current.text).toBeNull()
  })

  it("n'attribue pas un echec a la page suivante", async () => {
    // L'echec porte son adresse : changer de page doit le faire disparaitre,
    // meme si la nouvelle page, elle, se genere sans probleme.
    let casser = true
    const capricieux: PageEngine = {
      compute: (address) =>
        casser ? Promise.reject(new Error('worker mort')) : Promise.resolve(pageAt(address)),
      locate: () => Promise.reject(new Error('inutile ici')),
      dispose() {},
    }
    const library = new PageLibrary({ engine: capricieux })
    const { result, rerender } = renderHook(({ page }) => usePageText(library, AT(page)), {
      initialProps: { page: 5 },
    })
    await waitFor(() => {
      expect(result.current.failure).toBe('worker mort')
    })
    casser = false
    rerender({ page: 6 })
    await waitFor(() => {
      expect(result.current.text).toBe(pageAt(AT(6)))
    })
    expect(result.current.failure).toBeNull()
  })

  it('precharge les pages voisines', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    renderHook(() => usePageText(library, AT(100)))
    await waitFor(() => {
      expect(library.peek(AT(101))).toBeDefined()
      expect(library.peek(AT(99))).toBeDefined()
    })
  })
})
