/**
 * Poser N objets identiques en UN SEUL appel de rendu.
 *
 * C'est le levier central de tout le projet (decision D5) : le facteur
 * limitant en WebGL est le nombre d'appels de rendu, pas les polygones.
 * 640 livres poses un par un, ce sont 640 appels ; instancies, c'est un seul.
 *
 * On se ramene systematiquement a UNE geometrie de boite unitaire, mise a
 * l'echelle par instance. Murs, planches, montants et livres partagent ainsi
 * la meme geometrie et ne coutent qu'un appel par materiau.
 */

import { Euler, Matrix4, Quaternion, Vector3 } from 'three'

/** Une boite posee dans le monde : position, orientation, dimensions. */
export interface Box {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotY: number
  /**
   * Inclinaison autour de l'axe X LOCAL, appliquee apres le lacet.
   *
   * Sans elle, impossible de plaquer un caisson sur une coupole : il resterait
   * vertical et saillirait de la surface au lieu d'en epouser la courbure.
   */
  readonly rotX?: number
  readonly sx: number
  readonly sy: number
  readonly sz: number
}

/**
 * Remplit les matrices d'un InstancedMesh a partir d'une liste de boites.
 *
 * Les objets temporaires sont crees UNE fois et reutilises : cette fonction
 * peut etre appelee sur des milliers d'instances sans produire de dechets pour
 * le ramasse-miettes.
 */
export function writeBoxMatrices(
  boxes: readonly Box[],
  setMatrixAt: (index: number, matrix: Matrix4) => void,
): void {
  const matrix = new Matrix4()
  const position = new Vector3()
  const quaternion = new Quaternion()
  const euler = new Euler()
  const scale = new Vector3()
  for (let index = 0; index < boxes.length; index += 1) {
    const box = boxes[index] as Box
    position.set(box.x, box.y, box.z)
    euler.set(box.rotX ?? 0, box.rotY, 0, 'YXZ')
    quaternion.setFromEuler(euler)
    scale.set(box.sx, box.sy, box.sz)
    matrix.compose(position, quaternion, scale)
    setMatrixAt(index, matrix)
  }
}
