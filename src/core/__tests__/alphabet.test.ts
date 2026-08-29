import { describe, expect, it } from 'vitest'
import { ALPHABET, RADIX, isSymbol, symbolOf, valueOf } from '../alphabet.ts'

describe('alphabet', () => {
  it('compte les 25 symboles de Borges', () => {
    expect(RADIX).toBe(25)
    expect(ALPHABET).toHaveLength(25)
  })

  it("est fait de 22 lettres, l'espace, la virgule et le point", () => {
    const letters = [...ALPHABET].filter((char) => /[a-z]/.test(char))
    expect(letters).toHaveLength(22)
    expect(ALPHABET).toContain(' ')
    expect(ALPHABET).toContain(',')
    expect(ALPHABET).toContain('.')
  })

  it('ne contient aucun doublon', () => {
    expect(new Set(ALPHABET).size).toBe(RADIX)
  })

  it("place l'espace en zero, pour que la page zero soit blanche", () => {
    expect(symbolOf(0)).toBe(' ')
  })

  it('fait correspondre valeur et symbole dans les deux sens', () => {
    for (let value = 0; value < RADIX; value += 1) {
      expect(valueOf(symbolOf(value))).toBe(value)
    }
  })

  it('rejette ce qui nappartient pas au jeu', () => {
    for (const intruder of ['A', 'j', 'k', 'w', 'x', '1', ';', 'é']) {
      expect(isSymbol(intruder)).toBe(false)
      expect(() => valueOf(intruder)).toThrow(RangeError)
    }
    expect(() => symbolOf(RADIX)).toThrow(RangeError)
    expect(() => symbolOf(-1)).toThrow(RangeError)
  })
})
