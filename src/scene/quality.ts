/**
 * Quel niveau de detail cette machine peut-elle tenir ?
 *
 * La decision D15 prevoyait les leviers de degradation des l'architecture,
 * pour ne pas avoir a retourner le rendu au dernier moment. Les voici, tous
 * regroupes, et decides par une fonction PURE : on peut donc verifier le
 * classement sans appareil et sans navigateur.
 *
 * Le principe : on ne mesure pas la puissance (aucune API ne la donne
 * honnetement), on lit des indices : pointeur grossier, memoire annoncee,
 * nombre de coeurs, largeur d'ecran, et on choisit prudemment. Mieux vaut un
 * telephone qui affiche moins mais reste fluide qu'un telephone qui rame.
 */

export type Level = 'complet' | 'reduit' | 'minimal'

export interface Capabilities {
  /** Pointeur grossier : doigt plutot que souris. */
  readonly coarsePointer: boolean
  /** Memoire annoncee par le navigateur, en gigaoctets. Souvent absente. */
  readonly memory: number | undefined
  /** Nombre de coeurs logiques. Souvent plafonne par le navigateur. */
  readonly cores: number | undefined
  /** Largeur de l'ecran en pixels CSS. */
  readonly width: number
  /** Le visiteur demande a limiter les animations. */
  readonly reducedMotion: boolean
}

export interface Profile {
  readonly level: Level
  /** Plafond de densite de pixels. Au-dela on paye des pixels invisibles. */
  readonly dpr: number
  /** Ombres portees. Une lumiere ponctuelle avec ombres coute six rendus. */
  readonly shadows: boolean
  /** Galeries visibles de part et d'autre. */
  readonly depth: number
  /** Nombre de grains de poussiere. */
  readonly dust: number
  /** Post-traitement complet, ou seulement le vignettage. */
  readonly fullEffects: boolean
  /** Sequence d'arrivee, ou entree directe. */
  readonly sequence: boolean
}

const PROFILES: Record<Level, Omit<Profile, 'level'>> = {
  complet: { dpr: 1.5, shadows: true, depth: 1, dust: 520, fullEffects: true, sequence: true },
  reduit: { dpr: 1.25, shadows: false, depth: 1, dust: 220, fullEffects: true, sequence: true },
  minimal: { dpr: 1, shadows: false, depth: 0, dust: 0, fullEffects: false, sequence: false },
}

/** Classe la machine, prudemment. */
export function levelFor(caps: Capabilities): Level {
  // Une demande explicite de sobriete l'emporte sur tout le reste : ce n'est
  // pas une question de puissance, c'est une question de respect.
  if (caps.reducedMotion) return 'minimal'

  const petiteMemoire = caps.memory !== undefined && caps.memory <= 4
  const peuDeCoeurs = caps.cores !== undefined && caps.cores <= 4
  const petitEcran = caps.width < 720

  if (caps.coarsePointer && (petiteMemoire || peuDeCoeurs || petitEcran)) return 'minimal'
  if (caps.coarsePointer || petiteMemoire || petitEcran) return 'reduit'
  if (peuDeCoeurs) return 'reduit'
  return 'complet'
}

/** Le profil complet correspondant. */
export function profileFor(caps: Capabilities): Profile {
  const level = levelFor(caps)
  return { level, ...PROFILES[level] }
}

/** Lit les indices disponibles dans le navigateur. */
export function readCapabilities(): Capabilities {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    memory: nav.deviceMemory,
    cores: navigator.hardwareConcurrency,
    width: window.innerWidth,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

/* ---------------------------------------------------------------------------
   La qualite qui se corrige elle-meme

   Les indices lus au demarrage disent ce que la machine ANNONCE, pas ce
   qu'elle tient. Un ordinateur de bureau avec huit coeurs et une carte
   graphique integree passe pour « complet » et rend a dix images par seconde.
   Aucune API ne le dit ; la cadence, elle, le dit tout de suite.

   On la mesure donc, et on redescend d'un cran si elle ne suit pas. On ne
   remonte jamais : une qualite qui oscille est pire que trop basse, elle
   attire l'oeil a chaque bascule.
   --------------------------------------------------------------------------- */

/** Le cran en dessous, ou le meme si l'on est deja au plus bas. */
export function niveauInferieur(level: Level): Level {
  if (level === 'complet') return 'reduit'
  return 'minimal'
}

/** En dessous, l'image saccade visiblement et le deplacement devient penible. */
export const CADENCE_PLANCHER = 40

/** Il faut deux fenetres de suite pour agir : une seule peut etre un a-coup. */
export const FENETRES_AVANT_BAISSE = 2

/**
 * Faut-il baisser d'un cran ?
 *
 * `cadences` sont les dernieres mesures, la plus recente en dernier.
 */
export function doitBaisser(level: Level, cadences: readonly number[]): boolean {
  if (level === 'minimal') return false
  if (cadences.length < FENETRES_AVANT_BAISSE) return false
  return cadences
    .slice(-FENETRES_AVANT_BAISSE)
    .every((cadence) => cadence > 0 && cadence < CADENCE_PLANCHER)
}

/** Le profil apres une baisse, en gardant ce qui ne depend pas du niveau. */
export function profilBaisse(actuel: Profile): Profile {
  const level = niveauInferieur(actuel.level)
  return { level, ...PROFILES[level] }
}
