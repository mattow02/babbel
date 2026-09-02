import { describe, expect, it } from 'vitest'
import { BOOKS_PER_HEXAGON } from '../../../core/index.ts'
import { HEXAGON_RADIUS } from '../../dimensions.ts'
import { insideHexagon } from '../../navigation/geometry.ts'
import { galleryOrigins } from '../../galleries.ts'
import { APPROACH_DISTANCE, approachFor } from '../approach.ts'
import { allBookPlacements, bookIndex } from '../layout3d.ts'

const YEUX = 1.55
const DEPTH = 1

describe('approachFor', () => {
  it('rend ladresse du volume designe', () => {
    const id = BOOKS_PER_HEXAGON + bookIndex(1, 3, 17)
    expect(approachFor(id, DEPTH, 42n, YEUX)?.address).toEqual({
      hexagon: 42n,
      wall: 1,
      shelf: 3,
      volume: 17,
      page: 1,
    })
  })

  it('regarde le volume lui-meme', () => {
    const id = BOOKS_PER_HEXAGON + bookIndex(2, 1, 5)
    const placement = allBookPlacements(galleryOrigins(DEPTH)[1])[bookIndex(2, 1, 5)]
    const a = approachFor(id, DEPTH, 7n, YEUX)
    expect(a?.lookAt.x).toBeCloseTo(placement?.x ?? NaN, 10)
    expect(a?.lookAt.z).toBeCloseTo(placement?.z ?? NaN, 10)
  })

  it("se place DEVANT le livre, du cote de la piece, jamais dans le mur", () => {
    // Le test qui compte : le point d'arrivee doit etre dans la salle.
    for (const [wall, shelf, volume] of [
      [0, 0, 0],
      [1, 2, 31],
      [2, 4, 15],
      [3, 1, 7],
    ] as const) {
      const id = BOOKS_PER_HEXAGON + bookIndex(wall, shelf, volume)
      const a = approachFor(id, DEPTH, 3n, YEUX)
      expect(a).not.toBeNull()
      const origin = galleryOrigins(DEPTH)[1]
      const relatif = { x: (a?.destination.x ?? 0) - (origin?.x ?? 0), z: (a?.destination.z ?? 0) - (origin?.z ?? 0) }
      expect(insideHexagon(relatif, 0.2)).toBe(true)
      // Et il est bien plus pres du centre que le livre.
      const distanceLivre = Math.hypot((a?.lookAt.x ?? 0) - (origin?.x ?? 0), (a?.lookAt.z ?? 0) - (origin?.z ?? 0))
      const distanceArrivee = Math.hypot(relatif.x, relatif.z)
      expect(distanceArrivee).toBeLessThan(distanceLivre)
      // Borne : le rayon CIRCONSCRIT, pas l'apotheme, un volume en bout
      // d'etagere est plus loin du centre que le milieu du mur.
      expect(distanceLivre).toBeLessThanOrEqual(HEXAGON_RADIUS)
    }
  })

  it('sarrete a la bonne distance du volume', () => {
    const id = BOOKS_PER_HEXAGON + bookIndex(0, 2, 10)
    const a = approachFor(id, DEPTH, 1n, YEUX)
    const d = Math.hypot(
      (a?.destination.x ?? 0) - (a?.lookAt.x ?? 0),
      (a?.destination.z ?? 0) - (a?.lookAt.z ?? 0),
    )
    expect(d).toBeCloseTo(APPROACH_DISTANCE, 10)
  })

  it('arrive a hauteur des yeux, quelle que soit letagere', () => {
    for (let shelf = 0; shelf < 5; shelf += 1) {
      const id = BOOKS_PER_HEXAGON + bookIndex(0, shelf, 0)
      expect(approachFor(id, DEPTH, 1n, YEUX)?.destination.y).toBe(YEUX)
    }
  })

  it('vise une galerie voisine quand on designe a travers une porte', () => {
    expect(approachFor(0, DEPTH, 10n, YEUX)?.address.hexagon).toBe(9n)
    expect(approachFor(2 * BOOKS_PER_HEXAGON, DEPTH, 10n, YEUX)?.address.hexagon).toBe(11n)
  })

  it('refuse un indice aberrant', () => {
    expect(approachFor(-1, DEPTH, 1n, YEUX)).toBeNull()
    expect(approachFor(99 * BOOKS_PER_HEXAGON, DEPTH, 1n, YEUX)).toBeNull()
  })
})
