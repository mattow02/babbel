import { describe, expect, it } from 'vitest'
import { CHARS_PER_LINE, LINES_PER_PAGE } from '../../../core/index.ts'
import { CHAR_RATIO, MARGIN, pageLayout } from '../pageLayout.ts'

describe('pageLayout', () => {
  it('fait tenir les 80 caracteres dans la page', () => {
    for (const [w, h] of [[1024, 1024], [512, 900], [2048, 1200], [700, 2000]] as const) {
      const g = pageLayout(w, h)
      expect(g.textWidth).toBeLessThanOrEqual(w * (1 - 2 * MARGIN) + 1e-9)
    }
  })

  it('fait tenir les 40 lignes dans la page', () => {
    for (const [w, h] of [[1024, 1024], [512, 900], [2048, 1200], [700, 2000]] as const) {
      const g = pageLayout(w, h)
      expect(g.textHeight).toBeLessThanOrEqual(h * (1 - 2 * MARGIN) + 1e-9)
    }
  })

  it('centre le bloc de texte', () => {
    const g = pageLayout(1000, 800)
    const droite = g.left + g.textWidth
    expect(g.left).toBeCloseTo(1000 - droite, 6)
  })

  it('laisse toujours une marge', () => {
    const g = pageLayout(1024, 1024)
    expect(g.left).toBeGreaterThan(1024 * MARGIN * 0.5)
    expect(g.top - g.fontSize).toBeGreaterThan(0)
  })

  it('se cale sur la contrainte la plus serree', () => {
    // Une page tres large est bornee par sa hauteur, et inversement.
    const large = pageLayout(4000, 500)
    expect(large.textHeight).toBeCloseTo(500 * (1 - 2 * MARGIN), 0)
    const haute = pageLayout(500, 4000)
    expect(haute.textWidth).toBeCloseTo(500 * (1 - 2 * MARGIN), 0)
  })

  it('garde la derniere ligne dans la page', () => {
    const g = pageLayout(1024, 1024)
    const basDeLaDerniere = g.top + (LINES_PER_PAGE - 1) * g.lineHeight
    expect(basDeLaDerniere).toBeLessThan(1024)
  })

  it('garde le dernier caractere dans la page', () => {
    const g = pageLayout(1024, 1024)
    expect(g.left + CHARS_PER_LINE * g.fontSize * CHAR_RATIO).toBeLessThan(1024)
  })

  it('grandit proportionnellement a la toile', () => {
    const petite = pageLayout(512, 512)
    const grande = pageLayout(1024, 1024)
    expect(grande.fontSize).toBeCloseTo(petite.fontSize * 2, 6)
  })
})
