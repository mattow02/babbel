import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { jitterOf, unitOf } from '../hash.ts'
import { InstancedShapes } from '../InstancedShapes.tsx'
import { Boxes } from '../Boxes.tsx'
import type { Box } from '../instancing.ts'
import {
  BASIN_BOTTOM_RADIUS,
  BASIN_HEIGHT,
  BASIN_TOP_RADIUS,
  CYPRESS_HEIGHT,
  CYPRESS_RADIUS,
  DOME_BASE_Y,
  DOME_RADIUS,
  PORTAL_HEIGHT,
  PORTAL_WIDTH,
  PORTAL_Z,
  TERRACE_HEIGHTS,
  TERRACE_RADII,
} from './dimensions.ts'
import { cypressRing, stairSteps } from './landscape.ts'
import { SEUIL } from './palette.ts'

/**
 * L'exterieur : le dome dans son bassin, les terrasses plantees de cypres,
 * l'escalier d'honneur et l'entree unique.
 *
 * C'est la premiere image du site, celle de la capture 3 de `design/`. Elle
 * n'a qu'une seule source de lumiere — le soleil rasant — ce qui la rend
 * naturellement peu couteuse : pas besoin d'eclairage precalcule ici, la
 * question ne se posera que pour l'interieur du hall.
 */
export function Exterior(): React.ReactElement {
  const cypres = useMemo<Box[]>(() => {
    const arbres: Box[] = []
    for (const ring of [0, 1]) {
      for (const [index, tree] of cypressRing(ring).entries()) {
        const echelle = 0.8 + unitOf(index * 7 + ring * 991) * 0.45
        arbres.push({
          x: tree.x,
          y: tree.y + (CYPRESS_HEIGHT * echelle) / 2,
          z: tree.z,
          rotY: tree.rotY,
          sx: CYPRESS_RADIUS * (0.85 + jitterOf(index + ring * 13) * 0.3),
          sy: CYPRESS_HEIGHT * echelle,
          sz: CYPRESS_RADIUS,
        })
      }
    }
    return arbres
  }, [])

  const marches = useMemo(() => stairSteps(96), [])

  /** Les montagnes de l'horizon, en silhouette. */
  const montagnes = useMemo<Box[]>(() => {
    const reliefs: Box[] = []
    // Des massifs, pas des pyramides : on les enfonce a moitie dans le sol,
    // on ecrase leur hauteur, et on fait varier fortement leur emprise. Deux
    // cones superposes et decales suffisent a casser la silhouette conique.
    for (let index = 0; index < 44; index += 1) {
      const angle = (index / 44) * Math.PI * 2 + jitterOf(index) * 0.28
      const distance = 700 + unitOf(index * 17) * 320
      const hauteur = 90 + unitOf(index * 31) * 210
      const emprise = hauteur * (1.9 + unitOf(index * 53) * 1.6)
      reliefs.push({
        x: Math.cos(angle) * distance,
        y: hauteur / 2 - hauteur * 0.42,
        z: Math.sin(angle) * distance,
        rotY: angle + unitOf(index * 7) * 3,
        sx: emprise,
        sy: hauteur,
        sz: emprise * (0.7 + unitOf(index * 11) * 0.6),
      })
    }
    return reliefs
  }, [])

  return (
    <>
      {/* La plaine. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[900, 64]} />
        <meshStandardMaterial color={SEUIL.plaine} roughness={1} />
      </mesh>

      {/* Les montagnes, loin, sans ombres : elles ne sont qu'une silhouette. */}
      <InstancedShapes items={montagnes} receiveShadow={false}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color={SEUIL.montagne} roughness={1} flatShading />
      </InstancedShapes>

      {/* Le bassin evase qui recoit le dome. */}
      <mesh position={[0, DOME_BASE_Y - BASIN_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[BASIN_TOP_RADIUS, BASIN_BOTTOM_RADIUS, BASIN_HEIGHT, 72, 1, true]} />
        <meshStandardMaterial color={SEUIL.calcaire} roughness={0.95} side={DoubleSide} />
      </mesh>

      {/* Les deux terrasses annulaires. */}
      {[0, 1].map((ring) => (
        <mesh
          key={ring}
          position={[0, (TERRACE_HEIGHTS[ring] ?? 0) - 2.2, 0]}
          receiveShadow
          castShadow
        >
          <cylinderGeometry
            args={[(TERRACE_RADII[ring] ?? 0) + 1.5, (TERRACE_RADII[ring] ?? 0) - 1, 4.4, 72]}
          />
          <meshStandardMaterial color={SEUIL.calcaire} roughness={0.92} />
        </mesh>
      ))}

      {/* Les cypres : deux anneaux, en un seul appel de rendu. */}
      <InstancedShapes items={cypres} castShadow>
        <coneGeometry args={[0.5, 1, 7]} />
        <meshStandardMaterial color={SEUIL.cypres} roughness={1} />
      </InstancedShapes>

      {/* Le dome : une demi-sphere posee dans le bassin. */}
      <mesh position={[0, DOME_BASE_Y, 0]} castShadow receiveShadow>
        <sphereGeometry args={[DOME_RADIUS, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={SEUIL.calcaire} roughness={0.9} />
      </mesh>

      {/* L'escalier d'honneur, unique, dans l'axe. */}
      <Boxes boxes={marches} color={SEUIL.calcaire} roughness={0.93} castShadow />

      {/* L'entree unique : deux jambages, un linteau, et du noir derriere. */}
      <group position={[0, DOME_BASE_Y, PORTAL_Z]}>
        {/* Un porche avancé : sans volume propre, l'entree se perdrait
            completement contre une demi-sphere de 46 metres de rayon. */}
        <mesh position={[-(PORTAL_WIDTH / 2 + 2), PORTAL_HEIGHT / 2, 3]} castShadow receiveShadow>
          <boxGeometry args={[4, PORTAL_HEIGHT + 2.5, 9]} />
          <meshStandardMaterial color={SEUIL.calcaire} roughness={0.9} />
        </mesh>
        <mesh position={[PORTAL_WIDTH / 2 + 2, PORTAL_HEIGHT / 2, 3]} castShadow receiveShadow>
          <boxGeometry args={[4, PORTAL_HEIGHT + 2.5, 9]} />
          <meshStandardMaterial color={SEUIL.calcaire} roughness={0.9} />
        </mesh>
        <mesh position={[0, PORTAL_HEIGHT + 1.9, 3]} castShadow receiveShadow>
          <boxGeometry args={[PORTAL_WIDTH + 8, 3.2, 9]} />
          <meshStandardMaterial color={SEUIL.calcaire} roughness={0.9} />
        </mesh>
        {/* Le noir de l'entree : on ne voit pas ce qu'il y a dedans. */}
        <mesh position={[0, PORTAL_HEIGHT / 2, -1]}>
          <planeGeometry args={[PORTAL_WIDTH, PORTAL_HEIGHT]} />
          <meshBasicMaterial color="#0b0906" />
        </mesh>
      </group>
    </>
  )
}
