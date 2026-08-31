import { describe, expect, it } from 'vitest'
import { FOCUSABLE_SELECTOR, cycleIndex } from '../focus.ts'

describe('cycleIndex', () => {
  it('avance dun element', () => {
    expect(cycleIndex(0, 4, false)).toBe(1)
    expect(cycleIndex(2, 4, false)).toBe(3)
  })

  it('boucle a la fin, au lieu de sechapper derriere la modale', () => {
    expect(cycleIndex(3, 4, false)).toBe(0)
  })

  it('boucle au debut en arriere', () => {
    expect(cycleIndex(0, 4, true)).toBe(3)
    expect(cycleIndex(2, 4, true)).toBe(1)
  })

  it('entre par le debut quand rien nest focalise, par la fin en arriere', () => {
    expect(cycleIndex(-1, 4, false)).toBe(0)
    expect(cycleIndex(-1, 4, true)).toBe(3)
  })

  it('ne rend jamais dindice hors bornes', () => {
    for (let count = 1; count <= 6; count += 1) {
      for (let index = -3; index <= count + 3; index += 1) {
        for (const arriere of [false, true]) {
          const r = cycleIndex(index, count, arriere)
          expect(r).toBeGreaterThanOrEqual(0)
          expect(r).toBeLessThan(count)
        }
      }
    }
  })

  it('rend -1 quand il ny a rien a focaliser', () => {
    expect(cycleIndex(0, 0, false)).toBe(-1)
    expect(cycleIndex(-1, 0, true)).toBe(-1)
  })

  it('fait un tour complet et revient au point de depart', () => {
    let index = 0
    for (let pas = 0; pas < 5; pas += 1) index = cycleIndex(index, 5, false)
    expect(index).toBe(0)
  })

  it('ignore ce qui est desactive', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])')
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])')
  })
})
