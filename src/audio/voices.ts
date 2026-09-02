/**
 * La composition du son d'ambiance, en chiffres.
 *
 * Aucun fichier audio n'est charge : l'ambiance est SYNTHETISEE, comme le
 * reste du site. C'est cohérent avec le projet : rien n'est stocke, tout est
 * calcule, et cela evite d'imposer plusieurs mega-octets a un visiteur qui
 * n'a peut-etre pas envie de son.
 *
 * Ce module ne decrit que la recette. Il ne touche pas au navigateur, et se
 * teste donc sans AudioContext.
 */

export interface Voice {
  /** Frequence, en hertz. */
  readonly frequency: number
  /** Gain, entre 0 et 1. */
  readonly gain: number
  /** Periode du battement lent qui fait respirer la voix, en secondes. */
  readonly breath: number
  /** Desaccord, en centiemes de demi-ton. */
  readonly detune: number
}

/**
 * Le bourdon.
 *
 * Des frequences tres graves et volontairement NON harmoniques les unes des
 * autres : un accord franc sonnerait comme de la musique, alors qu'on cherche
 * la rumeur d'un tres grand volume de pierre. Les battements lents naissent de
 * leurs petits ecarts.
 */
export const DRONE: readonly Voice[] = [
  { frequency: 38.5, gain: 0.16, breath: 23, detune: 0 },
  { frequency: 53.1, gain: 0.1, breath: 31, detune: -7 },
  { frequency: 71.9, gain: 0.055, breath: 19, detune: 11 },
  { frequency: 97.3, gain: 0.028, breath: 41, detune: -4 },
]

/** Coupure du filtre passe-bas applique au souffle, en hertz. */
export const NOISE_CUTOFF = 340

/** Gain du souffle. Il doit s'entendre sans jamais se remarquer. */
export const NOISE_GAIN = 0.05

/** Duree des fondus d'entree et de sortie, en secondes. */
export const FADE = 2.4

/** Gain general. Volontairement bas : c'est une ambiance, pas une musique. */
export const MASTER_GAIN = 0.5

/** Longueur du tampon de bruit, en secondes. Assez long pour ne pas boucler a l'oreille. */
export const NOISE_SECONDS = 8

/**
 * Genere un bruit brun (marche aleatoire filtree).
 *
 * Le bruit blanc siffle ; le bruit brun gronde. C'est celui-la qu'on veut pour
 * evoquer un volume d'air enorme. On l'obtient en integrant du bruit blanc,
 * puis en normalisant pour ne pas deriver.
 *
 * @param length nombre d'echantillons
 * @param random source aleatoire, injectable pour les tests
 */
export function brownNoise(
  length: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> {
  const samples = new Float32Array(new ArrayBuffer(length * 4))
  let last = 0
  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    samples[index] = last * 3.5
  }
  return samples
}
