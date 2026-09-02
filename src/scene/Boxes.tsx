import { useLayoutEffect, useMemo, useRef } from 'react'
import type { InstancedMesh, Material } from 'three'
import { Outlines } from '@react-three/drei'
import { writeBoxMatrices, type Box } from './instancing.ts'
import { degradeToon } from './materials/toon.ts'

/** La couleur du trait : l'encre du dessin, jamais un noir pur. */
const TRAIT = '#17110d'

/**
 * Un paquet de boites rendu en un seul appel.
 *
 * Toutes partagent la geometrie unitaire et le materiau : quel que soit leur
 * nombre, le cout de rendu reste d'un appel.
 */
export function Boxes({
  boxes,
  color,
  castShadow = false,
  receiveShadow = true,
  contour = 0,
  meshRef,
  materialRef,
}: {
  boxes: readonly Box[]
  color: string
  castShadow?: boolean
  /** Epaisseur du trait de contour, en unites du monde. Zero : aucun trait. */
  contour?: number
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
  const degrade = useMemo(() => degradeToon(), [])

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
      {/*
        Rendu a aplats. La lumiere n'est plus continue : elle est projetee sur
        trois paliers, ce qui donne la bande d'ombre franche du dessin. Le
        materiau toon ignore rugosite et metal, qui n'ont plus de sens : ce
        sont des grandeurs de rendu physique, et l'on a quitte ce terrain.
      */}
      <meshToonMaterial
        ref={materialRef ?? null}
        color={materialRef ? '#ffffff' : color}
        gradientMap={degrade}
      />
      {/*
        Le trait. C'est lui qui fait le dessin : sans contour, des aplats se
        confondent des qu'ils ont la meme valeur, et l'on perd les aretes de la
        piece. Il est dessine en agrandissant la face arriere, ce qui ne coute
        qu'un appel de plus pour tout le paquet, quel que soit le nombre de
        boites.
      */}
      {contour ? <Outlines thickness={contour} color={TRAIT} /> : null}
    </instancedMesh>
  )
}
