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

import { Matrix4, Quaternion, Vector3 } from 'three'

/** Une boite posee dans le monde : position, rotation autour de y, dimensions. */
export interface Box {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotY: number
  readonly sx: number
  readonly sy: number
  readonly sz: number
}

const AXE_Y = new Vector3(0, 1, 0)

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
  const scale = new Vector3()
  for (let index = 0; index < boxes.length; index += 1) {
    const box = boxes[index] as Box
    position.set(box.x, box.y, box.z)
    quaternion.setFromAxisAngle(AXE_Y, box.rotY)
    scale.set(box.sx, box.sy, box.sz)
    matrix.compose(position, quaternion, scale)
    setMatrixAt(index, matrix)
  }
}
