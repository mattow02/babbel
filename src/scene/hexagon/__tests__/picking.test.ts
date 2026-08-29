import { describe, expect, it } from 'vitest'
import { BOOKS_PER_HEXAGON } from '../../../core/index.ts'
import { bookIndex } from '../layout3d.ts'
import { addressFromInstance } from '../picking.ts'

describe('addressFromInstance', () => {
  it('retrouve exactement ladresse posee par layout3d', () => {
    // C'est la garantie qui compte : le meme ordre a l'aller et au retour.
    for (const [wall, shelf, volume] of [
      [0, 0, 0],
      [1, 3, 17],
      [2, 4, 31],
      [3, 2, 8],
    ] as const) {
      const dansLaGalerieCentrale = BOOKS_PER_HEXAGON + bookIndex(wall, shelf, volume)
      expect(addressFromInstance(dansLaGalerieCentrale, 1, 100n)).toEqual({
        hexagon: 100n,
        wall,
        shelf,
        volume,
        page: 1,
      })
    }
  })

  it('vise la bonne galerie selon la place occupee', () => {
    expect(addressFromInstance(0, 1, 100n)?.hexagon).toBe(99n)
    expect(addressFromInstance(BOOKS_PER_HEXAGON, 1, 100n)?.hexagon).toBe(100n)
    expect(addressFromInstance(2 * BOOKS_PER_HEXAGON, 1, 100n)?.hexagon).toBe(101n)
  })

  it('ouvre toujours a la premiere page', () => {
    expect(addressFromInstance(5, 1, 7n)?.page).toBe(1)
  })

  it('refuse un indice aberrant', () => {
    expect(addressFromInstance(-1, 1, 10n)).toBeNull()
    expect(addressFromInstance(1.5, 1, 10n)).toBeNull()
    expect(addressFromInstance(3 * BOOKS_PER_HEXAGON, 1, 10n)).toBeNull()
  })

  it('refuse de sortir de la bibliotheque par le debut', () => {
    // Depuis la galerie 0, la galerie precedente n'existe pas.
    expect(addressFromInstance(0, 1, 0n)).toBeNull()
    expect(addressFromInstance(BOOKS_PER_HEXAGON, 1, 0n)?.hexagon).toBe(0n)
  })

  it('couvre les 640 volumes dune galerie, sans trou ni doublon', () => {
    const vues = new Set<string>()
    for (let i = 0; i < BOOKS_PER_HEXAGON; i += 1) {
      const a = addressFromInstance(BOOKS_PER_HEXAGON + i, 1, 5n)
      expect(a).not.toBeNull()
      vues.add(`${a?.wall}/${a?.shelf}/${a?.volume}`)
    }
    expect(vues.size).toBe(BOOKS_PER_HEXAGON)
  })
})
