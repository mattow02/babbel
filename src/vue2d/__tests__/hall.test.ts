import { describe, expect, it } from 'vitest'
import { PILIERS_ATTENDUS, hall, type Quad } from '../hall.ts'

const h = hall()
const axe = h.largeur / 2
const large = (q: Quad): number => Math.abs(q[1].x - q[0].x)
const haut = (q: Quad): number => Math.abs(q[0].y - q[3].y)

describe('la nef', () => {
  it('porte ses deux files de piliers, en trois morceaux chacun', () => {
    expect(h.piliers).toHaveLength(PILIERS_ATTENDUS)
    expect(h.piliers.filter((p) => p.cote === -1)).toHaveLength(PILIERS_ATTENDUS / 2)
  })

  /*
   * LE test de ce module.
   *
   * Un hall a un axe, et un axe se prouve. Le Seuil a deja coute une colonnade
   * decentree de douze pixels que rien ne signalait : ici, la symetrie est
   * verifiee, pas esperee, et elle l'est point par point.
   */
  it('est symetrique, morceau par morceau', () => {
    const gauche = h.piliers.filter((p) => p.cote === -1)
    const droite = h.piliers.filter((p) => p.cote === 1)
    for (const [i, g] of gauche.entries()) {
      const d = droite[i]!
      expect(d.proximite).toBeCloseTo(g.proximite, 9)
      for (const morceau of ['base', 'fut', 'chapiteau'] as const) {
        for (const [j, coin] of g[morceau].entries()) {
          expect(d[morceau][j]!.x).toBeCloseTo(2 * axe - coin.x, 9)
          expect(d[morceau][j]!.y).toBeCloseTo(coin.y, 9)
        }
      }
    }
  })

  it('donne a chaque pilier un pied et une tete plus larges que son fut', () => {
    for (const p of h.piliers) {
      expect(large(p.base)).toBeLessThan(large(p.fut))
      expect(large(p.chapiteau)).toBeLessThan(large(p.fut))
      expect(p.base[3].y).toBeLessThan(p.base[0].y)
      expect(p.chapiteau[3].y).toBeLessThan(p.fut[3].y)
    }
  })

  it('fait converger la nef : un pilier lointain est plus etroit et plus court', () => {
    const file = h.piliers.filter((p) => p.cote === -1)
    for (let i = 1; i < file.length; i += 1) {
      expect(large(file[i]!.fut)).toBeLessThan(large(file[i - 1]!.fut))
      expect(haut(file[i]!.fut)).toBeLessThan(haut(file[i - 1]!.fut))
      expect(file[i]!.proximite).toBeLessThan(file[i - 1]!.proximite)
    }
  })

  it('garde tout dans le cadre', () => {
    for (const p of h.piliers) {
      for (const c of [...p.base, ...p.fut, ...p.chapiteau]) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.x).toBeLessThanOrEqual(h.largeur)
      }
    }
  })

  it('ferme son arcade jusqu’au mur du fond', () => {
    expect(h.arcs).toHaveLength(PILIERS_ATTENDUS)
    for (const a of h.arcs) {
      expect(a.sommet.y).toBeLessThan(Math.min(a.de.y, a.a.y))
      // Le bandeau a une epaisseur : l'extrados passe au-dessus de l'intrados.
      expect(a.sommetHaut.y).toBeLessThan(a.sommet.y)
      expect(a.deHaut.y).toBeLessThan(a.de.y)
      expect(Math.sign(a.de.x - axe)).toBe(a.cote)
    }
  })
})

describe('les bas-cotes', () => {
  it('portent des rayonnages, et non du noir', () => {
    expect(h.tablettes).toHaveLength(10)
    expect(h.tablettes.filter((t) => t.cote === -1)).toHaveLength(5)
  })

  it('fait fuir chaque tablette vers le fond', () => {
    for (const t of h.tablettes) {
      expect(Math.abs(t.a.x - axe)).toBeLessThan(Math.abs(t.de.x - axe))
      expect(Math.sign(t.de.x - axe)).toBe(t.cote)
    }
  })
})

