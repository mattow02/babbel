import { describe, expect, it } from 'vitest'
import {
  TURN_SWAP_AT,
  breathe,
  coverAngle,
  easeInOut,
  easeOut,
  easeOutBack,
  turnAngle,
} from '../animation.ts'

describe('les courbes', () => {
  it('partent de zero et arrivent a un', () => {
    for (const f of [easeInOut, easeOut, easeOutBack]) {
      expect(f(0)).toBeCloseTo(0, 6)
      expect(f(1)).toBeCloseTo(1, 6)
    }
  })

  it('ne sortent jamais des bornes du temps', () => {
    for (const f of [easeInOut, easeOut, easeOutBack]) {
      expect(f(-3)).toBeCloseTo(0, 6)
      expect(f(12)).toBeCloseTo(1, 6)
    }
  })

  it('avancent toujours, sauf le depassement qui est voulu', () => {
    for (const f of [easeInOut, easeOut]) {
      let precedent = -1
      for (let t = 0; t <= 1; t += 0.02) {
        const v = f(t)
        expect(v).toBeGreaterThanOrEqual(precedent - 1e-9)
        precedent = v
      }
    }
  })

  it('depasse vraiment, pour donner du poids a larrivee', () => {
    let maximum = 0
    for (let t = 0; t <= 1; t += 0.01) maximum = Math.max(maximum, easeOutBack(t))
    expect(maximum).toBeGreaterThan(1)
    // Mais pas au point de faire un rebond de dessin anime.
    expect(maximum).toBeLessThan(1.12)
  })

  it('demarrent doucement : rien ne part a pleine vitesse', () => {
    expect(easeInOut(0.02)).toBeLessThan(0.02)
  })
})

describe('la couverture', () => {
  it('est rabattue quand le livre est ferme, a plat quand il est ouvert', () => {
    expect(coverAngle(0)).toBeCloseTo(Math.PI, 6)
    expect(coverAngle(1)).toBeCloseTo(0, 6)
  })

  it('ne recule jamais pendant louverture', () => {
    let precedent = Number.POSITIVE_INFINITY
    for (let t = 0; t <= 1; t += 0.02) {
      const a = coverAngle(t)
      expect(a).toBeLessThanOrEqual(precedent + 1e-9)
      precedent = a
    }
  })
})

describe('le tournage de page', () => {
  it('va de la droite vers la gauche, et inversement en arriere', () => {
    expect(turnAngle(0, false)).toBeCloseTo(0, 6)
    expect(turnAngle(1, false)).toBeCloseTo(Math.PI, 6)
    expect(turnAngle(0, true)).toBeCloseTo(Math.PI, 6)
    expect(turnAngle(1, true)).toBeCloseTo(0, 6)
  })

  it('echange les textures a mi-course, quand la page masque ce quelle couvre', () => {
    expect(TURN_SWAP_AT).toBe(0.5)
    // A cet instant precis, la page est perpendiculaire au livre : elle cache
    // ce qu'il y a dessous.
    expect(turnAngle(TURN_SWAP_AT, false)).toBeCloseTo(Math.PI / 2, 6)
  })
})

describe('la respiration', () => {
  it('reste imperceptible : quelques millimetres, pas un balancement', () => {
    for (let t = 0; t < 400; t += 0.37) {
      const r = breathe(t)
      expect(Math.abs(r.x)).toBeLessThan(0.004)
      expect(Math.abs(r.y)).toBeLessThan(0.004)
      expect(Math.abs(r.roll)).toBeLessThan(0.01)
    }
  })

  it('ne se repete pas : les periodes sont incommensurables', () => {
    // Un balancement qui boucle se remarque en quelques secondes.
    const debut = breathe(0)
    let identique = 0
    for (let t = 1; t < 300; t += 0.5) {
      const r = breathe(t)
      if (Math.abs(r.x - debut.x) < 1e-7 && Math.abs(r.y - debut.y) < 1e-7) identique += 1
    }
    expect(identique).toBe(0)
  })

  it('part de presque rien : le livre ne saute pas quand il arrive', () => {
    const r = breathe(0)
    expect(Math.abs(r.x)).toBeLessThan(0.0005)
  })
})
