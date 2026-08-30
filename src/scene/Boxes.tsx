import { useLayoutEffect, useMemo, useRef } from 'react'
import type { InstancedMesh, Material } from 'three'
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
  meshRef,
  materialRef,
}: {
  boxes: readonly Box[]
  color: string
  roughness?: number
  metalness?: number
  castShadow?: boolean
  receiveShadow?: boolean
  /** Publie le maillage, pour qu'on puisse y lancer un rayon. */
  meshRef?: React.RefObject<InstancedMesh | null> | undefined
  /** Greffe sur le materiau, par exemple un motif de pierre. */
  materialRef?: ((material: Material | null) => void) | undefined
}): React.ReactElement {
  const own = useRef<InstancedMesh>(null)
  const ref = meshRef ?? own
  const count = boxes.length

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    writeBoxMatrices(boxes, (index, matrix) => {
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes, ref])

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
      {/*
        Quand un motif est greffe, il multiplie la couleur de base : on laisse
        donc le materiau en blanc pour ne pas assombrir deux fois.
      */}
      <meshStandardMaterial
        ref={materialRef ?? null}
        color={materialRef ? '#ffffff' : color}
        roughness={roughness}
        metalness={metalness}
      />
    </instancedMesh>
  )
}
