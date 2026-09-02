import { hash32, unitOf } from '../vue2d/hash.ts'

/**
 * Les couleurs du dessin.
 *
 * Meme regle qu'en trois dimensions : aucun gris neutre, les ombres tirent
 * vers le brun-violace et les lumieres vers l'ambre. Ce qui change, c'est
 * qu'on ne calcule plus d'eclairage : on POSE les valeurs, et c'est l'ecart
 * entre elles qui fait le relief.
 */
export const COULEURS = {
  nuit: '#0a0806',
  pierre: '#2a2118',
  pierreLoin: '#1a140e',
  sol: '#171009',
  plafond: '#120d09',
  bois: '#0b0806',
  lampe: '#fff4d8',
  halo: '#ffc072',
  rambarde: '#96784f',
  trait: '#17110d',
} as const

/**
 * Les dos de livres, du presque noir au parchemin.
 *
 * L'ecart de valeur EST le sujet : douze bruns de meme clarte font une masse,
 * pas une bibliotheque. Mesure faite sur l'illustration de reference, la bande
 * des rayonnages y a deux fois plus de variation locale que n'en avait notre
 * rendu, pour une luminance moyenne identique.
 */
const DOS = [
  '#141110', '#1d1917', '#241d18', '#2f2a26', '#3b3129', '#4a3b35', '#5c3a38',
  '#6b6a45', '#7d5a3a', '#8a7250', '#a98a5c', '#c2a878', '#d6c096', '#e3d2ac',
] as const

/**
 * La couleur d'un volume, deterministe.
 *
 * Elle passe par un hachage et non par une multiplication : une multiplication
 * est affine, et les couleurs se mettraient a defiler selon un motif visible
 * le long des etageres (D32).
 */
export function dosDe(graine: number): string {
  return DOS[hash32(graine) % DOS.length] as string
}

/** L'usure d'un volume : de quoi eviter que la meme teinte revienne alignee. */
export function usureDe(graine: number): number {
  return 0.74 + unitOf(graine ^ 0x2f1e5ac3) * 0.5
}

/** Assombrit une couleur, pour la distance et pour l'usure. */
export function teinter(hex: string, facteur: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => Math.max(0, Math.min(255, Math.round(v * facteur))))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
  return `#${c}`
}
