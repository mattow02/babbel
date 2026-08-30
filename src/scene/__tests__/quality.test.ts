import { describe, expect, it } from 'vitest'
import { levelFor, profileFor, type Capabilities } from '../quality.ts'

const ORDINATEUR: Capabilities = {
  coarsePointer: false,
  memory: 16,
  cores: 12,
  width: 1920,
  reducedMotion: false,
}

describe('levelFor', () => {
  it('donne tout a une machine de bureau confortable', () => {
    expect(levelFor(ORDINATEUR)).toBe('complet')
  })

  it('respecte AVANT TOUT la demande de sobriete', () => {
    // Meme sur la machine la plus puissante : ce n'est pas une question de
    // puissance, c'est une question de respect.
    expect(levelFor({ ...ORDINATEUR, reducedMotion: true })).toBe('minimal')
  })

  it('reduit des quon touche du doigt', () => {
    expect(levelFor({ ...ORDINATEUR, coarsePointer: true })).toBe('reduit')
  })

  it('descend au minimum sur un telephone modeste', () => {
    expect(
      levelFor({ coarsePointer: true, memory: 4, cores: 4, width: 390, reducedMotion: false }),
    ).toBe('minimal')
  })

  it('reduit sur un petit ecran, meme a la souris', () => {
    expect(levelFor({ ...ORDINATEUR, width: 600 })).toBe('reduit')
  })

  it('reduit quand la memoire ou les coeurs manquent', () => {
    expect(levelFor({ ...ORDINATEUR, memory: 4 })).toBe('reduit')
    expect(levelFor({ ...ORDINATEUR, cores: 4 })).toBe('reduit')
  })

  it('ne se fie pas a une information absente', () => {
    expect(levelFor({ ...ORDINATEUR, memory: undefined, cores: undefined })).toBe('complet')
  })
})

describe('profileFor', () => {
  it('degrade dans le bon sens, sans jamais remonter', () => {
    const complet = profileFor(ORDINATEUR)
    const reduit = profileFor({ ...ORDINATEUR, coarsePointer: true })
    const minimal = profileFor({ ...ORDINATEUR, reducedMotion: true })

    expect(complet.dpr).toBeGreaterThanOrEqual(reduit.dpr)
    expect(reduit.dpr).toBeGreaterThanOrEqual(minimal.dpr)
    expect(complet.dust).toBeGreaterThan(reduit.dust)
    expect(reduit.dust).toBeGreaterThan(minimal.dust)
    expect(complet.depth).toBeGreaterThanOrEqual(minimal.depth)
  })

  it('coupe les ombres des quon degrade : elles coutent six rendus par lampe', () => {
    expect(profileFor(ORDINATEUR).shadows).toBe(true)
    expect(profileFor({ ...ORDINATEUR, coarsePointer: true }).shadows).toBe(false)
  })

  it('saute la sequence d arrivee quand on demande moins d animations', () => {
    expect(profileFor({ ...ORDINATEUR, reducedMotion: true }).sequence).toBe(false)
    expect(profileFor(ORDINATEUR).sequence).toBe(true)
  })

  it('garde toujours au moins la galerie courante', () => {
    for (const caps of [ORDINATEUR, { ...ORDINATEUR, reducedMotion: true }]) {
      expect(profileFor(caps).depth).toBeGreaterThanOrEqual(0)
    }
  })
})
