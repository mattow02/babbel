import { describe, expect, it } from 'vitest'
import { BOOKS_PER_HEXAGON, SHELVES_PER_WALL, VOLUMES_PER_SHELF, WALLS_PER_HEXAGON } from '../../../core/index.ts'
import {
  BOOK_DEPTH,
  BOOK_HEIGHT,
  BOOK_WIDTH,
  HEXAGON_APOTHEM,
  HEXAGON_RADIUS,
  ROOM_HEIGHT,
  SHELF_THICKNESS,
} from '../../dimensions.ts'
import {
  CORRIDOR_SIDES,
  SHELF_SIDES,
  SIDES,
  VOLUME_PITCH,
  allBookPlacements,
  bookIndex,
  bookPlacement,
  bookY,
  facingInward,
  shelfY,
  sideAngle,
} from '../layout3d.ts'

/** Distance d'un point au centre de la galerie, dans le plan du sol. */
const radius = (p: { x: number; z: number }): number => Math.hypot(p.x, p.z)

describe('les murs', () => {
  it('laisse libres deux murs OPPOSES, pour que les couloirs sabiment en ligne droite', () => {
    expect(CORRIDOR_SIDES).toHaveLength(2)
    const [a, b] = CORRIDOR_SIDES as [number, number]
    expect(Math.abs(a - b)).toBe(SIDES / 2)
    // Les normales sont bien a 180 degres l'une de l'autre.
    const ecart = Math.abs(sideAngle(a) - sideAngle(b))
    expect(ecart).toBeCloseTo(Math.PI, 10)
  })

  it('garde quatre murs porteurs, comme chez Borges', () => {
    expect(SHELF_SIDES).toHaveLength(WALLS_PER_HEXAGON)
    expect(SHELF_SIDES).toEqual([1, 2, 4, 5])
  })

  it('espace les six murs de soixante degres', () => {
    for (let k = 0; k < SIDES; k += 1) {
      expect(sideAngle(k + 1) - sideAngle(k)).toBeCloseTo(Math.PI / 3, 10)
    }
  })
})

describe('orientation', () => {
  it('tourne chaque objet vers linterieur de la piece', () => {
    for (const side of SHELF_SIDES) {
      const phi = facingInward(side)
      // Le +z local doit pointer vers le centre, soit l'oppose de la normale.
      const localZ = { x: Math.sin(phi), z: Math.cos(phi) }
      const normal = { x: Math.cos(sideAngle(side)), z: Math.sin(sideAngle(side)) }
      expect(localZ.x).toBeCloseTo(-normal.x, 10)
      expect(localZ.z).toBeCloseTo(-normal.z, 10)
    }
  })

  it('aligne le +x local sur la direction du mur', () => {
    for (const side of SHELF_SIDES) {
      const phi = facingInward(side)
      const localX = { x: Math.cos(phi), z: -Math.sin(phi) }
      const normal = { x: Math.cos(sideAngle(side)), z: Math.sin(sideAngle(side)) }
      // Perpendiculaire a la normale : produit scalaire nul.
      expect(localX.x * normal.x + localX.z * normal.z).toBeCloseTo(0, 10)
    }
  })
})

