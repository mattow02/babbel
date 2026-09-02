import { describe, expect, it } from 'vitest'
import { ecarts, mesurerPhotometrie, type Photometrie } from '../photometrie.ts'

/** Une image unie, de la valeur donnee. */
function unie(valeur: number, largeur = 32, hauteur = 32): Uint8ClampedArray {
  const p = new Uint8ClampedArray(largeur * hauteur * 4)
  for (let i = 0; i < p.length; i += 4) {
    p[i] = valeur
    p[i + 1] = valeur
    p[i + 2] = valeur
    p[i + 3] = 255
  }
  return p
}

/** Un damier de 1 px : la surface la plus « texturee » possible. */
function damier(largeur = 32, hauteur = 32): Uint8ClampedArray {
  const p = new Uint8ClampedArray(largeur * hauteur * 4)
  for (let y = 0; y < hauteur; y += 1) {
    for (let x = 0; x < largeur; x += 1) {
      const v = (x + y) % 2 === 0 ? 0 : 255
      const i = (y * largeur + x) * 4
      p[i] = v
      p[i + 1] = v
      p[i + 2] = v
      p[i + 3] = 255
    }
  }
  return p
}

describe('la photometrie', () => {
  it('refuse un tampon qui ne correspond pas aux dimensions', () => {
    // Mesurer un tampon tronque rendrait des nombres plausibles et faux, ce
    // qui est pire que pas de nombre du tout.
    expect(() => mesurerPhotometrie(new Uint8ClampedArray(16), 32, 32)).toThrow()
  })

  it('donne une variation nulle sur une surface unie', () => {
    // C'est la grandeur qui doit attraper un mur sans matiere. Si elle ne
    // vaut pas zero ici, elle ne veut rien dire ailleurs.
    expect(mesurerPhotometrie(unie(128), 32, 32).variationLocale).toBeCloseTo(0, 10)
  })

  it('donne une variation forte sur un damier', () => {
    expect(mesurerPhotometrie(damier(), 32, 32).variationLocale).toBeGreaterThan(0.4)
  })

  it('linearise avant de mesurer', () => {
    // Un gris a mi-course en sRGB vaut environ 21 % de luminance, pas 50 %.
    // Sans linearisation, toutes les ombres paraissent deux fois trop claires
    // et les criteres du plan seraient atteints a tort.
    const m = mesurerPhotometrie(unie(128), 32, 32)
    expect(m.mediane).toBeGreaterThan(0.18)
    expect(m.mediane).toBeLessThan(0.25)
  })

  it('compte les noirs et les hautes lumieres brulees', () => {
    const m = mesurerPhotometrie(damier(), 32, 32)
    expect(m.partNoirs).toBeCloseTo(0.5, 2)
    expect(m.partBrulees).toBeCloseTo(0.5, 2)
  })

  it('mesure un contraste de un sur une image unie', () => {
    expect(mesurerPhotometrie(unie(200), 32, 32).contraste).toBeCloseTo(1, 6)
  })

  it('mesure le contraste maximal sur un damier noir et blanc', () => {
    // 21:1, la meme valeur que le noir sur blanc en accessibilite : c'est la
    // borne haute, et elle sert de garde-fou a la formule.
    expect(mesurerPhotometrie(damier(), 32, 32).contraste).toBeCloseTo(21, 0)
  })

  it('dit en clair ce qui manque pour atteindre un objectif', () => {
    // Un nombre sous un seuil ne dit pas quoi corriger. La phrase, si.
    const plate: Photometrie = {
      p5: 0.001, mediane: 0.02, p95: 0.05, contraste: 2,
      partNoirs: 0.57, partBrulees: 0, variationLocale: 0.006,
    }
    const manques = ecarts(plate, { p95Min: 0.6, contrasteMin: 10, variationMin: 0.05 })
    expect(manques).toHaveLength(3)
    expect(manques.join(' ')).toContain('surfaces plates')
  })

  it('ne signale rien quand l objectif est atteint', () => {
    const bonne: Photometrie = {
      p5: 0.002, mediane: 0.3, p95: 0.81, contraste: 16.8,
      partNoirs: 0.34, partBrulees: 0.001, variationLocale: 0.072,
    }
    expect(ecarts(bonne, { p95Min: 0.6, contrasteMin: 10, variationMin: 0.05, bruleesMax: 0.01 })).toEqual([])
  })
})
