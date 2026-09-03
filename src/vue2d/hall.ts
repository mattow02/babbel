import { fuir, type Cadre, type Point } from './perspective.ts'

/**
 * Le hall, en perspective a un point de fuite.
 *
 * On y arrive en poussant la porte du Seuil, et l'on n'est pas encore dans la
 * bibliotheque : c'est le sas entre le plein soleil et les tenebres. Une nef,
 * deux files de piliers portant une arcade, des bas-cotes garnis de
 * rayonnages, une voute a caissons percee d'un puits de lumiere, le cube d'or
 * en levitation dans le faisceau, et au fond la statue qui porte le monde.
 *
 * Comme pour la galerie, rien n'est ecrit en coordonnees : tout se deduit du
 * cadre. Un hall a un axe, et un axe se prouve.
 */

/** Un quadrilatere : quatre points, dans l'ordre du contour. */
export type Quad = readonly [Point, Point, Point, Point]

/** Un pilier, en trois morceaux : une base, un fut, un chapiteau. */
export interface Pilier {
  readonly base: Quad
  readonly fut: Quad
  readonly chapiteau: Quad
  readonly cote: -1 | 1
  readonly proximite: number
}

/** Un arc de l'arcade : un bandeau, entre intrados et extrados. */
export interface Arc {
  readonly de: Point
  readonly sommet: Point
  readonly a: Point
  readonly deHaut: Point
  readonly sommetHaut: Point
  readonly aHaut: Point
  readonly cote: -1 | 1
  readonly proximite: number
}

/** Une nervure du plafond, en travers ou dans le sens de la nef. */
export interface Nervure {
  readonly de: Point
  readonly a: Point
  readonly proximite: number
}

/** Une tablette de rayonnage, dans un bas-cote. */
export interface Tablette {
  readonly de: Point
  readonly a: Point
  readonly cote: -1 | 1
}

/** Le cube d'or, et le socle qu'il ne touche pas. */
export interface CubeDor {
  readonly avant: Quad
  readonly dessus: Quad
  readonly socleFace: Quad
  readonly socleDessus: Quad
  /** Le vide entre le bas du cube et le dessus du socle, en pixels. */
  readonly levitation: number
}

/** La statue qui porte le monde, au fond de la nef. */
export interface Porteur {
  readonly cx: number
  /** Le sol, a sa profondeur. */
  readonly sol: number
  /** Le haut des epaules. */
  readonly epaules: number
  /** Demi-largeur aux epaules, et au bout des coudes. */
  readonly demiEpaules: number
  readonly demiCoudes: number
  /** Le globe qu'il souleve. */
  readonly globe: { readonly centre: Point; readonly r: number }
}

export interface Hall {
  readonly largeur: number
  readonly hauteur: number
  readonly fuite: Point
  readonly piliers: readonly Pilier[]
  readonly arcs: readonly Arc[]
  readonly travees: readonly Nervure[]
  readonly fuyantes: readonly Nervure[]
  readonly tablettes: readonly Tablette[]
  /** Le fond de chaque bas-cote, derriere l'arcade. */
  readonly basCotes: readonly Quad[]
  /** Le mur du fond de la nef, ou se detache la statue. */
  readonly fond: Quad
  /** Le puits de lumiere, perce dans la voute. */
  readonly puits: { readonly centre: Point; readonly rx: number; readonly ry: number }
  readonly cube: CubeDor
  readonly porteur: Porteur
  /** Ou la voute prend naissance, au-dessus de l'arcade. */
  readonly voute: number
}

const CADRE: Cadre = { largeur: 1000, hauteur: 620, regard: 0.5 }

/** La nef : sa demi-largeur, et l'epaisseur d'un pilier. */
const NEF = 0.28
const PILIER = 0.062
/** Les cinq travees, du premier plan vers le fond, puis le mur du fond. */
const TRAVEES = [0, 0.2, 0.36, 0.48, 0.575] as const
const T_FOND = 0.645