describe('les volumes', () => {
  it('en compte exactement 640 par galerie', () => {
    expect(allBookPlacements()).toHaveLength(BOOKS_PER_HEXAGON)
    expect(BOOKS_PER_HEXAGON).toBe(640)
  })

  it('les range dans lordre exact des adresses', () => {
    const all = allBookPlacements()
    for (const [wall, shelf, volume] of [
      [0, 0, 0],
      [1, 3, 17],
      [3, 4, 31],
    ] as const) {
      expect(all[bookIndex(wall, shelf, volume)]).toEqual(bookPlacement(wall, shelf, volume))
    }
    expect(bookIndex(3, 4, 31)).toBe(BOOKS_PER_HEXAGON - 1)
  })

  it('les plaque contre les murs, jamais au milieu de la piece', () => {
    const attendu = HEXAGON_APOTHEM - BOOK_DEPTH / 2
    for (const p of allBookPlacements()) {
      // Le centre d'un livre est a l'apotheme moins une demi-profondeur,
      // decale le long du mur : sa distance au centre est donc bornee.
      expect(radius(p)).toBeGreaterThan(attendu - 0.001)
      expect(radius(p)).toBeLessThanOrEqual(Math.hypot(attendu, HEXAGON_RADIUS / 2) + 0.001)
    }
  })

  it('les fait reposer sur la planche, sans flotter ni senfoncer', () => {
    for (let shelf = 0; shelf < SHELVES_PER_WALL; shelf += 1) {
      const basDuLivre = bookY(shelf) - BOOK_HEIGHT / 2
      const dessusDeLaPlanche = shelfY(shelf) + SHELF_THICKNESS / 2
      expect(basDuLivre).toBeCloseTo(dessusDeLaPlanche, 10)
    }
  })

  it('tient sous le plafond, meme sur letagere du haut', () => {
    const hautDuLivre = bookY(SHELVES_PER_WALL - 1) + BOOK_HEIGHT / 2
    expect(hautDuLivre).toBeLessThan(ROOM_HEIGHT)
    // Borges : les etageres depassent a peine un bibliothecaire.
    expect(hautDuLivre).toBeLessThan(2)
  })

  it('ne fait jamais se chevaucher deux volumes voisins', () => {
    expect(VOLUME_PITCH).toBeGreaterThan(BOOK_WIDTH)
    const a = bookPlacement(0, 0, 10)
    const b = bookPlacement(0, 0, 11)
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeCloseTo(VOLUME_PITCH, 10)
  })

  it('centre les 32 volumes sur leur mur', () => {
    const premier = bookPlacement(0, 0, 0)
    const dernier = bookPlacement(0, 0, VOLUMES_PER_SHELF - 1)
    const milieu = { x: (premier.x + dernier.x) / 2, z: (premier.z + dernier.z) / 2 }
    const attendu = bookPlacement(0, 0, 0)
    const theta = sideAngle(SHELF_SIDES[0] as number)
    const inward = HEXAGON_APOTHEM - BOOK_DEPTH / 2
    expect(milieu.x).toBeCloseTo(Math.cos(theta) * inward, 10)
    expect(milieu.z).toBeCloseTo(Math.sin(theta) * inward, 10)
    expect(attendu).toBeDefined()
  })

  it('ne deborde jamais du mur qui les porte', () => {
    const demiMur = HEXAGON_RADIUS / 2
    for (let volume = 0; volume < VOLUMES_PER_SHELF; volume += 1) {
      const p = bookPlacement(0, 0, volume)
      const theta = sideAngle(SHELF_SIDES[0] as number)
      const inward = HEXAGON_APOTHEM - BOOK_DEPTH / 2
      const along = (p.x - Math.cos(theta) * inward) * -Math.sin(theta) +
        (p.z - Math.sin(theta) * inward) * Math.cos(theta)
      expect(Math.abs(along) + BOOK_WIDTH / 2).toBeLessThan(demiMur)
    }
  })

  it('decale chaque galerie sans rien deformer', () => {
    const ici = bookPlacement(2, 1, 7)
    const ailleurs = bookPlacement(2, 1, 7, { x: 50, z: -30 })
    expect(ailleurs.x).toBeCloseTo(ici.x + 50, 10)
    expect(ailleurs.z).toBeCloseTo(ici.z - 30, 10)
    expect(ailleurs.y).toBe(ici.y)
    expect(ailleurs.rotY).toBe(ici.rotY)
  })

  it('refuse un mur hors bornes', () => {
    expect(() => bookPlacement(WALLS_PER_HEXAGON, 0, 0)).toThrow(RangeError)
  })
})
