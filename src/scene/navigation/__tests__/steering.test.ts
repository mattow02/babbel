import { describe, expect, it } from 'vitest'
import {
  DEAD_ZONE,
  MAX_PITCH,
  MAX_PITCH_RATE,
  MAX_YAW_RATE,
  MIN_PITCH,
  clampPitch,
  steerRates,
} from '../steering.ts'

const ECRAN = { width: 1000, height: 800 }
const centre = { x: 500, y: 400 }

describe('steerRates', () => {
  it('ne tourne pas quand le curseur vise au centre', () => {
    expect(steerRates(centre, ECRAN)).toEqual({ yaw: -0, pitch: -0 })
  })

  it('ne tourne pas dans toute la zone morte', () => {
    const bordZoneMorte = 500 + (DEAD_ZONE * 0.99 * 1000) / 2
    expect(steerRates({ x: bordZoneMorte, y: 400 }, ECRAN).yaw).toBe(-0)
  })

  it('tourne vers la droite quand le curseur va a droite', () => {
    expect(steerRates({ x: 990, y: 400 }, ECRAN).yaw).toBeLessThan(0)
  })

  it('tourne vers la gauche quand le curseur va a gauche', () => {
    expect(steerRates({ x: 10, y: 400 }, ECRAN).yaw).toBeGreaterThan(0)
  })

  it('leve les yeux quand le curseur monte', () => {
    expect(steerRates({ x: 500, y: 10 }, ECRAN).pitch).toBeGreaterThan(0)
  })

  it('ne depasse jamais la vitesse maximale', () => {
    for (const p of [{ x: 0, y: 0 }, { x: 1000, y: 800 }, { x: 0, y: 800 }]) {
      const r = steerRates(p, ECRAN)
      expect(Math.abs(r.yaw)).toBeLessThanOrEqual(MAX_YAW_RATE + 1e-9)
      expect(Math.abs(r.pitch)).toBeLessThanOrEqual(MAX_PITCH_RATE + 1e-9)
    }
  })

  it('croit sans a-coup au sortir de la zone morte', () => {
    // Deux echantillons voisins juste apres la zone morte doivent etre proches :
    // c'est ce qui evite le sursaut desagreable.
    const x1 = 500 + ((DEAD_ZONE + 0.01) * 1000) / 2
    const x2 = 500 + ((DEAD_ZONE + 0.03) * 1000) / 2
    const d = Math.abs(steerRates({ x: x2, y: 400 }, ECRAN).yaw - steerRates({ x: x1, y: 400 }, ECRAN).yaw)
    expect(d).toBeLessThan(0.05)
  })

  it('resiste a une fenetre de taille nulle', () => {
    expect(steerRates(centre, { width: 0, height: 0 })).toEqual({ yaw: 0, pitch: 0 })
  })
})

describe('clampPitch', () => {
  it('empeche de se retourner completement', () => {
    expect(clampPitch(10)).toBe(MAX_PITCH)
    expect(clampPitch(-10)).toBe(MIN_PITCH)
    expect(clampPitch(0.2)).toBe(0.2)
  })
})
