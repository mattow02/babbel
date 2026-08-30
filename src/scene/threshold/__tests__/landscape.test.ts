import { describe, expect, it } from 'vitest'
import {
  ATRIUM_COLUMNS,
  ATRIUM_RADIUS,
  CYPRESS_PER_RING,
  DOME_BASE_Y,
  DOME_RADIUS,
  STAIR_COUNT,
  STAIR_RISE,
  TERRACE_HEIGHTS,
  TERRACE_RADII,
} from '../dimensions.ts'
import { STAIR_TOP_Y, atriumColumns, cypressRing, domeCoffers, stairSteps } from '../landscape.ts'

describe('les cypres', () => {
  it('forment deux anneaux complets', () => {
    for (const ring of [0, 1]) {
      expect(cypressRing(ring)).toHaveLength(CYPRESS_PER_RING[ring] as number)
    }
  })

  it('se posent sur le bon rayon et la bonne terrasse', () => {
    for (const ring of [0, 1]) {
      for (const tree of cypressRing(ring)) {
        expect(Math.hypot(tree.x, tree.z)).toBeCloseTo(TERRACE_RADII[ring] as number, 6)
        expect(tree.y).toBe(TERRACE_HEIGHTS[ring])
      }
    }
  })

  it('ne sont pas parfaitement alignes : un alignement parfait trahirait la machine', () => {
    const trees = cypressRing(0)
    const angles = trees.map((t) => Math.atan2(t.z, t.x))
    const ecarts: number[] = []
    for (let i = 1; i < angles.length; i += 1) {
      ecarts.push((angles[i] as number) - (angles[i - 1] as number))
    }
    const uniques = new Set(ecarts.map((e) => e.toFixed(6)))
    expect(uniques.size).toBeGreaterThan(10)
  })

  it('reste deterministe : deux appels donnent le meme bosquet', () => {
    expect(cypressRing(0)).toEqual(cypressRing(0))
  })

  it('refuse un anneau inconnu', () => {
    expect(() => cypressRing(7)).toThrow(RangeError)
  })
})

describe('lescalier dhonneur', () => {
  it('compte le bon nombre de marches', () => {
    expect(stairSteps(96)).toHaveLength(STAIR_COUNT)
  })

  it('monte regulierement jusqua la terrasse', () => {
    const steps = stairSteps(96)
    for (let i = 1; i < steps.length; i += 1) {
      expect((steps[i]?.y ?? 0) - (steps[i - 1]?.y ?? 0)).toBeCloseTo(STAIR_RISE, 10)
    }
    expect(STAIR_TOP_Y).toBeCloseTo(STAIR_COUNT * STAIR_RISE, 10)
  })

  it('arrive a la hauteur de la terrasse basse', () => {
    expect(STAIR_TOP_Y).toBeCloseTo(TERRACE_HEIGHTS[1] as number, 1)
  })

  it('avance vers le monument a chaque marche', () => {
    const steps = stairSteps(96)
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]?.z ?? 0).toBeLessThan(steps[i - 1]?.z ?? 0)
    }
  })
})

describe('le grand hall', () => {
  it('ceinture le hall de colonnes regulierement espacees', () => {
    const columns = atriumColumns()
    expect(columns).toHaveLength(ATRIUM_COLUMNS)
    for (const column of columns) {
      expect(Math.hypot(column.x, column.z)).toBeCloseTo(ATRIUM_RADIUS - 1.6, 6)
    }
  })

  it('habille la coupole de caissons sans jamais boucher loculus', () => {
    const coffers = domeCoffers(DOME_RADIUS * 0.55, DOME_BASE_Y)
    expect(coffers.length).toBeGreaterThan(80)
    const sommet = Math.max(...coffers.map((c) => c.y))
    // Il reste de la place au-dessus du dernier anneau : c'est l'oculus.
    expect(sommet).toBeLessThan(DOME_BASE_Y + DOME_RADIUS * 0.55 * 0.95)
  })

  it('resserre les caissons a mesure quon monte', () => {
    const coffers = domeCoffers(20, 0)
    const parHauteur = new Map<string, number>()
    for (const c of coffers) {
      const cle = c.y.toFixed(3)
      parHauteur.set(cle, (parHauteur.get(cle) ?? 0) + 1)
    }
    const comptes = [...parHauteur.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map((e) => e[1])
    expect(comptes[0] as number).toBeGreaterThan(comptes[comptes.length - 1] as number)
  })
})
