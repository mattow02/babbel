import { describe, expect, it } from 'vitest'
import type { Address } from '../../core/index.ts'
import { readingNeighbourhood } from '../neighbourhood.ts'

const AT = (page: number): Address => ({ hexagon: 5n, wall: 1, shelf: 2, volume: 3, page })

describe('readingNeighbourhood', () => {
  it('alterne suivante puis precedente, du plus proche au plus loin', () => {
    expect(readingNeighbourhood(AT(100), 2).map((a) => a.page)).toEqual([101, 99, 102, 98])
  })

  it("n'inclut jamais la page courante", () => {
    expect(readingNeighbourhood(AT(100), 3).map((a) => a.page)).not.toContain(100)
  })

  it('ne sort pas du volume au debut', () => {
    expect(readingNeighbourhood(AT(1), 2).map((a) => a.page)).toEqual([2, 3])
  })

  it('ne sort pas du volume a la fin', () => {
    expect(readingNeighbourhood(AT(410), 2).map((a) => a.page)).toEqual([409, 408])
  })

  it('reste dans le meme livre', () => {
    for (const neighbour of readingNeighbourhood(AT(200), 5)) {
      expect(neighbour.hexagon).toBe(5n)
      expect(neighbour.volume).toBe(3)
    }
  })
})
