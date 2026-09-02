import { describe, expect, it } from 'vitest'
import { NearestFilter } from 'three'
import { degradeToon } from '../toon.ts'

describe('le degrade a paliers', () => {
  it('lit au plus proche voisin', () => {
    // Sans ce filtrage, le navigateur interpole entre deux paliers et le
    // rendu redevient un degrade continu : tout le parti pris disparait, et
    // rien dans l'image ne dit pourquoi.
    const t = degradeToon()
    expect(t.minFilter).toBe(NearestFilter)
    expect(t.magFilter).toBe(NearestFilter)
  })

  it('donne autant de valeurs que de paliers demandes', () => {
    expect(degradeToon(3).image.width).toBe(3)
    expect(degradeToon(5).image.width).toBe(5)
  })

  it('va du noir au blanc', () => {
    const d = degradeToon(4).image.data as Uint8Array
    expect(d[0]).toBe(0)
    expect(d[d.length - 1]).toBe(255)
  })

  it('ecrase le bas de l echelle', () => {
    // A pas egal, l ombre serait trop claire et le sujet ne se detacherait pas
    // du fond. Le deuxieme palier doit rester nettement sous la moitie.
    const d = degradeToon(3).image.data as Uint8Array
    expect(d[1]).toBeLessThan(110)
  })

  it('ne s effondre pas sur un seul palier', () => {
    expect(() => degradeToon(1)).not.toThrow()
  })
})
