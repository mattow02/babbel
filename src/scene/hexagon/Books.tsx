import { Outlines } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, type InstancedMesh } from 'three'
import { BOOKS_PER_HEXAGON } from '../../core/index.ts'
import { BOOK_DEPTH, BOOK_HEIGHT, BOOK_WIDTH } from '../dimensions.ts'
import { writeBoxMatrices, type Box } from '../instancing.ts'
import { spineHeightFactor, spineOf, spineShade } from '../materials/palette.ts'
import { degradeToon } from '../materials/toon.ts'
import { allBookPlacements } from './layout3d.ts'
import type { Origin } from './parts.ts'

/**
 * Les 640 volumes d'une galerie, ou les 1 920 de trois : en UN appel de rendu.
 *
 * Chaque volume recoit sa couleur et sa hauteur par instance, derivees de son
 * indice. Les tranches ne sont donc jamais alignees ni monochromes, et la
 * variation ne coute rien : elle est calculee une fois, au montage.
 *
 * Aucun texte n'est genere ici. De loin, un livre n'est qu'une tranche
 * coloree ; le texte n'existe que pour la page ouverte (decision D7).
 */
export function Books({
  origins,
  hexagon,
  depth,
  meshRef,
}: {
  origins: readonly Origin[]
  hexagon: bigint
  depth: number
  /** Publie le maillage, pour que la scene puisse y lancer son rayon. */
  meshRef?: React.RefObject<InstancedMesh | null> | undefined
}): React.ReactElement {
  const own = useRef<InstancedMesh>(null)
  const ref = meshRef ?? own

  const degrade = useMemo(() => degradeToon(), [])

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
    mesh.computeBoundingSphere()
  }, [boxes, ref])

  /*
   * Les couleurs de tranche dependent de la GALERIE, pas seulement de la place
   * du volume : sans cela, toutes les galeries se ressembleraient exactement et
   * l'on ne sentirait jamais qu'on avance. Elles sont recalculees au passage
   * d'un couloir : 1 920 ecritures, une fois de temps en temps, c'est gratuit.
   */
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const couleur = new Color()
    const graine = Number(hexagon % 4294967291n)
    for (let index = 0; index < boxes.length; index += 1) {
      const galerie = Math.floor(index / BOOKS_PER_HEXAGON) - depth
      const graineVolume = index + (graine + galerie) * 7919
      couleur.set(spineOf(graineVolume)).multiplyScalar(spineShade(graineVolume))
      mesh.setColorAt(index, couleur)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [boxes, hexagon, depth, ref])

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
      <meshToonMaterial gradientMap={degrade} />
      {/* Le trait qui separe deux dos voisins de meme valeur. */}
      <Outlines thickness={0.004} color="#17110d" />
    </instancedMesh>
  )
}
