import { LAMP_RADIUS, LAMP_Y, VESTIBULE_HEIGHT } from '../dimensions.ts'
import { stairwellCentre } from '../hexagon/stairs.ts'
import { PALETTE } from '../materials/palette.ts'
import type { Origin } from '../hexagon/parts.ts'

/**
 * « Une lampe spherique, de fruits lumineux, occupe le centre. »
 *
 * Une seule source par galerie, chaude et rapprochee, avec une decroissance
 * rapide : c'est elle qui produit le clair-obscur de la direction artistique.
 * Le noir n'est pas un manque d'eclairage, c'est le sujet.
 *
 * Seule la galerie ou se trouve le visiteur projette des ombres. Une lumiere
 * ponctuelle avec ombres coute six rendus de carte d'ombre ; en accorder une a
 * chaque galerie ruinerait le budget pour un gain invisible a travers un
 * couloir.
 */
export function Lamps({
  origins,
  shadowIndex = 0,
}: {
  origins: readonly Origin[]
  shadowIndex?: number
}): React.ReactElement {
  return (
    <>
      {origins.map((origin, index) => (
        <group key={`zaguan-${index}`} position={[origin.x + stairwellCentre().x, VESTIBULE_HEIGHT - 0.45, origin.z + stairwellCentre().z]}>
          {/*
            La lampe du zaguan.
            Sans elle le vestibule est un trou noir : on ne voit ni la tremie,
            ni l'escalier, ni la galerie suivante. Elle est plus faible que
            celle des salles — on ne s'attarde pas dans un couloir.
          */}
          <mesh>
            <sphereGeometry args={[LAMP_RADIUS * 0.7, 16, 12]} />
            <meshBasicMaterial color={PALETTE.lampe} />
          </mesh>
          <pointLight
            color={PALETTE.lampe}
            intensity={7}
            distance={9}
            decay={2.1}
            castShadow={false}
          />
        </group>
      ))}

      {origins.map((origin, index) => (
        <group key={index} position={[origin.x, LAMP_Y, origin.z]}>
          <mesh>
            <sphereGeometry args={[LAMP_RADIUS, 20, 14]} />
            <meshBasicMaterial color={PALETTE.lampe} />
          </mesh>
          <pointLight
            color={PALETTE.lampe}
            intensity={11}
            distance={8.5}
            decay={2.3}
            castShadow={index === shadowIndex}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.004}
            shadow-camera-near={0.15}
            shadow-camera-far={12}
          />
        </group>
      ))}
    </>
  )
}
