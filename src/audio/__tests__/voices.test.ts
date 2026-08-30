import { describe, expect, it } from 'vitest'
import { DRONE, MASTER_GAIN, NOISE_GAIN, brownNoise } from '../voices.ts'

describe('le bourdon', () => {
  it('reste dans le grave', () => {
    for (const voice of DRONE) {
      expect(voice.frequency).toBeGreaterThan(30)
      expect(voice.frequency).toBeLessThan(200)
    }
  })

  it("n'est pas un accord : aucune voix n'est un harmonique exact d'une autre", () => {
    // Des rapports entiers donneraient de la musique. On veut une rumeur.
    for (const a of DRONE) {
      for (const b of DRONE) {
        if (a === b) continue
        const rapport = Math.max(a.frequency, b.frequency) / Math.min(a.frequency, b.frequency)
        expect(Math.abs(rapport - Math.round(rapport))).toBeGreaterThan(0.02)
      }
    }
  })

  it('respire a des rythmes tous differents', () => {
    const souffles = DRONE.map((v) => v.breath)
    expect(new Set(souffles).size).toBe(souffles.length)
  })

  it('reste discret : la somme des gains ne sature pas', () => {
    const total = DRONE.reduce((sum, v) => sum + v.gain, 0) + NOISE_GAIN
    expect(total * MASTER_GAIN).toBeLessThan(0.5)
  })

  it('decroit avec la hauteur, comme un vrai spectre', () => {
    const triees = [...DRONE].sort((a, b) => a.frequency - b.frequency)
    for (let i = 1; i < triees.length; i += 1) {
      expect(triees[i]?.gain).toBeLessThan(triees[i - 1]?.gain ?? 0)
    }
  })
})

describe('brownNoise', () => {
  it('produit le nombre dechantillons demande', () => {
    expect(brownNoise(1000)).toHaveLength(1000)
  })

  it('ne sature jamais', () => {
    const bruit = brownNoise(200000)
    for (const echantillon of bruit) {
      expect(Math.abs(echantillon)).toBeLessThanOrEqual(1)
    }
  })

  it('ne derive pas : la moyenne reste proche de zero', () => {
    const bruit = brownNoise(200000)
    let somme = 0
    for (const e of bruit) somme += e
    expect(Math.abs(somme / bruit.length)).toBeLessThan(0.1)
  })

  it('gronde au lieu de siffler : lenergie est dans le grave', () => {
    // Un bruit brun varie lentement. On compare l'ecart entre echantillons
    // voisins a l'amplitude generale : il doit etre bien plus petit.
    const bruit = brownNoise(50000, mulberry(1))
    let variation = 0
    let amplitude = 0
    for (let i = 1; i < bruit.length; i += 1) {
      variation += Math.abs((bruit[i] as number) - (bruit[i - 1] as number))
      amplitude += Math.abs(bruit[i] as number)
    }
    expect(variation / amplitude).toBeLessThan(0.5)
  })

  it('est reproductible avec une source deterministe', () => {
    expect(brownNoise(500, mulberry(42))).toEqual(brownNoise(500, mulberry(42)))
  })
})

/** Petit generateur deterministe, pour que les tests ne dependent pas du hasard. */
function mulberry(seed: number): () => number {
  let a = seed
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
