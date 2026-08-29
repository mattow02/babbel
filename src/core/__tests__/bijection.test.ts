import { describe, expect, it } from 'vitest'
import { BITS, PAGE_COUNT, forward, inverse } from '../bijection.ts'
import { CHARS_PER_PAGE } from '../layout.ts'
import { RADIX_BIG } from '../alphabet.ts'

/** Tirage deterministe dans [0, PAGE_COUNT), pour que les echecs soient rejouables. */
function pseudoRandomLocations(count: number, seed: bigint): bigint[] {
  const values: bigint[] = []
  let state = seed
  for (let index = 0; index < count; index += 1) {
    // Un LCG 64 bits suffit a produire des graines variees ; on l'etire
    // ensuite sur toute la largeur du domaine.
    let wide = 0n
    for (let chunk = 0; chunk < BITS; chunk += 32) {
      state = (state * 6364136223846793005n + 1442695040888963407n) & ((1n << 64n) - 1n)
      wide = (wide << 32n) | (state >> 32n)
    }
    values.push(wide % PAGE_COUNT)
  }
  return values
}

describe('domaine', () => {
  it('compte exactement 25^3200 pages', () => {
    expect(PAGE_COUNT).toBe(RADIX_BIG ** BigInt(CHARS_PER_PAGE))
  })

  it('travaille sur 14 861 bits', () => {
    expect(BITS).toBe(14861)
  })

  it('choisit la plus petite puissance de deux qui contient le domaine', () => {
    expect(1n << BigInt(BITS)).toBeGreaterThan(PAGE_COUNT)
    expect(1n << BigInt(BITS - 1)).toBeLessThanOrEqual(PAGE_COUNT)
  })

  it('ne demande que 1,58 tour de cycle walking en moyenne', () => {
    // C'est le prix paye pour n'avoir aucun cas particulier. Voir bijection.ts.
    const ratio = Number(((1n << BigInt(BITS)) * 1000n) / PAGE_COUNT) / 1000
    expect(ratio).toBeCloseTo(1.58, 2)
  })
})

describe('la bijection', () => {
  it("LE test du projet : inverse(forward(x)) === x, sur 2 000 tirages", () => {
    for (const location of pseudoRandomLocations(2000, 0xbabe1n)) {
      expect(inverse(forward(location))).toBe(location)
    }
  })

  it('et dans lautre sens : forward(inverse(y)) === y', () => {
    for (const content of pseudoRandomLocations(500, 0x5eedn)) {
      expect(forward(inverse(content))).toBe(content)
    }
  })

  it('traite correctement les bornes du domaine', () => {
    for (const edge of [0n, 1n, 2n, PAGE_COUNT - 2n, PAGE_COUNT - 1n]) {
      expect(inverse(forward(edge))).toBe(edge)
    }
  })

  it('ne sort jamais du domaine', () => {
    for (const location of pseudoRandomLocations(200, 0xf00dn)) {
      const content = forward(location)
      expect(content).toBeGreaterThanOrEqual(0n)
      expect(content).toBeLessThan(PAGE_COUNT)
    }
  })

  it('est injective : 1 000 emplacements distincts donnent 1 000 contenus distincts', () => {
    const locations = pseudoRandomLocations(1000, 0xc0ffeen)
    const contents = new Set(locations.map((location) => forward(location).toString(36)))
    expect(contents.size).toBe(locations.length)
  })

  it('refuse un argument hors domaine', () => {
    expect(() => forward(-1n)).toThrow(RangeError)
    expect(() => forward(PAGE_COUNT)).toThrow(RangeError)
    expect(() => inverse(-1n)).toThrow(RangeError)
    expect(() => inverse(PAGE_COUNT)).toThrow(RangeError)
  })
})

describe('le desordre', () => {
  it('deux emplacements voisins donnent des contenus sans rapport', () => {
    // Exigence 3 de bijection.ts : c'est ce qui manquait a un LCG nu.
    // On compare les 64 bits de poids faible de contenus consecutifs.
    const seen = new Set<string>()
    for (let offset = 0n; offset < 64n; offset += 1n) {
      seen.add((forward(offset) & 0xffffffffffffffffn).toString(36))
    }
    expect(seen.size).toBe(64)
  })

  it('les contenus de pages consecutives different sur pres de la moitie des bits', () => {
    const a = forward(1000n)
    const b = forward(1001n)
    let differing = 0
    const difference = a ^ b
    for (let bit = 0n; bit < 2048n; bit += 1n) {
      if ((difference >> bit) & 1n) differing += 1
    }
    // Un melange correct fait basculer environ un bit sur deux.
    expect(differing).toBeGreaterThan(2048 * 0.4)
    expect(differing).toBeLessThan(2048 * 0.6)
  })
})
