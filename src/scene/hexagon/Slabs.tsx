import { useMemo } from 'react'
import { HEXAGON_RADIUS, ROOM_HEIGHT, WALL_THICKNESS } from '../dimensions.ts'
import { lookCourant } from '../materials/looks.ts'
import { degradeToon } from '../materials/toon.ts'
import type { Origin } from './parts.ts'

/**
 * Sol et plafond : deux hexagones par galerie.
 *
 * Le sol est POLI et reflechissant. Dans presque toutes les captures de
 * reference, c'est lui qui double la lumiere et creuse la profondeur : ce
 * n'est pas un detail (voir DIRECTION-ARTISTIQUE § 5).
 */
export function Slabs({ origins }: { origins: readonly Origin[] }): React.ReactElement {
  // En rendu a aplats, une veine de marbre ne dit plus rien : elle se lit
  // comme une salissure. Le sol est une couleur franche, et c'est la lumiere
  // a paliers qui lui donne son relief.
  const look = useMemo(() => lookCourant(), [])
  const degrade = useMemo(() => degradeToon(look.paliers), [look])

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
            <meshToonMaterial color={look.sol} gradientMap={degrade} />
          </mesh>
          <mesh position={[0, ROOM_HEIGHT + WALL_THICKNESS / 2, 0]} receiveShadow>
            <cylinderGeometry args={args} />
            <meshToonMaterial color={look.plafond} gradientMap={degrade} />
          </mesh>
        </group>
      ))}
    </>
  )
}
