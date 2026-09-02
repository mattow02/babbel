import { useMemo } from 'react'
import { VESTIBULE_HEIGHT, VESTIBULE_SIZE, WALL_THICKNESS } from '../dimensions.ts'
import { CORRIDOR_SIDES, sideAngle } from './layout3d.ts'
import { degradeToon } from '../materials/toon.ts'
import { stairwellCentre } from './stairs.ts'
import type { Origin } from './parts.ts'

/**
 * « Dans le zaguan il y a un miroir, qui duplique fidelement les apparences. »
 *
 * La phrase est de Borges, elle est citee depuis le debut dans les dimensions
 * du vestibule, et le miroir n'avait jamais ete construit. Il compte pourtant :
 * c'est de lui que le narrateur tire son doute sur l'infini de la
 * bibliotheque, « les hommes en deduisent que la Bibliotheque n'est pas
 * infinie ; s'ils la deduisaient du miroir, ils auraient raison ».
 *
 * En rendu a aplats, on ne cherche pas un vrai reflet : un miroir de dessin
 * est une plaque claire et froide dans une piece chaude, et c'est ce contraste
 * de temperature qui le fait lire comme du verre. Il ne coute donc rien de
 * plus qu'un plan.
 */
export function Mirrors({ origins }: { origins: readonly Origin[] }): React.ReactElement {
  const degrade = useMemo(() => degradeToon(4), [])

  const places = useMemo(() => {
    const theta = sideAngle(CORRIDOR_SIDES[0] as number)
    const centre = stairwellCentre()
    // La perpendiculaire au couloir : le miroir est sur un cote du vestibule,
    // pas dans l'axe de passage, sinon on lui rentre dedans.
    const px = -Math.sin(theta)
    const pz = Math.cos(theta)
    const ecart = VESTIBULE_SIZE / 2 - WALL_THICKNESS
    return origins.map((origin) => ({
      x: origin.x + centre.x + px * ecart,
      z: origin.z + centre.z + pz * ecart,
      rotY: Math.atan2(-px, -pz),
    }))
  }, [origins])

  return (
    <>
      {places.map((place, index) => (
        <group key={index} position={[place.x, VESTIBULE_HEIGHT * 0.52, place.z]} rotation={[0, place.rotY, 0]}>
          {/* Le cadre, un peu plus grand que la glace. */}
          <mesh position={[0, 0, -0.012]}>
            <planeGeometry args={[0.86, 1.46]} />
            <meshToonMaterial color="#2a2018" gradientMap={degrade} />
          </mesh>
          <mesh>
            <planeGeometry args={[0.78, 1.38]} />
            {/*
              Froid dans une piece chaude : c'est ce qui fait lire une plaque
              comme du verre quand on ne calcule pas de reflet.
            */}
            <meshToonMaterial color="#7d8a94" gradientMap={degrade} />
          </mesh>
        </group>
      ))}
    </>
  )
}
