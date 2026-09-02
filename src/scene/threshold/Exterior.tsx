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
  ESPLANADE_RADIUS,
  PORTAL_HEIGHT,
  PORTAL_WIDTH,
  PORTAL_Z,
  TERRACE_HEIGHTS,
  TERRACE_RADII,
} from './dimensions.ts'
import { cypressRing, stairSteps } from './landscape.ts'
import { useRidge } from '../materials/Ridge.tsx'
import { useStone } from '../materials/Stone.tsx'
import { SEUIL } from './palette.ts'

/**
 * L'exterieur : le dome dans son bassin, les terrasses plantees de cypres,
 * l'escalier d'honneur et l'entree unique.
 *
 * C'est la premiere image du site, celle de la troisieme capture de
 * reference. Elle
 * n'a qu'une seule source de lumiere : le soleil rasant, ce qui la rend
 * naturellement peu couteuse : pas besoin d'eclairage precalcule ici, la
 * question ne se posera que pour l'interieur du hall.
 */
export function Exterior(): React.ReactElement {
  /*
   * La pierre du monument. Trois reglages differents seulement, parce que
   * chaque variante compile son propre programme :
   *  - le dome, dont les assises sont hautes et l'appareil enorme ;
   *  - le sol, sans assises mais poussiereux ;
   *  - le reste des maconneries, a l'echelle du corps.
   */
  const pierreDome = useStone({ base: SEUIL.calcaire, patine: SEUIL.calcaireOmbre, assise: 2.6, grain: 6, pied: 18 })
  // Le sable de la plaine : de larges ondulations de couleur, sans assises.
  const sable = useStone({ base: SEUIL.plaine, patine: '#9d7f57', assise: 0, grain: 34, pied: -400, force: 1 })
  const pierreSol = useStone({ base: SEUIL.calcaire, patine: SEUIL.calcaireOmbre, assise: 0, grain: 4.5, pied: -40, force: 0.75 })
  // Les montagnes : une silhouette brisee, pas des cones.
  const roche = useRidge({ amount: 0.34, scale: 0.3 })
  const pierreMur = useStone({ base: SEUIL.calcaire, patine: SEUIL.calcaireOmbre, assise: 1.35, grain: 3.2, pied: 14 })

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

  const marches = useMemo(() => stairSteps(108), [])

  /** Les montagnes de l'horizon, en silhouette. */
  const montagnes = useMemo<Box[]>(() => {
    const reliefs: Box[] = []
    /*
     * Des MASSIFS, pas des pyramides.
     *
     * Un cone isole se lit toujours comme une pyramide, quel que soit son
     * nombre de faces. Ce qui fait une montagne, c'est une silhouette BRISEE :
     * on empile donc deux ou trois cones decales et d'echelles differentes par
     * relief, ce qui casse l'arete unique et cree des epaules et des ressauts.
     * Le tout reste dans le meme appel de rendu.
     */
    for (let index = 0; index < 34; index += 1) {
      const angle = (index / 34) * Math.PI * 2 + jitterOf(index) * 0.3
      const distance = 700 + unitOf(index * 17) * 340
      const hauteur = 100 + unitOf(index * 31) * 220

      const sommets = 2 + Math.floor(unitOf(index * 71) * 2)
      for (let bosse = 0; bosse < sommets; bosse += 1) {
        const graine = index * 101 + bosse * 7
        // Chaque bosse est plus basse et decalee : c'est ce decalage qui
        // produit les epaules d'une chaine de montagnes.
        const facteur = bosse === 0 ? 1 : 0.45 + unitOf(graine) * 0.4
        const h = hauteur * facteur
        const emprise = h * (1.7 + unitOf(graine + 3) * 1.5)
        const ecart = hauteur * 0.55 * bosse * (unitOf(graine + 5) > 0.5 ? 1 : -1)
        reliefs.push({
          x: Math.cos(angle) * distance - Math.sin(angle) * ecart,
          y: h / 2 - h * (0.34 + unitOf(graine + 9) * 0.16),
          z: Math.sin(angle) * distance + Math.cos(angle) * ecart,
          rotY: angle + unitOf(graine + 11) * 3,
          sx: emprise,
          sy: h,
          sz: emprise * (0.65 + unitOf(graine + 13) * 0.7),
        })
      }
    }
    return reliefs
  }, [])

  return (
    <>
      {/* La plaine. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[900, 96]} />
        <meshStandardMaterial ref={sable} roughness={1} />
      </mesh>

      {/* Les montagnes, loin, sans ombres : elles ne sont qu'une silhouette. */}
      <InstancedShapes items={montagnes} receiveShadow={false}>
        <coneGeometry args={[0.5, 1, 13, 4]} />
        <meshStandardMaterial ref={roche} color={SEUIL.montagne} roughness={1} flatShading />
      </InstancedShapes>

      {/* Le bassin evase qui recoit le dome. */}
      <mesh position={[0, DOME_BASE_Y - BASIN_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[BASIN_TOP_RADIUS, BASIN_BOTTOM_RADIUS, BASIN_HEIGHT, 72, 1, true]} />
        <meshStandardMaterial ref={pierreMur} roughness={0.95} side={DoubleSide} />
      </mesh>

      {/*
        L'esplanade : le parvis, en pleine dalle.
        C'est desormais un SOL, pas un decor : le visiteur y marche, du sommet
        des marches jusqu'au portail. Un anneau n'aurait plus suffi.
      */}
      <mesh position={[0, DOME_BASE_Y - 2.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[ESPLANADE_RADIUS, ESPLANADE_RADIUS - 2, 4.4, 96]} />
        <meshStandardMaterial ref={pierreSol} roughness={0.94} />
      </mesh>

      {/* Le parapet qui la borde : sans lui, l'esplanade finit dans le vide. */}
      <mesh position={[0, DOME_BASE_Y + 0.55, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[ESPLANADE_RADIUS, ESPLANADE_RADIUS, 1.1, 96, 1, true]} />
        <meshStandardMaterial ref={pierreMur} roughness={0.9} side={DoubleSide} />
      </mesh>

      {/* La terrasse basse, en contrebas, qui porte le second anneau. */}
      <mesh position={[0, (TERRACE_HEIGHTS[1] ?? 0) - 2.2, 0]} receiveShadow castShadow>
        <cylinderGeometry
          args={[(TERRACE_RADII[1] ?? 0) + 4, (TERRACE_RADII[1] ?? 0) + 1, 4.4, 96]}
        />
        <meshStandardMaterial ref={pierreSol} roughness={0.92} />
      </mesh>

      {/* Les cypres : deux anneaux, en un seul appel de rendu. */}
      <InstancedShapes items={cypres} castShadow>
        <coneGeometry args={[0.5, 1, 7]} />
        <meshStandardMaterial color={SEUIL.cypres} roughness={1} />
      </InstancedShapes>

      {/* Le dome : une demi-sphere posee dans le bassin. */}
      <mesh position={[0, DOME_BASE_Y, 0]} castShadow receiveShadow>
        <sphereGeometry args={[DOME_RADIUS, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={pierreDome} roughness={0.9} />
      </mesh>

      {/* L'escalier d'honneur, unique, dans l'axe. */}
      <Boxes boxes={marches} color={SEUIL.calcaire} castShadow materialRef={pierreSol} />

      {/* L'entree unique : deux jambages, un linteau, et du noir derriere. */}
      <group position={[0, DOME_BASE_Y, PORTAL_Z]}>
        {/* Un porche avancé : sans volume propre, l'entree se perdrait
            completement contre une demi-sphere de 46 metres de rayon. */}
        <mesh position={[-(PORTAL_WIDTH / 2 + 2), PORTAL_HEIGHT / 2, 3]} castShadow receiveShadow>
          <boxGeometry args={[4, PORTAL_HEIGHT + 2.5, 9]} />
          <meshStandardMaterial ref={pierreMur} roughness={0.9} />
        </mesh>
        <mesh position={[PORTAL_WIDTH / 2 + 2, PORTAL_HEIGHT / 2, 3]} castShadow receiveShadow>
          <boxGeometry args={[4, PORTAL_HEIGHT + 2.5, 9]} />
          <meshStandardMaterial ref={pierreMur} roughness={0.9} />
        </mesh>
        <mesh position={[0, PORTAL_HEIGHT + 1.9, 3]} castShadow receiveShadow>
          <boxGeometry args={[PORTAL_WIDTH + 8, 3.2, 9]} />
          <meshStandardMaterial ref={pierreMur} roughness={0.9} />
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
