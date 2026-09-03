import { describe, expect, it } from 'vitest'
import { PILIERS_ATTENDUS, hall } from '../hall.ts'

const h = hall()
const axe = h.largeur / 2

describe('le hall', () => {
  it('porte ses deux files de piliers', () => {
    expect(h.piliers).toHaveLength(PILIERS_ATTENDUS)
    expect(h.piliers.filter((p) => p.cote === -1)).toHaveLength(PILIERS_ATTENDUS / 2)
  })

  /*
   * LE test de ce module.
   *
   * Un hall a un axe, et un axe se prouve. Le Seuil a deja coute une colonnade
   * decentree de douze pixels que rien ne signalait : ici, la symetrie est
   * verifiee, pas esperee.
   */
  it('est symetrique, pilier par pilier', () => {
    const gauche = h.piliers.filter((p) => p.cote === -1)
    const droite = h.piliers.filter((p) => p.cote === 1)
    for (const [i, g] of gauche.entries()) {
      const d = droite[i]!
      expect(d.proximite).toBeCloseTo(g.proximite, 9)
      for (const [j, coin] of g.coins.entries()) {
        expect(d.coins[j]!.x).toBeCloseTo(2 * axe - coin.x, 9)
        expect(d.coins[j]!.y).toBeCloseTo(coin.y, 9)
      }
    }
  })

  it('fait converger la nef : un pilier lointain est plus etroit et plus court', () => {
    const file = h.piliers.filter((p) => p.cote === -1)
    const large = (p: (typeof file)[number]): number => Math.abs(p.coins[1].x - p.coins[0].x)
    const haut = (p: (typeof file)[number]): number => Math.abs(p.coins[0].y - p.coins[3].y)
    for (let i = 1; i < file.length; i += 1) {
      expect(large(file[i]!)).toBeLessThan(large(file[i - 1]!))
      expect(haut(file[i]!)).toBeLessThan(haut(file[i - 1]!))
      expect(file[i]!.proximite).toBeLessThan(file[i - 1]!.proximite)
    }
  })

  it('garde la nef dans le cadre', () => {
    for (const p of h.piliers) {
      for (const c of p.coins) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.x).toBeLessThanOrEqual(h.largeur)
      }
    }
  })

  it('tourne ses arcs vers le haut, entre deux piliers voisins', () => {
    expect(h.arcs).toHaveLength(PILIERS_ATTENDUS - 2)
    for (const a of h.arcs) {
      expect(a.sommet.y).toBeLessThan(Math.min(a.de.y, a.a.y))
      expect(Math.sign(a.de.x - axe)).toBe(a.cote)
    }
  })
})

describe('le cube d’or', () => {
  const c = h.cube

  it('est un carre, et il est sur l’axe', () => {
    const large = c.avant[1].x - c.avant[0].x
    const haut = c.avant[0].y - c.avant[3].y
    expect(large).toBeCloseTo(haut, 6)
    expect((c.avant[0].x + c.avant[1].x) / 2).toBeCloseTo(axe, 9)
    expect((c.socleFace[0].x + c.socleFace[1].x) / 2).toBeCloseTo(axe, 9)
  })

  /* « Un cube qui flotte proche du sol, avec un socle a sa base. » */
  it('flotte, et de peu', () => {
    const arete = c.avant[1].x - c.avant[0].x
    expect(c.levitation).toBeGreaterThan(0)
    expect(c.levitation).toBeLessThan(arete / 4)
  })

  it('deborde de son socle par le haut, jamais par les cotes', () => {
    expect(c.avant[0].x).toBeGreaterThan(c.socleFace[0].x)
    expect(c.avant[1].x).toBeLessThan(c.socleFace[1].x)
    expect(c.socleFace[0].y).toBeGreaterThan(c.socleDessus[0].y)
  })

  /*
   * On voit le dessus d'un cube pose plus bas que l'oeil : sa face
   * superieure doit donc tomber SOUS la ligne d'horizon, sans quoi le cube se
   * lit comme un carre peint sur le fond.
   */
  it('montre son dessus, donc il est sous le regard', () => {
    expect(c.avant[3].y).toBeGreaterThan(h.fuite.y)
    for (const p of c.dessus) {
      expect(p.y).toBeGreaterThan(h.fuite.y)
    }
    expect(c.dessus[2].y).toBeLessThan(c.dessus[1].y)
  })

  it('pose son socle sur le sol de la salle', () => {
    expect(c.socleFace[0].y).toBeLessThan(h.hauteur)
    expect(c.socleFace[0].y).toBeGreaterThan(h.fuite.y)
  })
})

describe('le plafond', () => {
  it('a autant de nervures en travers que de travees', () => {
    expect(h.travees).toHaveLength(6)
  })

  /*
   * Poussee jusqu'au point de fuite, une fuyante traverse toute la salle et
   * passe devant le cube : le plafond se lit alors comme un fil de fer tendu
   * au-dessus du vide. Elle s'arrete a la derniere travee.
   */
  it('arrete ses fuyantes a la derniere travee, pas au point de fuite', () => {
    const fond = h.travees[h.travees.length - 1]!
    for (const n of h.fuyantes) {
      expect(n.a.y).toBeCloseTo(fond.gauche.y, 6)
      expect(n.a.y).toBeLessThan(h.fuite.y)
      expect(n.de.y).toBeLessThan(n.a.y)
    }
  })

  it('garde ses fuyantes symetriques', () => {
    const xs = h.fuyantes.map((n) => n.de.x).sort((a, b) => a - b)
    expect(xs[0]! + xs[xs.length - 1]!).toBeCloseTo(h.largeur, 6)
    expect(xs[2]).toBeCloseTo(h.largeur / 2, 6)
  })
})
