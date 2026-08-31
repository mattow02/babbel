import { describe, expect, it } from 'vitest'
import { PORTAL_HEIGHT, PORTAL_Z } from '../dimensions.ts'
import { STAIR_TOP_Y } from '../landscape.ts'
import { ARRIVAL, ARRIVAL_STEP, OPENING, SHOTS, THRESHOLD_DURATION, cameraAt } from '../sequence.ts'

describe('la sequence darrivee', () => {
  it('dure moins de trente secondes', () => {
    /*
     * Le critere de sortie de la phase parle des trente premieres secondes.
     * La borne basse a baisse le jour ou la sequence a cesse de traverser le
     * batiment : elle amene devant l'entree, et rend la main. Ce qui suit
     * n'est plus du montage, c'est de la marche.
     */
    expect(THRESHOLD_DURATION).toBeGreaterThan(12)
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

  it('s arrete DEVANT l entree, sans jamais la franchir', () => {
    // Tout le sens du lieu tient la : c'est le visiteur qui entre, pas le film.
    for (let t = 0; t <= THRESHOLD_DURATION + 30; t += 0.1) {
      expect(cameraAt(t).position.z).toBeGreaterThan(PORTAL_Z)
    }
  })

  it('finit face au portail, a hauteur d homme, a quelques pas du seuil', () => {
    const fin = cameraAt(THRESHOLD_DURATION)
    expect(fin.position.x).toBe(0)
    expect(fin.lookAt.x).toBe(0)
    expect(fin.position.z - PORTAL_Z).toBeCloseTo(ARRIVAL_STEP, 6)
    expect(fin.position.y - STAIR_TOP_Y).toBeLessThan(2)
    // Le regard porte dans le portail, entre le sol et le linteau.
    expect(fin.lookAt.y - STAIR_TOP_Y).toBeGreaterThan(0)
    expect(fin.lookAt.y - STAIR_TOP_Y).toBeLessThan(PORTAL_HEIGHT)
  })

  it('rend la main exactement la ou le dernier plan s arrete', () => {
    const fin = cameraAt(THRESHOLD_DURATION)
    expect(ARRIVAL.position2.x).toBe(fin.position.x)
    expect(ARRIVAL.position2.z).toBe(fin.position.z)
    expect(ARRIVAL.position.y).toBe(STAIR_TOP_Y)
  })

  it('reste toujours au-dessus du sol', () => {
    for (let t = 0; t <= THRESHOLD_DURATION; t += 0.1) {
      expect(cameraAt(t).position.y).toBeGreaterThan(1)
    }
  })
})
