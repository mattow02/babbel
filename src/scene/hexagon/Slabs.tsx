import { useMemo } from 'react'
import { HEXAGON_RADIUS, ROOM_HEIGHT, WALL_THICKNESS } from '../dimensions.ts'
import { PALETTE } from '../materials/palette.ts'
import type { Origin } from './parts.ts'

/**
 * Sol et plafond : deux hexagones par galerie.
 *
 * Le sol est POLI et reflechissant. Dans presque toutes les captures de
 * reference, c'est lui qui double la lumiere et creuse la profondeur — ce
 * n'est pas un detail (voir DIRECTION-ARTISTIQUE § 5).
 */
export function Slabs({ origins }: { origins: readonly Origin[] }): React.ReactElement {
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
          <mesh position={[0, -WALL_THICKNESS / 2, 0]} receiveShadow>
            <cylinderGeometry args={args} />
            <meshStandardMaterial color={PALETTE.dalle} roughness={0.22} metalness={0.08} />
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
