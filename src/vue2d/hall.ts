import { fuir, type Cadre, type Point } from './perspective.ts'

/**
 * Le hall, en perspective a un point de fuite.
 *
 * On y arrive en poussant la porte du Seuil, et l'on n'est pas encore dans la
 * bibliotheque : c'est le sas entre le plein soleil et les tenebres. Une nef,
 * deux files de piliers, des bas-cotes dans l'ombre, un plafond a caissons, et
 * au bout de l'axe le cube d'or, en levitation au-dessus de son socle.
 *
 * Comme pour la galerie, rien n'est ecrit en coordonnees : tout se deduit du
 * cadre, et tout est verifiable sans navigateur. Un hall a moins d'objets
 * qu'une galerie, mais il a un axe, et un axe se prouve.
 */

/** Un pilier de la nef : sa face avant, et sa distance. */
export interface Pilier {
  readonly coins: readonly [Point, Point, Point, Point]
  readonly cote: -1 | 1
  /** De 0 (au fond) a 1 (devant). */
  readonly proximite: number
}

/** Un arc de l'arcade, entre deux piliers d'une meme file. */
export interface Arc {
  readonly de: Point
  readonly sommet: Point
  readonly a: Point
  readonly cote: -1 | 1
  readonly proximite: number
}

/** Une nervure transversale du plafond. */
export interface Travee {
  readonly gauche: Point
  readonly droite: Point
  readonly proximite: number
}

/**
 * Une nervure longitudinale du plafond.
 *
 * Elle s'arrete a la DERNIERE travee et ne va pas jusqu'au point de fuite :
 * poussee jusque-la, elle traverse toute la salle et le plafond se lit comme
 * un fil de fer tendu au-dessus du vide.
 */
export interface Fuyante {
  readonly de: Point
  readonly a: Point
}

/** Le cube d'or, et le socle qu'il ne touche pas. */
export interface CubeDor {
  readonly avant: readonly [Point, Point, Point, Point]
  readonly dessus: readonly [Point, Point, Point, Point]
  readonly socleFace: readonly [Point, Point, Point, Point]
  readonly socleDessus: readonly [Point, Point, Point, Point]
  /** Le vide entre le bas du cube et le dessus du socle, en pixels. */
  readonly levitation: number
}

export interface Hall {
  readonly largeur: number
  readonly hauteur: number
  readonly fuite: Point
  readonly piliers: readonly Pilier[]
  readonly arcs: readonly Arc[]
  readonly travees: readonly Travee[]
  readonly fuyantes: readonly Fuyante[]
  readonly cube: CubeDor
  /** Les bas-cotes : le fond sombre derriere chaque file. */
  readonly basCotes: readonly (readonly [Point, Point, Point, Point])[]
}

const CADRE: Cadre = { largeur: 1000, hauteur: 620, regard: 0.47 }

/** Demi-largeur de la nef, et epaisseur d'un pilier, en fraction du cadre. */
const NEF = 0.3
const PILIER = 0.055
/** Ou s'arretent les piliers, en fraction de la hauteur de la salle. */
const CHAPITEAU = 0.6
/** La fleche des arcs, dans la meme mesure. */
const FLECHE = 0.13

/** Les six travees, du premier plan vers le fond. */
const TRAVEES = [0, 0.21, 0.375, 0.505, 0.605, 0.68] as const

/** Le cube : ses deux profondeurs, sa demi-arete et sa levitation. */
const CUBE_AVANT = 0.66
const CUBE_ARRIERE = 0.74
const CUBE_DEMI = 0.115
const CUBE_FLOTTE = 0.03
/** Le socle : plus large, plus bas, et il deborde de part et d'autre. */
const SOCLE_AVANT = 0.62
const SOCLE_ARRIERE = 0.78
const SOCLE_DEMI = 0.15
const SOCLE_HAUT = 0.055

