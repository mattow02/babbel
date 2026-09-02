import { describe, expect, it } from 'vitest'
import { SHELVES_PER_WALL, VOLUMES_PER_SHELF, WALLS_PER_HEXAGON } from '../../core/index.ts'
import { TRANCHES_ATTENDUES, galerie } from '../perspective.ts'

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
