import { describe, expect, it } from 'vitest'
import { HEXAGON_COUNT } from '../../core/index.ts'
import { FLOOR_COUNT, FLOOR_STRIDE, above, below, columnOf, floorOf } from '../etages.ts'

describe('les etages', () => {
  it('empile un nombre demesure detages', () => {
    expect(FLOOR_COUNT).toBeGreaterThan(10n ** 3000n)
  })

  it('fait des etages demesurement longs', () => {
    expect(FLOOR_STRIDE).toBeGreaterThan(10n ** 1000n)
  })

  it('pose le rez-de-chaussee a letage zero', () => {
    expect(floorOf(0n)).toBe(0n)
    expect(floorOf(FLOOR_STRIDE - 1n)).toBe(0n)
    expect(floorOf(FLOOR_STRIDE)).toBe(1n)
  })

  it('lit le meme entier dans deux dimensions, sans jamais perdre dinformation', () => {
    for (const hexagon of [0n, 1n, 12345n, FLOOR_STRIDE + 7n, FLOOR_STRIDE * 9n + 42n]) {
      expect(floorOf(hexagon) * FLOOR_STRIDE + columnOf(hexagon)).toBe(hexagon)
    }
  })

  it('monte et descend en revenant exactement au point de depart', () => {
    for (const hexagon of [0n, 999n, FLOOR_STRIDE * 3n + 5n]) {
      const haut = above(hexagon)
      expect(haut).not.toBeNull()
      expect(below(haut as bigint)).toBe(hexagon)
    }
  })

  it('garde la meme colonne quand on change detage', () => {
    // C'est ce qui fait qu'un escalier est un escalier : on monte a la
    // verticale, on ne se deplace pas lateralement.
    const depart = FLOOR_STRIDE * 2n + 777n
    expect(columnOf(above(depart) as bigint)).toBe(columnOf(depart))
    expect(columnOf(below(depart) as bigint)).toBe(columnOf(depart))
  })

  it('refuse de descendre sous le rez-de-chaussee', () => {
    expect(below(0n)).toBeNull()
    expect(below(FLOOR_STRIDE - 1n)).toBeNull()
    expect(below(FLOOR_STRIDE)).toBe(0n)
  })

  it('refuse de monter au-dela du dernier etage', () => {
    expect(above(HEXAGON_COUNT - 1n)).toBeNull()
    expect(above(0n)).toBe(FLOOR_STRIDE)
  })

  it('ne sort jamais de la bibliotheque', () => {
    for (const hexagon of [0n, HEXAGON_COUNT - 1n, HEXAGON_COUNT / 2n]) {
      const haut = above(hexagon)
      const bas = below(hexagon)
      if (haut !== null) expect(haut).toBeLessThan(HEXAGON_COUNT)
      if (bas !== null) expect(bas).toBeGreaterThanOrEqual(0n)
    }
  })
})
