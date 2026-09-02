import type { Objectif } from '../mesure/photometrie.ts'
import type { Stage } from '../store/useLibraryStore.ts'
import { STAIRWELL_RADIUS } from './dimensions.ts'
import { CORRIDOR_SIDES, sideAngle } from './hexagon/layout3d.ts'
import { stairwellCentre } from './hexagon/stairs.ts'

/**
 * Les points de vue de reference.
 *
 * Juger un rendu sur des captures prises a la main ne prouve rien : deux
 * captures ne cadrent jamais pareil, et l'ecart mesure entre deux versions
 * finit par mesurer le cadrage plutot que le travail. On fige donc une
 * poignee de points de vue, on y revient a chaque fois, et l'on compare des
 * images comparables.
 *
 * Ces vues servent aussi au developpement : `?vue=galerie` pose le visiteur
 * devant l'etagere sans lui faire retraverser tout le Seuil.
 *
 * Ce module est PUR. Aucune position n'est ecrite en dur : elles se deduisent
 * des dimensions du monde, comme le reste du placement (D24).
 */

export interface Vue {
  /** Le nom qu'on passe dans l'URL. */
  readonly nom: string
  readonly stage: Stage
  /** Position relative au centre de la galerie. Absente : le monde decide. */
  readonly position?: { readonly x: number; readonly z: number }
  readonly yaw?: number
  /** Ouvre un volume : c'est la vue du livre. */
  readonly livre?: boolean
  /**
   * Ce que la vue doit atteindre.
   *
   * Seules trois vues en ont un, et c'est voulu : ce sont les trois pour
   * lesquelles il existe une illustration de reference mesuree
   * (docs/PLAN-ESTHETIQUE.md § 2). Inventer un objectif pour les autres
   * reviendrait a se donner une note a soi-meme.
   */
  readonly objectif?: Objectif
  /** Pourquoi cette vue existe, et ce qu'on y regarde. */
  readonly pourquoi: string
}

/**
 * Le cap a prendre pour regarder dans une direction donnee.
 *
 * La convention vient de `usePlayer` : le lacet est mesure depuis l'axe -Z.
 */
export function capVers(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz)
}

const THETA_COULOIR = sideAngle(CORRIDOR_SIDES[0] as number)

/** Devant le puits du zaguan, face a la tremie. */
function devantLeVide(): { position: { x: number; z: number }; yaw: number } {
  const centre = stairwellCentre()
  const nx = Math.cos(THETA_COULOIR)
  const nz = Math.sin(THETA_COULOIR)
  const recul = STAIRWELL_RADIUS + 0.55
  return {
    position: { x: centre.x - nx * recul, z: centre.z - nz * recul },
    yaw: capVers(nx, nz),
  }
}

const ZAGUAN = devantLeVide()

export const VUES: readonly Vue[] = [
  {
    nom: 'parvis',
    stage: 'parvis',
    pourquoi: 'La bibliotheque vue du dehors, en plein soleil. La vue d ouverture du site.',
    objectif: { p95Min: 0.65, contrasteMin: 6, variationMin: 0.05, noirsMax: 0.02 },
  },
  {
    nom: 'galerie',
    stage: 'library',
    position: { x: 0, z: 0 },
    yaw: capVers(Math.cos(THETA_COULOIR), Math.sin(THETA_COULOIR)),
    pourquoi: 'Le couloir de la galerie, dos de livres et lampe. Le cadrage de l illustration.',
    objectif: { contrasteMin: 3.5, variationMin: 0.024, noirsMin: 0.3 },
  },
  {
    nom: 'livre',
    stage: 'library',
    livre: true,
    pourquoi: 'Une page ouverte. C est le sujet du projet, et le plus grand ecart mesure.',
    objectif: { p95Min: 0.6, contrasteMin: 10, variationMin: 0.05, noirsMin: 0.2, noirsMax: 0.55 },
  },
  {
    nom: 'nef',
    stage: 'hall',
    pourquoi: 'La nef d accueil et le cube d or au bout de l axe.',
  },
  {
    nom: 'zaguan',
    stage: 'library',
    position: ZAGUAN.position,
    yaw: ZAGUAN.yaw,
    pourquoi: 'La tremie et l escalier qui s abime : le vertige de la nouvelle.',
  },
]
export function vuePar(nom: string): Vue | null {
  return VUES.find((v) => v.nom === nom) ?? null
}

/**
 * La vue demandee dans l'URL, s'il y en a une.
 *
 * Meme esprit que `?sonde` : ce n'est pas dangereux, mais cela n'a rien a
 * faire dans le parcours de tout le monde. On ne l'active que sur demande
 * explicite.
 */
export function vueDemandee(recherche: string): Vue | null {
  const nom = new URLSearchParams(recherche).get('vue')
  return nom ? vuePar(nom) : null
}
