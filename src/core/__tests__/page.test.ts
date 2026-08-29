import { describe, expect, it } from 'vitest'
import { ALPHABET, RADIX, symbolOf } from '../alphabet.ts'
import { type Address, toPath } from '../address.ts'
import { PAGE_COUNT } from '../bijection.ts'
import { CHARS_PER_LINE, CHARS_PER_PAGE, LINES_PER_PAGE } from '../layout.ts'
import { contentToText, locate, pageAt, textToContent, toLines } from '../page.ts'

const SAMPLE: Address = { hexagon: 987654321n, wall: 1, shelf: 2, volume: 9, page: 137 }

describe('conversion en base 25', () => {
  it('rend une page entierement blanche pour le contenu zero', () => {
    expect(contentToText(0n)).toBe(' '.repeat(CHARS_PER_PAGE))
  })

  it('rend la toute derniere page possible pour le contenu maximal', () => {
    const lastSymbol = symbolOf(RADIX - 1)
    expect(contentToText(PAGE_COUNT - 1n)).toBe(lastSymbol.repeat(CHARS_PER_PAGE))
  })

  it('place bien les poids : le contenu 1 ne change que le dernier caractere', () => {
    const text = contentToText(1n)
    expect(text.slice(0, -1)).toBe(' '.repeat(CHARS_PER_PAGE - 1))
    expect(text.at(-1)).toBe(symbolOf(1))
  })

  it('fait laller-retour texte <-> contenu', () => {
    for (const content of [0n, 1n, 25n, 12345678901234567890n, PAGE_COUNT - 1n]) {
      expect(textToContent(contentToText(content))).toBe(content)
    }
  })

  it('refuse un texte qui na pas exactement 3 200 caracteres', () => {
    expect(() => textToContent('trop court')).toThrow(RangeError)
    expect(() => textToContent(' '.repeat(CHARS_PER_PAGE + 1))).toThrow(RangeError)
  })
})

describe('pageAt', () => {
  const text = pageAt(SAMPLE)

  it('respecte le format de Borges', () => {
    expect(text).toHaveLength(CHARS_PER_PAGE)
    expect(CHARS_PER_PAGE).toBe(3200)
  })

  it("n'emploie que les 25 symboles", () => {
    for (const char of text) {
      expect(ALPHABET).toContain(char)
    }
  })

  it('est deterministe : la meme adresse rend toujours la meme page', () => {
    expect(pageAt(SAMPLE)).toBe(text)
    expect(pageAt({ ...SAMPLE })).toBe(text)
  })

  it('rend des pages differentes pour des pages voisines du meme livre', () => {
    const pages = new Set<string>()
    for (let page = 1; page <= 20; page += 1) {
      pages.add(pageAt({ ...SAMPLE, page }))
    }
    expect(pages.size).toBe(20)
  })

  it('rend des pages differentes pour des volumes voisins', () => {
    const pages = new Set<string>()
    for (let volume = 0; volume < 20; volume += 1) {
      pages.add(pageAt({ ...SAMPLE, volume }))
    }
    expect(pages.size).toBe(20)
  })

  it('produit un texte qui a lair aleatoire', () => {
    // Chaque symbole devrait apparaitre environ 3200/25 = 128 fois.
    // On verifie seulement qu'aucun ne domine ni ne disparait.
    const counts = new Map<string, number>()
    for (const char of text) {
      counts.set(char, (counts.get(char) ?? 0) + 1)
    }
    expect(counts.size).toBeGreaterThan(20)
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(60)
      expect(count).toBeLessThan(220)
    }
  })
})

describe('locate : la recherche inverse', () => {
  it("retrouve l'adresse d'une page qu'on vient de lire", () => {
    expect(locate(pageAt(SAMPLE))).toEqual(SAMPLE)
  })

  it('trouve ou se cache une phrase choisie', () => {
    const phrase = 'la bibliotheque est totale, ses etageres consignent toutes les combinaisons.'
    const address = locate(phrase)
    const found = pageAt(address)
    expect(found.startsWith(phrase)).toBe(true)
    expect(found.slice(phrase.length)).toBe(' '.repeat(CHARS_PER_PAGE - phrase.length))
  })

  it('trouve une page entierement blanche', () => {
    const address = locate('')
    expect(pageAt(address)).toBe(' '.repeat(CHARS_PER_PAGE))
  })

  it("donne une adresse partageable et l'URL revient au meme texte", () => {
    // Note : ni j, ni k, ni w, ni x ne sont dans les 22 lettres de Borges.
    // Le titre meme de la video de reference est intraduisible dans son alphabet.
    const phrase = 'viens, on va te montrer l infini.'
    const address = locate(phrase)
    expect(toPath(address)).toMatch(/^[0-9a-z]+\/\d\/\d\/\d+\/\d+$/)
    expect(pageAt(address).startsWith(phrase)).toBe(true)
  })

  it('refuse un texte trop long ou hors alphabet', () => {
    expect(() => locate('a'.repeat(CHARS_PER_PAGE + 1))).toThrow(RangeError)
    expect(() => locate('MAJUSCULES')).toThrow(RangeError)
  })
})

describe('toLines', () => {
  it('decoupe en 40 lignes de 80 caracteres', () => {
    const lines = toLines(pageAt(SAMPLE))
    expect(lines).toHaveLength(LINES_PER_PAGE)
    for (const line of lines) {
      expect(line).toHaveLength(CHARS_PER_LINE)
    }
    expect(lines.join('')).toBe(pageAt(SAMPLE))
  })

  it('refuse une page mal dimensionnee', () => {
    expect(() => toLines('court')).toThrow(RangeError)
  })
})
