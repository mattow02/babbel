import { describe, expect, it } from 'vitest'
import {
  CADENCE_PLANCHER,
  doitBaisser,
  niveauInferieur,
  profilBaisse,
  profileFor,
} from '../quality.ts'

const CAPACITES = {
  coarsePointer: false,
  memory: 16,
  cores: 12,
  width: 1920,
  reducedMotion: false,
}

describe('la qualite qui se corrige elle-meme', () => {
  it('ne baisse pas sur une seule fenetre', () => {
    // Un a-coup isole ne dit rien : un chargement, un onglet qui revient au
    // premier plan. Baisser la-dessus degraderait l image pour rien.
    expect(doitBaisser('complet', [12])).toBe(false)
  })

  it('baisse apres deux fenetres sous le plancher', () => {
    expect(doitBaisser('complet', [12, 14])).toBe(true)
  })

  it('ne baisse pas si la cadence est revenue', () => {
    expect(doitBaisser('complet', [12, 58])).toBe(false)
  })

  it('ne descend jamais sous le minimum', () => {
    expect(doitBaisser('minimal', [5, 5, 5])).toBe(false)
    expect(niveauInferieur('minimal')).toBe('minimal')
  })

  it('ignore une cadence nulle, qui veut dire « pas encore mesure »', () => {
    expect(doitBaisser('complet', [0, 0])).toBe(false)
  })

  it('coupe les ombres au premier cran', () => {
    // Une lumiere ponctuelle avec ombres coute six rendus de la scene par
    // image : c est le premier poste a sacrifier, et de loin le plus lourd.
    const complet = profileFor(CAPACITES)
    expect(complet.level).toBe('complet')
    expect(complet.shadows).toBe(true)
    const baisse = profilBaisse(complet)
    expect(baisse.level).toBe('reduit')
    expect(baisse.shadows).toBe(false)
  })

  it('garde le post-traitement au premier cran, et le lache au second', () => {
    // On sacrifie d abord ce qui ne se voit pas, avant ce qui fait l image.
    const reduit = profilBaisse(profileFor(CAPACITES))
    expect(reduit.fullEffects).toBe(true)
    expect(profilBaisse(reduit).fullEffects).toBe(false)
  })

  it('place le plancher la ou le deplacement devient penible', () => {
    expect(CADENCE_PLANCHER).toBeGreaterThanOrEqual(30)
    expect(CADENCE_PLANCHER).toBeLessThanOrEqual(50)
  })
})
