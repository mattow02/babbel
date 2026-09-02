import { describe, expect, it } from 'vitest'
import { dosDe, teinter, usureDe } from '../couleurs.ts'

describe('les couleurs du dessin', () => {
  it('donne toujours la meme couleur a la meme graine', () => {
    // Le contenu de la bibliotheque est une fonction pure de l'adresse ; sa
    // couleur doit l etre aussi, sinon un volume change de dos quand on
    // revient dans la salle.
    expect(dosDe(12345)).toBe(dosDe(12345))
  })

  it('ne defile pas selon un motif', () => {
    // Une multiplication est affine : les couleurs se mettraient a defiler le
    // long de l etagere, et cela SE VOIT (D32).
    const suite = Array.from({ length: 32 }, (_, i) => dosDe(i))
    expect(new Set(suite).size).toBeGreaterThan(6)
    const memeQueDeuxAvant = suite.filter((c, i) => i >= 2 && c === suite[i - 2]).length
    expect(memeQueDeuxAvant).toBeLessThan(10)
  })

  it('couvre tout l ecart de valeur', () => {
    const clartes = Array.from({ length: 400 }, (_, i) => dosDe(i))
      .map((c) => Number.parseInt(c.slice(1, 3), 16))
    expect(Math.min(...clartes)).toBeLessThan(40)
    expect(Math.max(...clartes)).toBeGreaterThan(200)
  })

  it('use chaque volume dans sa propre nuance', () => {
    for (const g of [0, 7, 1234, 99999]) {
      expect(usureDe(g)).toBeGreaterThanOrEqual(0.74)
      expect(usureDe(g)).toBeLessThanOrEqual(1.24)
    }
  })

  it('assombrit sans deborder', () => {
    expect(teinter('#ffffff', 0.5)).toBe('#808080')
    expect(teinter('#ffffff', 2)).toBe('#ffffff')
    expect(teinter('#000000', 0.5)).toBe('#000000')
  })
})