describe('le puits de lumiere', () => {
  it('est sur l’axe, dans la voute, et au-dessus du cube', () => {
    expect(h.puits.centre.x).toBeCloseTo(axe, 9)
    expect(h.puits.centre.y).toBeLessThan(h.fuite.y)
    expect(h.puits.centre.y).toBeLessThan(h.cube.avant[3].y)
    expect(h.puits.rx).toBeGreaterThan(h.puits.ry)
  })

  /*
   * Une voute haute repousse le plafond loin au-dessus du cadre : un puits
   * perce trop pres du premier plan sort de l'image, et rien ne le signale
   * puisque le SVG se contente de ne pas le dessiner. C'est arrive.
   */
  it('reste DANS le cadre, entierement', () => {
    expect(h.puits.centre.y - h.puits.ry).toBeGreaterThan(0)
    expect(h.puits.centre.y + h.puits.ry).toBeLessThan(h.hauteur)
    expect(h.puits.centre.x - h.puits.rx).toBeGreaterThan(0)
    expect(h.puits.centre.x + h.puits.rx).toBeLessThan(h.largeur)
  })
})

describe('le cube d’or', () => {
  const c = h.cube

  it('est un carre, et il est sur l’axe', () => {
    expect(c.avant[1].x - c.avant[0].x).toBeCloseTo(c.avant[0].y - c.avant[3].y, 6)
    expect((c.avant[0].x + c.avant[1].x) / 2).toBeCloseTo(axe, 9)
    expect((c.socleFace[0].x + c.socleFace[1].x) / 2).toBeCloseTo(axe, 9)
  })

  /* « Il faudrait que le cube flotte un peu plus. » */
  it('flotte franchement, mais reste au-dessus de son socle', () => {
    const arete = c.avant[1].x - c.avant[0].x
    expect(c.levitation).toBeGreaterThan(arete / 3)
    expect(c.levitation).toBeLessThan(arete)
  })

  it('deborde de son socle par le haut, jamais par les cotes', () => {
    expect(c.avant[0].x).toBeGreaterThan(c.socleFace[0].x)
    expect(c.avant[1].x).toBeLessThan(c.socleFace[1].x)
    expect(c.socleFace[0].y).toBeGreaterThan(c.socleDessus[0].y)
  })

  /*
   * On voit le dessus d'un cube pose plus bas que l'oeil : sa face superieure
   * doit tomber SOUS la ligne d'horizon, sans quoi le cube se lit comme un
   * carre peint sur le fond.
   */
  it('montre son dessus, donc il est sous le regard', () => {
    for (const p of c.dessus) {
      expect(p.y).toBeGreaterThan(h.fuite.y)
    }
    expect(c.dessus[2].y).toBeLessThan(c.dessus[1].y)
  })
})

describe('celui qui porte le monde', () => {
  const s = h.porteur

  it('se tient sur l’axe, au fond de la nef', () => {
    expect(s.cx).toBeCloseTo(axe, 9)
    expect(s.globe.centre.x).toBeCloseTo(axe, 9)
    expect(s.sol).toBeGreaterThan(h.fuite.y)
    expect(s.sol).toBeLessThan(h.hauteur)
  })

  it('est colossal : il occupe plus du tiers de la hauteur du cadre', () => {
    const total = s.sol - (s.globe.centre.y - s.globe.r)
    expect(total).toBeGreaterThan(h.hauteur / 3)
  })

  it('ecarte les coudes plus que les epaules, pour que le cube passe entre eux', () => {
    expect(s.demiCoudes).toBeGreaterThan(s.demiEpaules)
    expect(s.demiCoudes).toBeGreaterThan((h.cube.avant[1].x - h.cube.avant[0].x) / 2)
  })

  /* Le globe REPOSE sur les epaules : son bas doit passer au-dessus d'elles,
     sinon il avale la tete et la statue n'a plus de visage. */
  it('tient son globe au-dessus des epaules, sous la voute', () => {
    expect(s.globe.centre.y + s.globe.r).toBeLessThan(s.epaules)
    expect(s.globe.centre.y - s.globe.r).toBeGreaterThan(0)
  })
})

describe('le plafond', () => {
  /*
   * Poussee jusqu'au point de fuite, une fuyante traverse toute la salle et
   * passe devant le cube : le plafond se lit alors comme un fil de fer tendu
   * au-dessus du vide. Elle s'arrete au mur du fond.
   */
  it('arrete ses fuyantes au fond, pas au point de fuite', () => {
    for (const n of h.fuyantes) {
      expect(n.a.y).toBeLessThan(h.fuite.y)
      expect(n.de.y).toBeLessThan(n.a.y)
    }
  })

  it('garde ses fuyantes symetriques', () => {
    const xs = h.fuyantes.map((n) => n.de.x).sort((a, b) => a - b)
    expect(xs[0]! + xs[xs.length - 1]!).toBeCloseTo(h.largeur, 6)
  })
})
