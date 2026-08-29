import { describe, expect, it } from 'vitest'
import {
  HEXAGON_COUNT,
  addressOf,
  assertValidAddress,
  fromPath,
  locationOf,
  toPath,
  type Address,
} from '../address.ts'
import { PAGE_COUNT } from '../bijection.ts'
import { PAGES_PER_HEXAGON } from '../layout.ts'

const SAMPLE: Address = { hexagon: 123456789n, wall: 2, shelf: 3, volume: 17, page: 208 }

describe('layout de la bibliotheque', () => {
  it('loge 262 400 pages par galerie', () => {
    expect(PAGES_PER_HEXAGON).toBe(640 * 410)
  })

  it('compte juste assez de galeries pour toutes les pages', () => {
    expect(HEXAGON_COUNT * BigInt(PAGES_PER_HEXAGON)).toBeGreaterThanOrEqual(PAGE_COUNT)
    expect((HEXAGON_COUNT - 1n) * BigInt(PAGES_PER_HEXAGON)).toBeLessThan(PAGE_COUNT)
  })
})

describe('adresse <-> emplacement', () => {
  it('fait laller-retour sur un echantillon', () => {
    expect(addressOf(locationOf(SAMPLE))).toEqual(SAMPLE)
  })

  it('numerote la toute premiere page a zero', () => {
    expect(locationOf({ hexagon: 0n, wall: 0, shelf: 0, volume: 0, page: 1 })).toBe(0n)
  })

  it('enchaine les emplacements sans trou ni recouvrement', () => {
    // Les 262 400 pages d'une galerie doivent occuper un intervalle continu.
    const base = locationOf({ hexagon: 7n, wall: 0, shelf: 0, volume: 0, page: 1 })
    const last = locationOf({ hexagon: 7n, wall: 3, shelf: 4, volume: 31, page: 410 })
    expect(last - base).toBe(BigInt(PAGES_PER_HEXAGON - 1))
    const nextHexagon = locationOf({ hexagon: 8n, wall: 0, shelf: 0, volume: 0, page: 1 })
    expect(nextHexagon).toBe(last + 1n)
  })

  it('fait laller-retour sur toute une galerie, page par page', () => {
    for (let page = 1; page <= 410; page += 1) {
      const address: Address = { hexagon: 42n, wall: 1, shelf: 4, volume: 30, page }
      expect(addressOf(locationOf(address))).toEqual(address)
    }
  })

  it('refuse les adresses hors bornes', () => {
    expect(() => locationOf({ ...SAMPLE, wall: 4 })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, shelf: 5 })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, volume: 32 })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, page: 0 })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, page: 411 })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, hexagon: -1n })).toThrow(RangeError)
    expect(() => locationOf({ ...SAMPLE, hexagon: HEXAGON_COUNT })).toThrow(RangeError)
    expect(() => assertValidAddress({ ...SAMPLE, wall: 1.5 })).toThrow(RangeError)
  })
})

describe('serialisation en URL', () => {
  it('fait laller-retour', () => {
    expect(fromPath(toPath(SAMPLE))).toEqual(SAMPLE)
  })

  it('encode la galerie en base 36', () => {
    expect(toPath(SAMPLE)).toBe(`${(123456789n).toString(36)}/2/3/17/208`)
  })

  it('tolere les barres obliques en trop', () => {
    expect(fromPath(`/${toPath(SAMPLE)}/`)).toEqual(SAMPLE)
  })

  it('survit a une galerie enorme', () => {
    const huge: Address = { hexagon: HEXAGON_COUNT - 1n, wall: 0, shelf: 0, volume: 0, page: 1 }
    expect(fromPath(toPath(huge))).toEqual(huge)
  })

  it('refuse un chemin mal forme', () => {
    expect(() => fromPath('trop/court/vraiment')).toThrow(SyntaxError)
    expect(() => fromPath('ZZZ/0/0/0/1')).toThrow(SyntaxError)
    expect(() => fromPath('1/x/0/0/1')).toThrow(SyntaxError)
    expect(() => fromPath('1/0/0/0/999')).toThrow(RangeError)
  })
})
