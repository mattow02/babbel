import { describe, expect, it } from 'vitest'
import { VUES, capVers, vueDemandee, vuePar } from '../vues.ts'

describe('les points de vue de reference', () => {
  it('porte des noms uniques', () => {
    // Deux vues du meme nom, et l URL en designerait une au hasard.
    expect(new Set(VUES.map((v) => v.nom)).size).toBe(VUES.length)
  })

  it('couvre les trois ambiances', () => {
    const etapes = new Set(VUES.map((v) => v.stage))
    expect(etapes).toContain('parvis')
    expect(etapes).toContain('hall')
    expect(etapes).toContain('library')
  })

  it('ne se donne un objectif que la ou il existe une reference mesuree', () => {
    // Trois illustrations mesurees, trois objectifs. S en donner d autres
    // reviendrait a inventer la note qu on se met.
    expect(VUES.filter((v) => v.objectif).map((v) => v.nom)).toEqual(['parvis', 'galerie', 'livre'])
    // Et elles passent en premier : un releve tronque doit d abord contenir
    // celles qui portent un critere de sortie.
    expect(VUES.slice(0, 3).every((v) => v.objectif)).toBe(true)
  })

  it('explique a quoi sert chaque vue', () => {
    for (const v of VUES) expect(v.pourquoi.length, v.nom).toBeGreaterThan(20)
  })

  it('regarde vers -Z quand le cap est nul', () => {
    // La convention vient de `usePlayer` : s en ecarter poserait le visiteur
    // dos a ce qu on voulait montrer, et personne ne le verrait dans un test.
    expect(capVers(0, -1)).toBeCloseTo(0, 10)
    expect(capVers(1, 0)).toBeCloseTo(-Math.PI / 2, 10)
  })

  it('pose le zaguan devant le puits, pas dedans', () => {
    const zaguan = vuePar('zaguan')
    expect(zaguan?.position).toBeDefined()
    const { x, z } = zaguan!.position!
    expect(Math.hypot(x, z)).toBeGreaterThan(1)
  })

  it('ne lit une vue que si l URL en demande une', () => {
    expect(vueDemandee('')).toBeNull()
    expect(vueDemandee('?sonde')).toBeNull()
    expect(vueDemandee('?vue=inconnue')).toBeNull()
    expect(vueDemandee('?vue=galerie')?.nom).toBe('galerie')
    expect(vueDemandee('?sonde&vue=livre')?.livre).toBe(true)
  })
})
