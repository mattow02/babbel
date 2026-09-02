import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'
import { CHARS_PER_LINE, toLines } from '../../core/index.ts'
import { pageLayout } from './pageLayout.ts'

/**
 * Le texte d'une page, dessine sur une toile.
 *
 * Cote de la toile, en pixels. 1 024 donne environ 12 pixels par caractere :
 * assez pour lire de pres, et une texture qui reste legere.
 */
export const PAGE_TEXTURE_SIZE = 1024

/** Papier et encre. Ni blanc pur ni noir pur : un livre ancien n'en a pas. */
const PAPIER = '#e7dcc4'
const PAPIER_OMBRE = '#cbbc9c'
const ENCRE = '#241d15'

/**
 * Peint une page sur une toile, et rend sa texture.
 *
 * On redessine plutot que de creer une nouvelle toile a chaque tournage : une
 * texture rendue au processeur graphique coute cher a remplacer, alors que la
 * remettre a jour ne coute qu'un transfert.
 */
export function paintPage(
  canvas: HTMLCanvasElement,
  text: string | null,
  side: 'gauche' | 'droite',
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  ctx.fillStyle = PAPIER
  ctx.fillRect(0, 0, width, height)

  /*
   * L'ombre de la reliure.
   *
   * Un livre ouvert n'est jamais eclaire uniformement : la page s'incurve vers
   * le dos et s'y assombrit. Sans ce degrade, les deux pages ressemblent a
   * deux feuilles posees a plat.
   */
  const versLeDos = side === 'gauche'
  const degrade = ctx.createLinearGradient(versLeDos ? width : 0, 0, versLeDos ? 0 : width, 0)
  degrade.addColorStop(0, PAPIER_OMBRE)
  degrade.addColorStop(0.22, 'rgba(203, 188, 156, 0)')
  ctx.fillStyle = degrade
  ctx.fillRect(0, 0, width, height)

  if (!text) return

  const gabarit = pageLayout(width, height)
  ctx.fillStyle = ENCRE
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${gabarit.fontSize}px ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace`

  /*
   * On dessine caractere par caractere, a une position calculee.
   *
   * Ecrire la ligne entiere laisserait le navigateur choisir son crenage, et
   * les colonnes ne seraient plus alignees d'une ligne a l'autre : ce qui
   * detruirait la grille de quatre-vingts colonnes, qui est le format meme du
   * livre chez Borges.
   */
  const pas = gabarit.fontSize * 0.6
  const lignes = toLines(text)
  for (let ligne = 0; ligne < lignes.length; ligne += 1) {
    const y = gabarit.top + ligne * gabarit.lineHeight
    const contenu = lignes[ligne] ?? ''
    for (let colonne = 0; colonne < CHARS_PER_LINE; colonne += 1) {
      const caractere = contenu[colonne]
      if (!caractere || caractere === ' ') continue
      ctx.fillText(caractere, gabarit.left + colonne * pas, y)
    }
  }
}

/** Cree une toile prete a recevoir une page, et sa texture. */
export function createPageTexture(): { canvas: HTMLCanvasElement; texture: CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_TEXTURE_SIZE
  canvas.height = PAGE_TEXTURE_SIZE
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  // Pas de mipmaps : la page est toujours vue de pres et de face, et les
  // mipmaps rendraient le texte flou des qu'il s'incline un peu.
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 4
  return { canvas, texture }
}
