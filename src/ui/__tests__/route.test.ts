import { describe, expect, it } from 'vitest'
import type { Address } from '../../core/index.ts'
import { fromHash, toHash } from '../route.ts'

const SAMPLE: Address = { hexagon: 987654321n, wall: 1, shelf: 2, volume: 9, page: 137 }

describe('route', () => {
  it('fait laller-retour', () => {
    expect(fromHash(toHash(SAMPLE))).toEqual(SAMPLE)
  })

  it('commence par un croisillon et une barre', () => {
    expect(toHash(SAMPLE).startsWith('#/')).toBe(true)
  })

  it('tolere un fragment sans croisillon', () => {
    expect(fromHash(toHash(SAMPLE).slice(1))).toEqual(SAMPLE)
  })

  it('rend null sur un fragment vide', () => {
    expect(fromHash('')).toBeNull()
    expect(fromHash('#')).toBeNull()
    expect(fromHash('#/')).toBeNull()
  })

  it('rend null plutot que de jeter sur une URL bricolee', () => {
    for (const broken of ['#/nimporte/quoi', '#/1/9/9/9/9', '#/ZZZ/0/0/0/1', '#/1/0/0/0/0']) {
      expect(fromHash(broken)).toBeNull()
    }
  })
})
