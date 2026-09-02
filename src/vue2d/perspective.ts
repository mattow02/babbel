import { SHELVES_PER_WALL, VOLUMES_PER_SHELF, WALLS_PER_HEXAGON } from '../core/index.ts'

/**
 * La galerie, en perspective a un point de fuite.
 *
 * On a quitte la 3D : dessiner la bibliotheque coute moins cher que la
 * modeliser, et le dessin est plus beau. Mais le placement reste ce qu'il
 * etait, un probleme de geometrie pure, et il vit donc dans un module pur,
 * teste, sans le moindre composant.
 *
 * La salle est un hexagone dont quatre pans portent les etageres et deux
 * restent libres. On se tient face a l'un des pans libres, l'autre s'ouvrant
 * au fond sur le zaguan : on voit donc les quatre pans garnis, deux a gauche
 * et deux a droite, chacun s'enfoncant vers le point de fuite.
 */

export interface Point {
  readonly x: number
  readonly y: number
}

/** Un volume dessine, et l'adresse qu'il porte. */
export interface Tranche {
  readonly wall: number
  readonly shelf: number
  readonly volume: number
  /** Les quatre coins, dans l'ordre : bas gauche, bas droit, haut droit, haut gauche. */
  readonly coins: readonly [Point, Point, Point, Point]
  /** De 0 (loin) a 1 (pres) : sert a la couleur et a l'ordre de dessin. */
  readonly proximite: number
}

export interface Etagere {
  readonly wall: number
  readonly shelf: number
  readonly de: Point
  readonly a: Point
}

export interface Pan {
  readonly wall: number
  readonly coins: readonly [Point, Point, Point, Point]
  readonly proximite: number
}

export interface Galerie {
  readonly largeur: number
  readonly hauteur: number
  readonly fuite: Point
  readonly pans: readonly Pan[]
  readonly etageres: readonly Etagere[]
  readonly tranches: readonly Tranche[]
  /** L'ouverture du zaguan, au fond. */
  readonly zaguan: readonly [Point, Point, Point, Point]
}

export interface Cadre {
  readonly largeur: number
  readonly hauteur: number
  /** Hauteur du regard, en fraction de la hauteur du cadre. */
  readonly regard: number
}

const CADRE: Cadre = { largeur: 1000, hauteur: 620, regard: 0.44 }

/** Les quatre pans garnis, du plus proche au plus lointain, de chaque cote. */
const ECARTS = [1.0, 0.66, 0.4] as const
const PROFONDEURS = [0, 0.36, 0.66] as const

function fuir(p: Point, t: number, fuite: Point): Point {
  return { x: fuite.x + (p.x - fuite.x) * (1 - t), y: fuite.y + (p.y - fuite.y) * (1 - t) }
}

/**
 * Construit la scene.
 *
 * Tout est deduit du cadre : aucune coordonnee n'est ecrite en dur, pour que
 * la meme scene tienne sur un telephone comme sur un grand ecran.
 */
export function galerie(cadre: Cadre = CADRE): Galerie {
  const { largeur, hauteur } = cadre
  const fuite: Point = { x: largeur / 2, y: hauteur * cadre.regard }
  const sol = hauteur
  const plafond = -hauteur * 0.06

  const pans: Pan[] = []
  const etageres: Etagere[] = []
  const tranches: Tranche[] = []

  // Les murs sont numerotes comme les adresses : 0 et 1 a gauche, 2 et 3 a
  // droite, du plus proche au plus lointain. C'est arbitraire mais fixe, et
  // c'est ce qui permet de cliquer un volume et de savoir lequel c'est.
  let wall = 0
  for (const cote of [-1, 1] as const) {
    for (let seg = 0; seg < 2; seg += 1) {
      const x0 = largeur / 2 + cote * (largeur / 2) * ECARTS[seg]!
      const x1 = largeur / 2 + cote * (largeur / 2) * ECARTS[seg + 1]!
      const t0 = PROFONDEURS[seg]!
      const t1 = PROFONDEURS[seg + 1]!
      const proximite = 1 - (t0 + t1) / 2

      pans.push({
        wall,
        coins: [
          fuir({ x: x0, y: sol }, t0, fuite),
          fuir({ x: x1, y: sol }, t1, fuite),
          fuir({ x: x1, y: plafond }, t1, fuite),
          fuir({ x: x0, y: plafond }, t0, fuite),
        ],
        proximite,
      })

      for (let shelf = 0; shelf < SHELVES_PER_WALL; shelf += 1) {
        // Les cinq etageres occupent TOUTE la hauteur : leur hauteur est celle
        // de l'etage, et elle depasse a peine un bibliothecaire.
        const bas = sol - ((sol - plafond) * (shelf + 0.08)) / SHELVES_PER_WALL
        const haut = sol - ((sol - plafond) * (shelf + 0.94)) / SHELVES_PER_WALL
        etageres.push({
          wall,
          shelf,
          de: fuir({ x: x0, y: bas }, t0, fuite),
          a: fuir({ x: x1, y: bas }, t1, fuite),
        })

        for (let volume = 0; volume < VOLUMES_PER_SHELF; volume += 1) {
          const a = volume / VOLUMES_PER_SHELF
          const b = (volume + 0.86) / VOLUMES_PER_SHELF
          const ta = t0 + (t1 - t0) * a
          const tb = t0 + (t1 - t0) * b
          const xa = x0 + (x1 - x0) * a
          const xb = x0 + (x1 - x0) * b
          tranches.push({
            wall,
            shelf,
            volume,
            coins: [
              fuir({ x: xa, y: bas }, ta, fuite),
              fuir({ x: xb, y: bas }, tb, fuite),
              fuir({ x: xb, y: haut }, tb, fuite),
              fuir({ x: xa, y: haut }, ta, fuite),
            ],
            proximite: 1 - (ta + tb) / 2,
          })
        }
      }
      wall += 1
    }
  }

  const tFond = PROFONDEURS[2]!
  const xf = (largeur / 2) * ECARTS[2]!
  const zaguan: [Point, Point, Point, Point] = [
    fuir({ x: largeur / 2 - xf, y: sol }, tFond, fuite),
    fuir({ x: largeur / 2 + xf, y: sol }, tFond, fuite),
    fuir({ x: largeur / 2 + xf, y: plafond }, tFond, fuite),
    fuir({ x: largeur / 2 - xf, y: plafond }, tFond, fuite),
  ]

  return { largeur, hauteur, fuite, pans, etageres, tranches, zaguan }
}

/** Le nombre de volumes qu'une galerie montre. Tous, et pas un de plus. */
export const TRANCHES_ATTENDUES = WALLS_PER_HEXAGON * SHELVES_PER_WALL * VOLUMES_PER_SHELF