/** Le pilier, en fractions de la hauteur de la salle. */
const BASE = 0.055
const FUT = 0.56
const CHAPITEAU = 0.045
/** L'arc : sa fleche, et l'epaisseur de son bandeau. */
const FLECHE = 0.15
const BANDEAU = 0.05
/** Ou commence la voute, au-dessus de l'arcade. */
const NAISSANCE_VOUTE = 0.86

/**
 * Le puits de lumiere : sa profondeur et son ouverture.
 *
 * Sa profondeur n'est pas libre : une voute haute repousse le plafond loin
 * au-dessus du cadre, et un puits perce trop pres du premier plan sort de
 * l'image sans que rien ne le signale. C'est arrive.
 */
const T_PUITS = 0.5
const PUITS_RX = 0.085
const PUITS_RY = 0.055

/** Le cube : ses deux profondeurs, sa demi-arete, sa levitation. */
const CUBE_AVANT = 0.46
const CUBE_ARRIERE = 0.53
const CUBE_DEMI = 0.086
const CUBE_FLOTTE = 0.185
/** Le socle : plus large, plus bas, et il deborde de part et d'autre. */
const SOCLE_AVANT = 0.4
const SOCLE_ARRIERE = 0.55
const SOCLE_DEMI = 0.125
const SOCLE_HAUT = 0.075

/** La statue : sa hauteur d'epaules, ses largeurs, son globe. */
const PORTEUR_EPAULES = 0.47
const PORTEUR_DEMI = 0.215
const PORTEUR_COUDES = 0.305
const PORTEUR_GLOBE = 0.135

