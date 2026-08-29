import { describe, expect, it } from 'vitest'
import type { Address } from '../../core/index.ts'
import { jumpToEdge, resolveKey, stepPage, stepVolume } from '../navigation.ts'

const AT = (page: number, volume = 5): Address => ({ hexagon: 3n, wall: 1, shelf: 2, volume, page })

describe('stepPage', () => {
  it('avance et recule', () => {
    expect(stepPage(AT(100), 1).page).toBe(101)
    expect(stepPage(AT(100), -1).page).toBe(99)
    expect(stepPage(AT(100), 10).page).toBe(110)
  })

  it('ne sort pas du volume', () => {
    expect(stepPage(AT(1), -1).page).toBe(1)
    expect(stepPage(AT(410), 1).page).toBe(410)
    expect(stepPage(AT(5), -50).page).toBe(1)
    expect(stepPage(AT(405), 50).page).toBe(410)
  })

  it('ne touche pas au reste de ladresse', () => {
    expect(stepPage(AT(100), 1)).toMatchObject({ hexagon: 3n, wall: 1, shelf: 2, volume: 5 })
  })
})

describe('stepVolume', () => {
  it('change de volume et revient a la premiere page', () => {
    expect(stepVolume(AT(200, 5), 1)).toMatchObject({ volume: 6, page: 1 })
  })

  it('ne sort pas de letagere, et ne perd pas la page si ca ne bouge pas', () => {
    expect(stepVolume(AT(200, 0), -1)).toEqual(AT(200, 0))
    expect(stepVolume(AT(200, 31), 1)).toEqual(AT(200, 31))
  })
})

describe('jumpToEdge', () => {
  it('va au debut et a la fin du volume', () => {
    expect(jumpToEdge(AT(200), 'first').page).toBe(1)
    expect(jumpToEdge(AT(200), 'last').page).toBe(410)
  })
})

describe('resolveKey', () => {
  it('traduit les fleches', () => {
    expect(resolveKey({ key: 'ArrowRight', shiftKey: false })?.(AT(10)).page).toBe(11)
    expect(resolveKey({ key: 'ArrowLeft', shiftKey: false })?.(AT(10)).page).toBe(9)
  })

  it('avance de dix avec Maj', () => {
    expect(resolveKey({ key: 'ArrowRight', shiftKey: true })?.(AT(10)).page).toBe(20)
  })

  it('gere Debut, Fin et les pages entieres', () => {
    expect(resolveKey({ key: 'Home', shiftKey: false })?.(AT(200)).page).toBe(1)
    expect(resolveKey({ key: 'End', shiftKey: false })?.(AT(200)).page).toBe(410)
    expect(resolveKey({ key: 'PageDown', shiftKey: false })?.(AT(200)).page).toBe(210)
  })

  it('change de volume avec haut et bas', () => {
    expect(resolveKey({ key: 'ArrowDown', shiftKey: false })?.(AT(200, 5)).volume).toBe(6)
    expect(resolveKey({ key: 'ArrowUp', shiftKey: false })?.(AT(200, 5)).volume).toBe(4)
  })

  it('ignore les touches qui ne nous concernent pas', () => {
    for (const key of ['a', 'Enter', 'Escape', 'Tab', ' ']) {
      expect(resolveKey({ key, shiftKey: false })).toBeNull()
    }
  })
})
