import { MeshReflectorMaterial } from '@react-three/drei'
import { useMemo } from 'react'
import { HEXAGON_RADIUS, ROOM_HEIGHT, WALL_THICKNESS } from '../dimensions.ts'
import { useMarble } from '../materials/Marble.tsx'
import { PALETTE } from '../materials/palette.ts'
import type { Origin } from './parts.ts'

/**
 * Sol et plafond : deux hexagones par galerie.
 *
 * Le sol est POLI et reflechissant. Dans presque toutes les captures de
 * reference, c'est lui qui double la lumiere et creuse la profondeur : ce
 * n'est pas un detail (voir DIRECTION-ARTISTIQUE § 5).
 */
export function Slabs({
  origins,
  reflectIndex = -1,
}: {
  origins: readonly Origin[]
  /**
   * La galerie dont le sol reflechit vraiment, ou -1 pour aucune.
   *
   * Le sol etait annonce poli depuis le debut, avec une rugosite de 0,16 et
   * un soupcon de metal. Mais un materiau standard ne reflechit qu'une carte
   * d'environnement, et il n'y en a pas ici : il ne reflechissait donc rien du
   * tout. Une passe de miroir, sur la seule galerie ou se tient le visiteur,
   * rend a la lampe son double et creuse la salle. Voir D60.
   */
  reflectIndex?: number
}): React.ReactElement {
  // Le sol des galeries est du marbre sombre et poli : c'est lui qui double la
  // lumiere de la lampe et creuse la profondeur (DIRECTION-ARTISTIQUE § 5).
  const marbreDalle = useMarble({
    base: PALETTE.dalle,
    vein: '#3a2f26',
    scale: 2.4,
    sharpness: 3,
    octaves: 3,
    warp: false,
  })
  // Un cylindre a six cotes EST un prisme hexagonal. On lui fait faire un
  // sixieme de tour pour que ses aretes tombent sur celles de la piece.
  const args = useMemo(
    () => [HEXAGON_RADIUS, HEXAGON_RADIUS, WALL_THICKNESS, 6] as const,
    [],
  )

  return (
    <>
      {origins.map((origin, index) => (
        <group key={index} position={[origin.x, 0, origin.z]} rotation={[0, Math.PI / 6, 0]}>
          {index === reflectIndex ? (
            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[HEXAGON_RADIUS, 6]} />
              <MeshReflectorMaterial
                resolution={512}
                mixBlur={1.1}
                mixStrength={2.2}
                blur={[280, 60]}
                mirror={0.35}
                depthScale={1.1}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.3}
                color={PALETTE.dalle}
                metalness={0.4}
                roughness={0.62}
              />
            </mesh>
          ) : null}
          <mesh position={[0, -WALL_THICKNESS / 2, 0]} receiveShadow>
            <cylinderGeometry args={args} />
            <meshStandardMaterial ref={marbreDalle} roughness={0.16} metalness={0.2} />
          </mesh>
          <mesh position={[0, ROOM_HEIGHT + WALL_THICKNESS / 2, 0]} receiveShadow>
            <cylinderGeometry args={args} />
            <meshStandardMaterial color={PALETTE.plafond} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </>
  )
}
