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

/** Un balustre : deux points, et de quoi savoir a quelle distance il se tient. */
export interface Balustre {
  readonly bas: Point
  readonly haut: Point
  readonly largeur: number
  /** De 0 (au fond) a 1 (devant) : sert a l'epaisseur et a l'ordre de dessin. */
  readonly proximite: number
}

/** Le puits d'aeration au milieu de la galerie, et sa balustrade tres basse. */
export interface Puits {
  readonly centre: Point
  readonly rx: number
  readonly ry: number
  /** La main courante : meme rayon horizontal, mais plus haute et plus plate. */
  readonly rampeY: number
  readonly rampeRy: number
  readonly balustres: readonly Balustre[]
}

/** Combien de balustres font le tour. Assez pour que la courbe se lise. */
const BALUSTRES = 34

/** Ou commence et ou finit la trouee, en fraction du sol visible. */
const BORD_FOND = 0.25
const BORD_PRES = 0.67
/** Quelle part de la largeur de la salle elle prend, a sa hauteur. */
const EMPRISE = 0.7
/** La hauteur de la balustrade, en projection, au bord lointain puis au bord proche. */
const RAMPE_FOND = 0.16
const RAMPE_PRES = 0.36

/**
 * Le puits, deduit de la salle.
 *
 * Il ne s'ecrit pas en coordonnees mais en fractions du sol visible, et c'est
 * ce qui permet de verifier la seule chose qui compte ici : la trouee est dans
 * la piece. Elle l'avait quitte. La balustrade montait plus haut que la ligne
 * de sol du mur du fond, et la porte semblait donc flotter au-dessus d'elle.
 */
export function puits(g: Galerie): Puits {
  const solFond = g.zaguan[0].y
  const profondeur = g.hauteur - solFond

  const fond = solFond + BORD_FOND * profondeur
  const pres = solFond + BORD_PRES * profondeur
  const cy = (fond + pres) / 2
  const ry = (pres - fond) / 2

  // La salle s'evase vers nous : sa demi-largeur a la hauteur du puits se lit
  // sur le sol, entre le mur du fond et le bas du cadre.
  const t = (cy - solFond) / profondeur
  const demiFond = g.largeur / 2 - g.zaguan[0].x
  const demiSalle = demiFond + (g.largeur / 2 - demiFond) * t
  const rx = EMPRISE * demiSalle

  const rampeFond = fond - RAMPE_FOND * (pres - fond)
  const rampePres = pres - RAMPE_PRES * (pres - fond)
  const rampeY = (rampeFond + rampePres) / 2
  const rampeRy = (rampePres - rampeFond) / 2

  const balustres: Balustre[] = []
  for (let i = 0; i < BALUSTRES; i += 1) {
    const a = (2 * Math.PI * i) / BALUSTRES
    const x = g.largeur / 2 + rx * Math.cos(a)
    // Un montant est vertical, et le reste en perspective a un point : les
    // deux ellipses partagent donc le meme rayon horizontal.
    const proximite = (Math.sin(a) + 1) / 2
    balustres.push({
      bas: { x, y: cy + ry * Math.sin(a) },
      haut: { x, y: rampeY + rampeRy * Math.sin(a) },
      largeur: 2.6 + 4.4 * proximite,
      proximite,
    })
  }

  return { centre: { x: g.largeur / 2, y: cy }, rx, ry, rampeY, rampeRy, balustres }
}

/** Le nombre de volumes qu'une galerie montre. Tous, et pas un de plus. */
export const TRANCHES_ATTENDUES = WALLS_PER_HEXAGON * SHELVES_PER_WALL * VOLUMES_PER_SHELF
