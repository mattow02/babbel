import { PALETTE } from './palette.ts'

/**
 * Les directions visuelles, mises cote a cote.
 *
 * Juger un parti pris sur une description ne marche pas : on croit voir ce
 * qu'on imagine. Juger sur un dessin ne marche pas non plus, parce qu'un
 * dessin promet ce que le moteur ne sait pas forcement rendre, et c'est
 * exactement le piege dans lequel ce projet est deja tombe une fois.
 *
 * On decrit donc chaque direction comme un jeu de reglages du RENDU, et l'on
 * capture les images avec le moteur lui-meme. Ce qui est choisi est donc, par
 * construction, ce que le site sait faire.
 *
 * `?look=2` dans l'URL applique la deuxieme.
 */
export interface Look {
  readonly nom: string
  readonly resume: string
  /** Nombre de paliers du degrade. Trois est le dessin anime classique. */
  readonly paliers: number
  /** Epaisseur du trait sur la pierre. Zero : aucun trait. */
  readonly trait: number
  readonly murs: string
  readonly sol: string
  readonly plafond: string
  readonly bois: string
  readonly lampe: string
  /** Portee de la lampe, en metres, et durete de sa decroissance. */
  readonly portee: number
  readonly chute: number
  readonly ambiance: number
}

export const LOOKS: readonly Look[] = [
  {
    nom: 'chaleur',
    resume: 'Ce qui est en ligne aujourd hui : calcaire chaud, trois paliers, trait fin.',
    paliers: 3,
    trait: 0.02,
    murs: PALETTE.calcaire,
    sol: PALETTE.dalle,
    plafond: PALETTE.plafond,
    bois: PALETTE.bois,
    lampe: PALETTE.lampe,
    portee: 7.5,
    chute: 2.4,
    ambiance: 0.03,
  },
  {
    nom: 'encre',
    resume: 'Deux paliers seulement et un trait epais : la bande dessinee, franche et lisible.',
    paliers: 2,
    trait: 0.045,
    murs: '#d9c7a4',
    sol: '#1b1512',
    plafond: '#1b1512',
    bois: '#221b16',
    lampe: '#ffe0a3',
    portee: 8.5,
    chute: 2.1,
    ambiance: 0.05,
  },
  {
    nom: 'nuit',
    resume: 'Le noir domine, la lampe seule sculpte : le clair-obscur de la nouvelle.',
    paliers: 4,
    trait: 0.014,
    murs: '#8d7a5d',
    sol: '#100c0a',
    plafond: '#0d0a08',
    bois: '#1a1512',
    lampe: '#ffcf87',
    portee: 5.4,
    chute: 3,
    ambiance: 0.008,
  },
  {
    nom: 'parchemin',
    resume: 'Tout eclairci, palette de vieux papier : une bibliotheque qu on visite le jour.',
    paliers: 3,
    trait: 0.026,
    murs: '#e6d6b4',
    sol: '#6d5a44',
    plafond: '#b9a684',
    bois: '#4a3a2c',
    lampe: '#fff0cc',
    portee: 11,
    chute: 1.7,
    ambiance: 0.12,
  },
  {
    nom: 'cendre',
    resume: 'Pierre froide et lampe chaude : le contraste de temperature fait tout le relief.',
    paliers: 3,
    trait: 0.022,
    murs: '#9aa0a2',
    sol: '#20242a',
    plafond: '#171b20',
    bois: '#2b2f33',
    lampe: '#ffbe6b',
    portee: 7,
    chute: 2.6,
    ambiance: 0.02,
  },
]

/** La direction demandee dans l'URL, ou la premiere. */
export function lookDemande(recherche: string): Look {
  const rang = Number(new URLSearchParams(recherche).get('look'))
  return LOOKS[Number.isInteger(rang) && rang >= 0 && rang < LOOKS.length ? rang : 0] as Look
}

/** La direction en vigueur, lue une fois : changer d'avis demande un rechargement. */
export function lookCourant(): Look {
  if (typeof window === 'undefined') return LOOKS[0] as Look
  return lookDemande(window.location.search)
}
