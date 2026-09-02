import { describe, expect, it } from 'vitest'
import { BATTEMENTS, DUREE_TOTALE, INVITE, battementA } from '../intro.ts'

describe("l'introduction", () => {
  it('commence au premier battement', () => {
    expect(battementA(0)).toBe(0)
  })

  it('ne peut pas commencer avant le debut', () => {
    expect(battementA(-500)).toBe(0)
  })

  it('enchaine les battements dans l’ordre, sans trou ni recouvrement', () => {
    let debut = 0
    for (const [i, battement] of BATTEMENTS.entries()) {
      expect(battementA(debut)).toBe(i)
      expect(battementA(debut + battement.duree - 1)).toBe(i)
      debut += battement.duree
    }
  })

  it('se termine, et le dit', () => {
    expect(battementA(DUREE_TOTALE)).toBe(-1)
    expect(battementA(DUREE_TOTALE + 60000)).toBe(-1)
  })

  /*
   * Une introduction qui s'eternise est une introduction qu'on saute. Ce test
   * n'est pas une verification de style : il tient la promesse faite au
   * visiteur, qui est de le laisser entrer vite.
   */
  it('ne retient pas le visiteur plus de douze secondes', () => {
    expect(DUREE_TOTALE).toBeLessThanOrEqual(12000)
    expect(DUREE_TOTALE).toBeGreaterThan(6000)
  })

  it('dit quoi faire, et le geste designe la porte', () => {
    expect(INVITE).toContain('porte')
  })
})
