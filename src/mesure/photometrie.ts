/**
 * La photometrie d'une image, pour rendre comparable ce qui se juge a l'oeil.
 *
 * « C'est plus joli » n'est pas un critere : on ne peut ni le verifier, ni
 * savoir si un reglage a fait gagner ou perdre. On mesure donc quelques
 * grandeurs sur l'image rendue, et on les compare a celles de l'illustration
 * qui sert de cible (voir docs/PLAN-ESTHETIQUE.md).
 *
 * Ce module est PUR : il prend un tampon de pixels et rend des nombres. Aucun
 * navigateur, aucun canevas, aucun GPU. C'est ce qui permet de le tester.
 */

export interface Photometrie {
  /** Luminance du 5e centile : le noir reel de l'image. */
  readonly p5: number
  readonly mediane: number
  /** Luminance du 95e centile : les hautes lumieres. */
  readonly p95: number
  /** Rapport de contraste, formule WCAG appliquee a p95 sur p5. */
  readonly contraste: number
  /** Part de pixels sous 2 % de luminance. */
  readonly partNoirs: number
  /** Part de pixels au-dessus de 95 % : au-dela, le detail est perdu. */
  readonly partBrulees: number
  /**
   * Ecart-type moyen de la luminance sur des tuiles de 16 px.
   *
   * C'est la grandeur qui dit si une surface est PLATE. Un mur sans matiere,
   * un dos de livre uniforme, un ciel en aplat : tous donnent une variation
   * proche de zero, quelle que soit leur luminosite. C'est exactement ce qui
   * separe le rendu actuel de l'illustration visee.
   */
  readonly variationLocale: number
}

/** Cote des tuiles sur lesquelles la variation locale est mesuree. */
const TUILE = 16

/**
 * Table de linearisation sRGB, calculee une fois.
 *
 * La luminance doit se calculer sur des valeurs lineaires : additionner des
 * octets sRGB revient a moyenner des racines, ce qui ecrase les ombres et
 * fausse tout le reste.
 */
const LINEAIRE: readonly number[] = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
})

/** Luminance relative, pondérée comme l'oeil : Rec. 709. */
function luminance(r: number, v: number, b: number): number {
  return 0.2126 * (LINEAIRE[r] as number) + 0.7152 * (LINEAIRE[v] as number) + 0.0722 * (LINEAIRE[b] as number)
}

function centile(triees: readonly number[], q: number): number {
  if (triees.length === 0) return 0
  const rang = Math.min(triees.length - 1, Math.floor(q * triees.length))
  return triees[rang] as number
}

/**
 * Mesure une image RGBA.
 *
 * `pixels` suit la disposition d'`ImageData` : quatre octets par pixel, par
 * lignes. Le canal alpha est ignore, l'image rendue etant toujours opaque.
 */
export function mesurerPhotometrie(
  pixels: Uint8ClampedArray | Uint8Array | readonly number[],
  largeur: number,
  hauteur: number,
): Photometrie {
  if (largeur <= 0 || hauteur <= 0 || pixels.length < largeur * hauteur * 4) {
    throw new Error('photometrie : dimensions incoherentes avec le tampon fourni')
  }

  const lum = new Float64Array(largeur * hauteur)
  for (let i = 0, p = 0; i < lum.length; i += 1, p += 4) {
    lum[i] = luminance(pixels[p] as number, pixels[p + 1] as number, pixels[p + 2] as number)
  }

  const triees = Array.from(lum).sort((a, b) => a - b)
  const p5 = centile(triees, 0.05)
  const p95 = centile(triees, 0.95)

  let noirs = 0
  let brulees = 0
  for (const l of triees) {
    if (l < 0.02) noirs += 1
    if (l > 0.95) brulees += 1
  }

  // La variation locale, tuile par tuile. Les tuiles incompletes du bord sont
  // ignorees : elles fausseraient la moyenne sans rien apprendre.
  let sommeEcarts = 0
  let tuiles = 0
  for (let y = 0; y + TUILE <= hauteur; y += TUILE) {
    for (let x = 0; x + TUILE <= largeur; x += TUILE) {
      let somme = 0
      for (let dy = 0; dy < TUILE; dy += 1) {
        for (let dx = 0; dx < TUILE; dx += 1) somme += lum[(y + dy) * largeur + (x + dx)] as number
      }
      const moyenne = somme / (TUILE * TUILE)
      let carres = 0
      for (let dy = 0; dy < TUILE; dy += 1) {
        for (let dx = 0; dx < TUILE; dx += 1) {
          const d = (lum[(y + dy) * largeur + (x + dx)] as number) - moyenne
          carres += d * d
        }
      }
      sommeEcarts += Math.sqrt(carres / (TUILE * TUILE))
      tuiles += 1
    }
  }

  return {
    p5,
    mediane: centile(triees, 0.5),
    p95,
    contraste: (p95 + 0.05) / (p5 + 0.05),
    partNoirs: noirs / triees.length,
    partBrulees: brulees / triees.length,
    variationLocale: tuiles === 0 ? 0 : sommeEcarts / tuiles,
  }
}

/** Ce qu'une vue doit atteindre pour etre consideree comme aboutie. */
export interface Objectif {
  readonly p95Min?: number
  readonly contrasteMin?: number
  readonly variationMin?: number
  readonly noirsMin?: number
  readonly noirsMax?: number
  readonly bruleesMax?: number
}

/** Les manquements d'une mesure vis-a-vis d'un objectif, en clair. */
export function ecarts(mesure: Photometrie, objectif: Objectif): string[] {
  const manques: string[] = []
  const dire = (v: number): string => v.toFixed(3)
  if (objectif.p95Min !== undefined && mesure.p95 < objectif.p95Min)
    manques.push(`hautes lumieres ${dire(mesure.p95)} sous ${dire(objectif.p95Min)}`)
  if (objectif.contrasteMin !== undefined && mesure.contraste < objectif.contrasteMin)
    manques.push(`contraste ${mesure.contraste.toFixed(1)}:1 sous ${objectif.contrasteMin}:1`)
  if (objectif.variationMin !== undefined && mesure.variationLocale < objectif.variationMin)
    manques.push(`surfaces plates : variation ${dire(mesure.variationLocale)} sous ${dire(objectif.variationMin)}`)
  if (objectif.noirsMin !== undefined && mesure.partNoirs < objectif.noirsMin)
    manques.push(`pas assez de noir : ${(mesure.partNoirs * 100).toFixed(1)} %`)
  if (objectif.noirsMax !== undefined && mesure.partNoirs > objectif.noirsMax)
    manques.push(`trop de noir : ${(mesure.partNoirs * 100).toFixed(1)} %`)
  if (objectif.bruleesMax !== undefined && mesure.partBrulees > objectif.bruleesMax)
    manques.push(`hautes lumieres brulees : ${(mesure.partBrulees * 100).toFixed(2)} %`)
  return manques
}
