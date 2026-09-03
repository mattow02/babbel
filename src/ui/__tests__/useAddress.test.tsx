// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Address } from '../../core/index.ts'
import { toHash } from '../route.ts'
import { useAddress } from '../useAddress.ts'

const ORIGINE: Address = { hexagon: 0n, wall: 0, shelf: 0, volume: 0, page: 1 }
const AILLEURS: Address = { hexagon: 42n, wall: 2, shelf: 3, volume: 7, page: 12 }

const vider = (): void => {
  window.history.replaceState(null, '', window.location.pathname)
}

describe('useAddress', () => {
  /*
   * La regle qui compte.
   *
   * Le site s'ouvre sur le monument, pas sur un livre : afficher l'adresse
   * d'un volume qu'on n'a pas ouvert donnait un lien qui ne designait rien de
   * ce qu'on avait vu.
   */
  it("n'ecrit rien dans l'URL tant que le visiteur n'a rien fait", () => {
    vider()
    renderHook(() => useAddress(ORIGINE))
    expect(window.location.hash).toBe('')
  })

  it("part de l'origine quand l'URL est vide", () => {
    vider()
    const { result } = renderHook(() => useAddress(ORIGINE))
    expect(result.current[0]).toEqual(ORIGINE)
  })

  it("ecrit l'adresse au premier geste, et sans entree d'historique", () => {
    vider()
    const avant = window.history.length
    const { result } = renderHook(() => useAddress(ORIGINE))
    act(() => {
      result.current[1](AILLEURS)
    })
    expect(window.location.hash).toBe(toHash(AILLEURS))
    expect(window.history.length).toBe(avant)
  })

  it('lit une adresse deja presente dans l’URL', () => {
    window.history.replaceState(null, '', toHash(AILLEURS))
    const { result } = renderHook(() => useAddress(ORIGINE))
    expect(result.current[0]).toEqual(AILLEURS)
    vider()
  })
})
