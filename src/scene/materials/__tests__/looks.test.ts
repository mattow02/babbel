import { describe, expect, it } from 'vitest'
import { LOOKS, lookDemande } from '../looks.ts'

describe('les directions visuelles', () => {
  it('portent des noms uniques et une phrase qui les distingue', () => {
    expect(new Set(LOOKS.map((l) => l.nom)).size).toBe(LOOKS.length)
    for (const l of LOOKS) expect(l.resume.length, l.nom).toBeGreaterThan(30)
  })

  it('couvrent un vrai ecart, pas cinq nuances du meme', () => {
    // Cinq variantes qui se ressemblent ne font pas choisir : elles font
    // hesiter. On verifie qu on propose au moins deux nombres de paliers et
    // deux epaisseurs de trait nettement differentes.
    expect(new Set(LOOKS.map((l) => l.paliers)).size).toBeGreaterThanOrEqual(3)
    const traits = LOOKS.map((l) => l.trait)
    expect(Math.max(...traits) / Math.min(...traits)).toBeGreaterThan(2.5)
  })

  it('retombe sur la premiere quand on demande n importe quoi', () => {
    expect(lookDemande('').nom).toBe(LOOKS[0]!.nom)
    expect(lookDemande('?look=abc').nom).toBe(LOOKS[0]!.nom)
    expect(lookDemande('?look=99').nom).toBe(LOOKS[0]!.nom)
    expect(lookDemande('?look=-1').nom).toBe(LOOKS[0]!.nom)
  })

  it('applique celle qu on demande', () => {
    expect(lookDemande('?look=2').nom).toBe(LOOKS[2]!.nom)
    expect(lookDemande('?sonde&look=1').nom).toBe(LOOKS[1]!.nom)
  })
})
