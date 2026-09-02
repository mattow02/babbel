/**
 * Cette machine sait-elle faire de la 3D ?
 *
 * Sans WebGL, la toile leve une exception au montage et emporte toute la page
 * - alors que le lecteur, lui, n'a besoin de rien d'autre que du texte. On
 * verifie donc AVANT de monter quoi que ce soit, une seule fois, et l'on se
 * contente de la lecture quand la reponse est non.
 *
 * On ne prive personne des livres pour une carte graphique.
 */
let connu: boolean | null = null

export function hasWebGL(): boolean {
  if (connu !== null) return connu
  if (typeof document === 'undefined') {
    connu = false
    return connu
  }
  try {
    const canvas = document.createElement('canvas')
    connu = Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    connu = false
  }
  return connu
}
