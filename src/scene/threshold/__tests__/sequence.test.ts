import { describe, expect, it } from 'vitest'
import { CUBE_Y, PORTAL_Z } from '../dimensions.ts'
import { INSIDE_AT, OPENING, SHOTS, THRESHOLD_DURATION, cameraAt, isInside } from '../sequence.ts'

describe('la sequence darrivee', () => {
  it('dure moins de trente secondes', () => {
    // Le critere de sortie de la phase parle des trente premieres secondes.
    expect(THRESHOLD_DURATION).toBeGreaterThan(20)
    expect(THRESHOLD_DURATION).toBeLessThanOrEqual(30)
  })

  it('commence exactement au plan d ouverture', () => {
    expect(cameraAt(0).position).toEqual(OPENING.position)
  })

  it('finit sur le dernier plan, et y reste', () => {
    const dernier = SHOTS[SHOTS.length - 1]
    expect(cameraAt(THRESHOLD_DURATION).position).toEqual(dernier?.position)
    expect(cameraAt(THRESHOLD_DURATION + 60).position).toEqual(dernier?.position)
  })

  it('avance toujours vers le monument, sans jamais reculer', () => {
    let precedent = Number.POSITIVE_INFINITY
    for (let t = 0; t <= THRESHOLD_DURATION; t += 0.1) {
      const z = cameraAt(t).position.z
      expect(z).toBeLessThanOrEqual(precedent + 1e-6)
      precedent = z
    }
  })

  it('ne saute jamais : le mouvement est continu', () => {
    // Un saut de camera trahirait un raccord rate entre deux plans.
    let precedent = cameraAt(0).position
    for (let t = 0.02; t <= THRESHOLD_DURATION; t += 0.02) {
      const p = cameraAt(t).position
      const bond = Math.hypot(p.x - precedent.x, p.y - precedent.y, p.z - precedent.z)
      expect(bond).toBeLessThan(2)
      precedent = p
    }
  })

  it('franchit l entree, puis se retrouve dans le hall', () => {
    expect(isInside(0)).toBe(false)
    expect(isInside(INSIDE_AT - 0.1)).toBe(false)
    expect(isInside(INSIDE_AT)).toBe(true)
    expect(isInside(THRESHOLD_DURATION)).toBe(true)
  })

  it('est bien passe derriere le portail au moment ou lon entre', () => {
    expect(cameraAt(INSIDE_AT).position.z).toBeLessThan(PORTAL_Z)
  })

  it('finit face au cube', () => {
    const fin = cameraAt(THRESHOLD_DURATION)
    // A hauteur du cube, a un metre pres : le cadrage vise legerement sous son
    // centre pour qu'il ne soit pas colle au bord haut de l'image.
    expect(Math.abs(fin.lookAt.y - CUBE_Y)).toBeLessThan(1.5)
    expect(fin.lookAt.x).toBe(0)
    expect(fin.position.z).toBeGreaterThan(0)
  })

  it('reste toujours au-dessus du sol', () => {
    for (let t = 0; t <= THRESHOLD_DURATION; t += 0.1) {
      expect(cameraAt(t).position.y).toBeGreaterThan(1)
    }
  })
})
