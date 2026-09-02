import { DataTexture, NearestFilter, RedFormat, UnsignedByteType } from 'three'

/**
 * Le degrade a paliers du rendu cartoon.
 *
 * Un materiau « toon » ne calcule pas une lumiere continue : il projette
 * l'eclairement sur une petite echelle de valeurs, et c'est ce saut d'une
 * valeur a l'autre qui donne l'aplat du dessin. L'echelle est une texture
 * d'un pixel de haut, lue au plus proche voisin : sans ce filtrage, le
 * navigateur interpole entre les paliers et l'on retombe sur un degrade.
 *
 * Elle est CALCULEE, comme tout le reste du site : rien n'est telecharge, ni
 * texture, ni police, ni son.
 *
 * Le choix du nombre de paliers est le reglage principal du style. Trois
 * donnent une bande d'ombre, une de demi-teinte et une de lumiere : c'est le
 * dessin anime classique, et c'est ce que montrent les illustrations de
 * reference. Au-dela de cinq, l'oeil ne distingue plus les marches et l'on
 * perd le parti pris sans rien gagner.
 */
export function degradeToon(paliers = 3): DataTexture {
  const valeurs = new Uint8Array(paliers)
  for (let i = 0; i < paliers; i += 1) {
    /*
     * Les paliers ne sont pas repartis lineairement.
     *
     * A pas egal, l'ombre est trop claire et le sujet se detache mal du fond.
     * On ecrase donc le bas de l'echelle : la premiere marche est basse, les
     * suivantes se resserrent vers la lumiere. C'est ce que fait un dessinateur
     * qui pose une ombre franche puis nuance les clairs.
     */
    const t = i / (paliers - 1 || 1)
    valeurs[i] = Math.round(255 * t ** 1.6)
  }
  const texture = new DataTexture(valeurs, paliers, 1, RedFormat, UnsignedByteType)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