export function hall(cadre: Cadre = CADRE): Hall {
  const { largeur, hauteur } = cadre
  const fuite: Point = { x: largeur / 2, y: hauteur * cadre.regard }
  const sol = hauteur
  const plafond = -hauteur * 0.11
  const salle = sol - plafond
  const chapiteau = sol - CHAPITEAU * salle
  const cx = largeur / 2

  const vers = (x: number, y: number, t: number): Point => fuir({ x, y }, t, fuite)

  const piliers: Pilier[] = []
  const arcs: Arc[] = []
  const basCotes: (readonly [Point, Point, Point, Point])[] = []

  for (const cote of [-1, 1] as const) {
    const dedans = cx + cote * NEF * largeur
    const dehors = cx + cote * (NEF + PILIER) * largeur

    // Le bas-cote : tout ce qui se voit derriere la file, du bord du cadre au
    // fond de la nef. Il est dessine avant les piliers, donc il les porte.
    const bord = cx + cote * (largeur / 2)
    basCotes.push([
      vers(bord, sol, 0),
      vers(dedans, sol, TRAVEES[TRAVEES.length - 1]!),
      vers(dedans, plafond, TRAVEES[TRAVEES.length - 1]!),
      vers(bord, plafond, 0),
    ])

    for (const [k, t] of TRAVEES.entries()) {
      piliers.push({
        coins: [
          vers(dedans, sol, t),
          vers(dehors, sol, t),
          vers(dehors, chapiteau, t),
          vers(dedans, chapiteau, t),
        ],
        cote,
        proximite: 1 - t,
      })

      // L'arc court le long de la nef, d'un pilier au suivant : son sommet est
      // a mi-chemin en profondeur, et c'est ce qui le fait tourner.
      const suivant = TRAVEES[k + 1]
      if (suivant === undefined) continue
      arcs.push({
        de: vers(dedans, chapiteau, t),
        sommet: vers(dedans, chapiteau - FLECHE * salle, (t + suivant) / 2),
        a: vers(dedans, chapiteau, suivant),
        cote,
        proximite: 1 - (t + suivant) / 2,
      })
    }
  }

  const travees: Travee[] = TRAVEES.map((t) => ({
    gauche: vers(cx - NEF * largeur, plafond, t),
    droite: vers(cx + NEF * largeur, plafond, t),
    proximite: 1 - t,
  }))

  const fond = TRAVEES[TRAVEES.length - 1]!
  const fuyantes: Fuyante[] = [-1, -0.5, 0, 0.5, 1].map((f) => {
    const x = cx + f * NEF * largeur
    return { de: vers(x, plafond, 0), a: vers(x, plafond, fond) }
  })

  // Le cube : huit sommets, dont on ne voit que la face avant et le dessus,
  // puisqu'il est centre sur l'axe et sous le regard.
  const demi = CUBE_DEMI * largeur
  const bas = sol - CUBE_FLOTTE * hauteur
  const haut = bas - 2 * demi
  const avant = [
    vers(cx - demi, bas, CUBE_AVANT),
    vers(cx + demi, bas, CUBE_AVANT),
    vers(cx + demi, haut, CUBE_AVANT),
    vers(cx - demi, haut, CUBE_AVANT),
  ] as const

  const socleDemi = SOCLE_DEMI * largeur
  const socleHaut = sol - SOCLE_HAUT * hauteur
  const socleDessus = [
    vers(cx - socleDemi, socleHaut, SOCLE_AVANT),
    vers(cx + socleDemi, socleHaut, SOCLE_AVANT),
    vers(cx + socleDemi, socleHaut, SOCLE_ARRIERE),
    vers(cx - socleDemi, socleHaut, SOCLE_ARRIERE),
  ] as const

  return {
    largeur,
    hauteur,
    fuite,
    piliers,
    arcs,
    travees,
    fuyantes,
    basCotes,
    cube: {
      avant,
      dessus: [
        avant[3],
        avant[2],
        vers(cx + demi, haut, CUBE_ARRIERE),
        vers(cx - demi, haut, CUBE_ARRIERE),
      ],
      socleFace: [
        vers(cx - socleDemi, sol, SOCLE_AVANT),
        vers(cx + socleDemi, sol, SOCLE_AVANT),
        socleDessus[1],
        socleDessus[0],
      ],
      socleDessus,
      levitation: socleDessus[0].y - avant[0].y,
    },
  }
}

/** Combien de piliers porte la nef : six par file. */
export const PILIERS_ATTENDUS = 2 * TRAVEES.length
