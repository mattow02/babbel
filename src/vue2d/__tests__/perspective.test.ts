import { describe, expect, it } from 'vitest'
import { SHELVES_PER_WALL, VOLUMES_PER_SHELF, WALLS_PER_HEXAGON } from '../../core/index.ts'
import { TRANCHES_ATTENDUES, galerie, puits } from '../perspective.ts'

const G = galerie()

describe('la galerie dessinee', () => {
  it('montre les 640 volumes, et pas un de plus', () => {
    // Ce n'est pas un detail decoratif : chaque tranche porte une adresse, et
    // une tranche manquante serait un livre qu'on ne peut pas ouvrir.
    expect(G.tranches).toHaveLength(TRANCHES_ATTENDUES)
    expect(TRANCHES_ATTENDUES).toBe(640)
  })

  it('couvre chaque adresse une seule fois', () => {
    const vues = new Set(G.tranches.map((t) => `${t.wall}/${t.shelf}/${t.volume}`))
    expect(vues.size).toBe(TRANCHES_ATTENDUES)
  })

  it('numerote les murs de 0 a 3 et les etageres de 0 a 4', () => {
    expect(new Set(G.tranches.map((t) => t.wall))).toEqual(new Set([0, 1, 2, 3]))
    expect(WALLS_PER_HEXAGON).toBe(4)
    expect(new Set(G.tranches.map((t) => t.shelf)).size).toBe(SHELVES_PER_WALL)
    expect(new Set(G.tranches.map((t) => t.volume)).size).toBe(VOLUMES_PER_SHELF)
  })

  it('pose cinq etageres par mur, sur toute la hauteur', () => {
    expect(G.etageres).toHaveLength(WALLS_PER_HEXAGON * SHELVES_PER_WALL)
    // La plus haute doit friser le plafond : le texte ne laisse pas de mur nu.
    const hauteurs = G.etageres.map((e) => e.de.y)
    expect(Math.min(...hauteurs)).toBeLessThan(G.hauteur * 0.22)
  })

  it('range les volumes du plus proche au plus lointain', () => {
    // La proximite sert a l'ordre de dessin et a la couleur : sans elle, un
    // volume du fond se dessinerait par-dessus un volume du premier plan.
    for (const t of G.tranches) {
      expect(t.proximite).toBeGreaterThan(0)
      expect(t.proximite).toBeLessThanOrEqual(1)
    }
    const proches = G.tranches.filter((t) => t.wall === 0)
    const lointains = G.tranches.filter((t) => t.wall === 1)
    const moyenne = (l: typeof proches) => l.reduce((s, t) => s + t.proximite, 0) / l.length
    expect(moyenne(proches)).toBeGreaterThan(moyenne(lointains))
  })

  it('fuit vers un point unique', () => {
    // Deux points de fuite, et la salle se tord. On verifie que les aretes
    // hautes des pans convergent bien vers le meme point.
    const gauche = G.pans.find((p) => p.wall === 1)!
    const droite = G.pans.find((p) => p.wall === 3)!
    expect(Math.abs(gauche.coins[2].x - G.fuite.x)).toBeLessThan(G.largeur * 0.22)
    expect(Math.abs(droite.coins[2].x - G.fuite.x)).toBeLessThan(G.largeur * 0.22)
  })

  it('s adapte au cadre qu on lui donne', () => {
    // Un telephone n'a pas le meme cadre qu un grand ecran : aucune
    // coordonnee ne doit etre ecrite en dur.
    const petite = galerie({ largeur: 360, hauteur: 640, regard: 0.44 })
    expect(petite.largeur).toBe(360)
    expect(Math.max(...petite.tranches.flatMap((t) => t.coins.map((c) => c.x)))).toBeLessThanOrEqual(360)
  })
})

describe('le puits', () => {
  const g = galerie()
  const p = puits(g)
  const solFond = g.zaguan[0].y

  /*
   * LE test de ce module.
   *
   * Une trouee dans le sol ne peut pas remonter au-dela du pied du mur du
   * fond, et une balustrade posee dessus encore moins. Quand elle le faisait,
   * la porte du fond paraissait flotter au-dessus de la rambarde : c'est
   * exactement le defaut qu'on a vu a l'ecran.
   */
  it('reste dans la piece, balustrade comprise', () => {
    expect(p.centre.y - p.ry).toBeGreaterThan(solFond)
    expect(p.rampeY - p.rampeRy).toBeGreaterThan(solFond)
    for (const b of p.balustres) {
      expect(b.haut.y).toBeGreaterThan(solFond)
    }
  })

  it('ne deborde pas non plus par le bas du cadre', () => {
    expect(p.centre.y + p.ry).toBeLessThan(g.hauteur)
  })

  it('tient dans la largeur du sol a sa hauteur', () => {
    // Le sol s'evase du mur du fond jusqu'au bas du cadre : on relit la meme
    // interpolation, et le puits doit rester dedans.
    const t = (p.centre.y - solFond) / (g.hauteur - solFond)
    const demi = g.largeur / 2 - g.zaguan[0].x + (g.zaguan[0].x - 0) * t
    expect(p.rx).toBeLessThan(demi)
    expect(p.rx).toBeGreaterThan(demi * 0.5)
  })

  it('a une balustrade basse : elle monte moins que la trouee n’est profonde', () => {
    expect(p.rampeY).toBeLessThan(p.centre.y)
    expect(p.centre.y - p.rampeY).toBeLessThan(p.ry)
  })

  it('dresse des montants, tous vers le haut et tous verticaux', () => {
    expect(p.balustres).toHaveLength(34)
    for (const b of p.balustres) {
      expect(b.haut.y).toBeLessThan(b.bas.y)
      expect(b.haut.x).toBeCloseTo(b.bas.x, 6)
    }
  })

  it('epaissit les montants proches, et les garde symetriques', () => {
    const proche = p.balustres.reduce((a, b) => (b.proximite > a.proximite ? b : a))
    const loin = p.balustres.reduce((a, b) => (b.proximite < a.proximite ? b : a))
    expect(proche.largeur).toBeGreaterThan(loin.largeur * 2)

    const gauche = p.balustres.filter((b) => b.bas.x < g.largeur / 2 - 1)
    const droite = p.balustres.filter((b) => b.bas.x > g.largeur / 2 + 1)
    expect(gauche).toHaveLength(droite.length)
  })
})
