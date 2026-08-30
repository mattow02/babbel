import { useLayoutEffect, useRef } from 'react'
import type { InstancedMesh } from 'three'
import { writeBoxMatrices, type Box } from './instancing.ts'

/**
 * Comme `Boxes`, mais pour n'importe quelle forme.
 *
 * La geometrie et le materiau sont passes en enfants : cypres coniques,
 * colonnes cylindriques, caissons cubiques passent ainsi par le meme chemin,
 * et chacun ne coute toujours qu'un seul appel de rendu.
 */
export function InstancedShapes({
  items,
  castShadow = false,
  receiveShadow = true,
  children,
}: {
  items: readonly Box[]
  castShadow?: boolean
  receiveShadow?: boolean
  children: React.ReactNode
}): React.ReactElement {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    writeBoxMatrices(items, (index, matrix) => {
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      count={items.length}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  )
}
