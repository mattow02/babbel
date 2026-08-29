import { useLayoutEffect, useMemo, useRef } from 'react'
import type { InstancedMesh } from 'three'
import { writeBoxMatrices, type Box } from './instancing.ts'

/**
 * Un paquet de boites rendu en un seul appel.
 *
 * Toutes partagent la geometrie unitaire et le materiau : quel que soit leur
 * nombre, le cout de rendu reste d'un appel.
 */
export function Boxes({
  boxes,
  color,
  roughness = 0.9,
  metalness = 0,
  castShadow = false,
  receiveShadow = true,
}: {
  boxes: readonly Box[]
  color: string
  roughness?: number
  metalness?: number
  castShadow?: boolean
  receiveShadow?: boolean
}): React.ReactElement {
  const ref = useRef<InstancedMesh>(null)
  const count = boxes.length

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    writeBoxMatrices(boxes, (index, matrix) => {
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes])

  // La geometrie unitaire est creee une fois pour toutes.
  const args = useMemo(() => [1, 1, 1] as const, [])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      count={count}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </instancedMesh>
  )
}
