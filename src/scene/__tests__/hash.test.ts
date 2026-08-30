import { describe, expect, it } from 'vitest'
import { hash32, jitterOf, unitOf } from '../hash.ts'

describe('hash32', () => {
  it('est deterministe', () => {
    expect(hash32(42)).toBe(hash32(42))
  })

  it('rend des valeurs distinctes pour des indices voisins', () => {
    const vus = new Set<number>()
    for (let i = 0; i < 4096; i += 1) vus.add(hash32(i))
    expect(vus.size).toBe(4096)
  })

  it("n'a PAS de structure lineaire : les ecarts consecutifs ne se repetent pas", () => {
    // C'est tout l'interet de ce module. Une simple multiplication echoue ici.
    const ecarts = new Set<number>()
    for (let i = 1; i < 500; i += 1) ecarts.add(hash32(i) - hash32(i - 1))
    expect(ecarts.size).toBeGreaterThan(480)
  })

  it('repartit uniformement sur tout lintervalle', () => {
    const seaux = new Array<number>(10).fill(0)
    for (let i = 0; i < 20000; i += 1) {
      const seau = Math.floor(unitOf(i) * 10)
      seaux[seau] = (seaux[seau] ?? 0) + 1
    }
    for (const compte of seaux) {
      expect(compte).toBeGreaterThan(1700)
      expect(compte).toBeLessThan(2300)
    }
  })
})

describe('jitterOf', () => {
  it('reste centre sur zero', () => {
    let somme = 0
    for (let i = 0; i < 5000; i += 1) somme += jitterOf(i)
    expect(Math.abs(somme / 5000)).toBeLessThan(0.02)
  })

  it('reste dans les bornes', () => {
    for (let i = 0; i < 1000; i += 1) {
      expect(jitterOf(i)).toBeGreaterThanOrEqual(-0.5)
      expect(jitterOf(i)).toBeLessThan(0.5)
    }
  })
})