export function hall(cadre: Cadre = CADRE): Hall {
  const { largeur, hauteur } = cadre
  const fuite: Point = { x: largeur / 2, y: hauteur * cadre.regard }
  const sol = hauteur
  /*
   * La voute monte HAUT, tres au-dessus du cadre.
   *
   * C'est ce qui fait la majeste : une salle dont on ne voit pas le haut des
   * piliers du premier plan ecrase celui qui entre. C'est aussi ce qui donne
   * au fond de la nef la place d'accueillir un colosse : la statue etait
   * bridee par un plafond bas, et aucun agrandissement ne pouvait la sauver.
   */
  const plafond = -hauteur * 0.32
  const salle = sol - plafond
  const cx = largeur / 2

  const vers = (x: number, y: number, t: number): Point => fuir({ x, y }, t, fuite)
  const quad = (x0: number, x1: number, yBas: number, yHaut: number, t: number): Quad => [
    vers(x0, yBas, t),
    vers(x1, yBas, t),
    vers(x1, yHaut, t),
    vers(x0, yHaut, t),
  ]

  const hautBase = sol - BASE * salle
  const hautFut = sol - FUT * salle
  const hautChapiteau = hautFut - CHAPITEAU * salle
  const voute = sol - NAISSANCE_VOUTE * salle

  const piliers: Pilier[] = []
  const arcs: Arc[] = []
  const basCotes: Quad[] = []
  const tablettes: Tablette[] = []

  for (const cote of [-1, 1] as const) {
    const dedans = cx + cote * NEF * largeur
    const dehors = cx + cote * (NEF + PILIER) * largeur
    const bord = cx + cote * (largeur / 2)

    basCotes.push([
      vers(bord, sol, 0),
      vers(dedans, sol, T_FOND),
      vers(dedans, plafond, T_FOND),
      vers(bord, plafond, 0),
    ])

    // Les bas-cotes ne sont pas des trous noirs : ce sont des rayonnages, et
    // c'est deja la bibliotheque qu'on apercoit derriere l'arcade.
    for (let r = 0; r < 5; r += 1) {
      const y = sol - (0.055 + 0.105 * r) * salle
      tablettes.push({ de: vers(bord, y, 0), a: vers(bord, y, T_FOND), cote })
    }

    for (const [k, t] of TRAVEES.entries()) {
      // Un pilier deborde de part et d'autre : sa base et son chapiteau sont
      // plus larges que son fut, sinon il n'a ni pied ni tete.
      const debord = PILIER * largeur * 0.16 * cote
      piliers.push({
        base: quad(dedans + debord, dehors - debord, sol, hautBase, t),
        fut: quad(dedans, dehors, hautBase, hautFut, t),
        chapiteau: quad(dedans + debord, dehors - debord, hautFut, hautChapiteau, t),
        cote,
        proximite: 1 - t,
      })

      const suivant = TRAVEES[k + 1] ?? T_FOND
      const milieu = (t + suivant) / 2
      arcs.push({
        de: vers(dedans, hautChapiteau, t),
        sommet: vers(dedans, hautChapiteau - FLECHE * salle, milieu),
        a: vers(dedans, hautChapiteau, suivant),
        deHaut: vers(dedans, hautChapiteau - BANDEAU * salle, t),
        sommetHaut: vers(dedans, hautChapiteau - (FLECHE + BANDEAU) * salle, milieu),
        aHaut: vers(dedans, hautChapiteau - BANDEAU * salle, suivant),
        cote,
        proximite: 1 - milieu,
      })
    }
  }

  const travees: Nervure[] = [...TRAVEES, T_FOND].map((t) => ({
    de: vers(cx - NEF * largeur, plafond, t),
    a: vers(cx + NEF * largeur, plafond, t),
    proximite: 1 - t,
  }))

  const fuyantes: Nervure[] = [-1, -0.5, 0.5, 1].map((f) => ({
    de: vers(cx + f * NEF * largeur, plafond, 0),
    a: vers(cx + f * NEF * largeur, plafond, T_FOND),
    proximite: 1,
  }))

  const demi = CUBE_DEMI * largeur
  const bas = sol - CUBE_FLOTTE * hauteur
  const haut = bas - 2 * demi
  const avant: Quad = [
    vers(cx - demi, bas, CUBE_AVANT),
    vers(cx + demi, bas, CUBE_AVANT),
    vers(cx + demi, haut, CUBE_AVANT),
    vers(cx - demi, haut, CUBE_AVANT),
  ]

  const socleDemi = SOCLE_DEMI * largeur
  const socleHaut = sol - SOCLE_HAUT * hauteur
  const socleDessus: Quad = [
    vers(cx - socleDemi, socleHaut, SOCLE_AVANT),
    vers(cx + socleDemi, socleHaut, SOCLE_AVANT),
    vers(cx + socleDemi, socleHaut, SOCLE_ARRIERE),
    vers(cx - socleDemi, socleHaut, SOCLE_ARRIERE),
  ]

  const epaules = vers(cx, sol - PORTEUR_EPAULES * salle, T_FOND).y
  const rGlobe = PORTEUR_GLOBE * largeur * (1 - T_FOND)
  /*
   * Le globe se place depuis la VOUTE, pas depuis les epaules.
   *
   * Accroche aux epaules, il descendait avec elles et ne laissait aux bras que
   * vingt pixels pour se lever : la statue avait deux nageoires horizontales.
   * Cale sous la voute, il occupe le haut du fond, et les bras ont enfin de la
   * course.
   */
  const voutFond = vers(cx, plafond, T_FOND).y

  return {
    largeur,
    hauteur,
    fuite,
    piliers,
    arcs,
    travees,
    fuyantes,
    tablettes,
    basCotes,
    fond: quad(cx - NEF * largeur, cx + NEF * largeur, sol, plafond, T_FOND),
    puits: {
      centre: vers(cx, plafond, T_PUITS),
      rx: PUITS_RX * largeur * (1 - T_PUITS),
      ry: PUITS_RY * hauteur * (1 - T_PUITS),
    },
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
    porteur: {
      cx,
      sol: vers(cx, sol, T_FOND).y,
      epaules,
      demiEpaules: PORTEUR_DEMI * largeur * (1 - T_FOND),
      demiCoudes: PORTEUR_COUDES * largeur * (1 - T_FOND),
      globe: { centre: { x: cx, y: voutFond + rGlobe + salle * 0.02 }, r: rGlobe },
    },
    voute: vers(cx, voute, 0).y,
  }
}

/** Combien de piliers porte la nef : cinq par file. */
export const PILIERS_ATTENDUS = 2 * TRAVEES.length
