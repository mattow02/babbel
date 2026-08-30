import { describe, expect, it } from 'vitest'
import { CHARS_PER_PAGE, isSymbol } from '../../core/index.ts'
import { isPure, transcribe } from '../transcribe.ts'

describe('transcribe', () => {
  it('laisse intact ce qui appartient deja a lalphabet', () => {
    const texte = 'la bibliotheque est totale, ses etageres consignent tout.'
    expect(transcribe(texte).text).toBe(texte)
    expect(transcribe(texte).substitutions).toEqual([])
  })

  it('retire les accents', () => {
    expect(transcribe('la bibliothèque à côté').text).toBe('la bibliotheque a cote')
    expect(transcribe('ÉTAGÈRE').text).toBe('etagere')
  })

  it('transcrit les lettres que Borges na pas', () => {
    expect(transcribe('kafka').text).toBe('cafca')
    expect(transcribe('je').text).toBe('ie')
    expect(transcribe('william').text).toBe('villiam')
    expect(transcribe('exquis').text).toBe('ecsquis')
  })

  it('signale ce quil a remplace, une fois par lettre', () => {
    const t = transcribe('kafka joue au xylophone')
    expect(t.substitutions).toEqual([
      { from: 'k', to: 'c' },
      { from: 'j', to: 'i' },
      { from: 'x', to: 'cs' },
    ])
  })

  it('remplace le reste par du blanc, et le signale', () => {
    const t = transcribe('page 410 !')
    expect(t.text).toBe('page ')
    expect(t.dropped).toBe(true)
  })

  it("n'empile jamais deux blancs", () => {
    expect(transcribe('a;;;;b').text).toBe('a b')
  })

  it('ne commence jamais par un blanc parasite', () => {
    expect(transcribe('!!!salut').text).toBe('salut')
    expect(transcribe('   salut').text).toBe('salut')
  })

  it('ne double jamais les blancs, meme tapes a la main', () => {
    expect(transcribe('la    bibliotheque').text).toBe('la bibliotheque')
  })

  it('ne rend QUE des symboles de lalphabet, sur nimporte quelle entree', () => {
    const monstres = [
      'Ça coûte 12 € !',
      '日本語のテキスト',
      'ĲSSELMEER',
      'á̂̃b',
      '<script>alert(1)</script>',
      'ĂĔĬŎŬ ñ ç ø å',
    ]
    for (const monstre of monstres) {
      for (const char of transcribe(monstre).text) {
        expect(isSymbol(char)).toBe(true)
      }
    }
  })

  it('respecte la limite dune page', () => {
    const t = transcribe('a'.repeat(5000), CHARS_PER_PAGE)
    expect(t.text).toHaveLength(CHARS_PER_PAGE)
  })

  it('rend une chaine vide pour une entree vide', () => {
    expect(transcribe('').text).toBe('')
    expect(transcribe('!!!').text).toBe('')
  })
})

describe('isPure', () => {
  it('reconnait un texte deja transcrit', () => {
    expect(isPure('la bibliotheque')).toBe(true)
    expect(isPure('la bibliothèque')).toBe(false)
    expect(isPure('Kafka')).toBe(false)
  })
})
