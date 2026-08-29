import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, type InstancedMesh } from 'three'
import { BOOK_DEPTH, BOOK_HEIGHT, BOOK_WIDTH } from '../dimensions.ts'
import { writeBoxMatrices, type Box } from '../instancing.ts'
import { spineHeightFactor, spineOf } from '../materials/palette.ts'
import { allBookPlacements } from './layout3d.ts'
import type { Origin } from './parts.ts'

/**
 * Les 640 volumes d'une galerie — ou les 1 920 de trois — en UN appel de rendu.
 *
 * Chaque volume recoit sa couleur et sa hauteur par instance, derivees de son
 * indice. Les tranches ne sont donc jamais alignees ni monochromes, et la
 * variation ne coute rien : elle est calculee une fois, au montage.
 *
 * Aucun texte n'est genere ici. De loin, un livre n'est qu'une tranche
 * coloree ; le texte n'existe que pour la page ouverte (decision D7).
 */
export function Books({ origins }: { origins: readonly Origin[] }): React.ReactElement {
  const ref = useRef<InstancedMesh>(null)

  const boxes = useMemo<Box[]>(() => {
    const all: Box[] = []
    for (const origin of origins) {
      for (const placement of allBookPlacements(origin)) {
        const index = all.length
        const facteur = spineHeightFactor(index)
        all.push({
          x: placement.x,
          y: placement.y - (BOOK_HEIGHT * (1 - facteur)) / 2,
          z: placement.z,
          rotY: placement.rotY,
          sx: BOOK_WIDTH,
          sy: BOOK_HEIGHT * facteur,
          sz: BOOK_DEPTH,
        })
      }
    }
    return all
  }, [origins])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    writeBoxMatrices(boxes, (index, matrix) => {
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    const couleur = new Color()
    for (let index = 0; index < boxes.length; index += 1) {
      mesh.setColorAt(index, couleur.set(spineOf(index)))
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, boxes.length]}
      count={boxes.length}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.82} metalness={0.02} />
    </instancedMesh>
  )
}
