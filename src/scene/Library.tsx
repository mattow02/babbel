import { useMemo } from 'react'
import type { InstancedMesh } from 'three'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { Boxes } from './Boxes.tsx'
import { galleryOrigins } from './galleries.ts'
import { Books } from './hexagon/Books.tsx'
import { Mirrors } from './hexagon/Mirrors.tsx'
import { Slabs } from './hexagon/Slabs.tsx'
import { stoneBoxes, woodBoxes } from './hexagon/parts.ts'
import { stairBoxes } from './hexagon/stairs.ts'
import { Dust } from './effects/Dust.tsx'
import { Effects } from './effects/Effects.tsx'
import { Halo } from './effects/LightShaft.tsx'
import { LAMP_RADIUS, LAMP_Y, ROOM_HEIGHT } from './dimensions.ts'
import { Lamps } from './lighting/Lamp.tsx'
import { PALETTE } from './materials/palette.ts'

/**
 * Les galeries visibles autour du visiteur.
 *
 * ------------------------------------------------------------------------
 * LE STREAMING, ET POURQUOI IL NE COUTE RIEN
 *
 * Toutes les galeries sont geometriquement IDENTIQUES. Comme le visiteur est
 * toujours ramene au centre de la sienne (origine flottante, voir
 * navigation/geometry.ts), l'ensemble des galeries visibles est toujours le
 * meme : de -depth a +depth, aux memes positions relatives.
 *
 * Autrement dit, il n'y a rien a charger ni a decharger. Les maillages
 * instancies sont construits une seule fois au montage et ne changent PLUS
 * JAMAIS, quelle que soit la distance parcourue. Pas de gestionnaire de
 * morceaux, pas de reservoir d'objets a recycler, aucune allocation en cours
 * de marche, donc aucune fuite possible.
 *
 * C'est le genre d'economie qu'on ne trouve qu'en regardant le probleme :
 * l'infini de Borges est parfaitement repetitif, autant s'en servir.
 *
 * Seules les COULEURS des tranches suivent le numero de galerie, pour qu'on
 * sente qu'on avance. Elles se recalculent au passage d'un couloir.
 */
export function Library({
  depth = 1,
  booksRef,
  stairsRef,
}: {
  depth?: number
  booksRef?: React.RefObject<InstancedMesh | null> | undefined
  stairsRef?: React.RefObject<InstancedMesh | null> | undefined
}): React.ReactElement {
  const hexagon = useLibraryStore((state) => state.hexagon)
  const profile = useLibraryStore((state) => state.profile)

  /*
   * Plus de veine dans le calcaire.
   *
   * Le mur portait un motif de marbre, pour « empecher les grandes surfaces
   * claires de ressembler a du carton ». En rendu a aplats, c'est l'inverse :
   * une veine se lit comme une salissure, et ce qui donne le relief est la
   * bande d'ombre franche du degrade a paliers.
   */
  const origins = useMemo(() => galleryOrigins(depth), [depth])
  const stone = useMemo(() => origins.flatMap((origin) => stoneBoxes(origin)), [origins])
  const wood = useMemo(() => origins.flatMap((origin) => woodBoxes(origin)), [origins])
  const stairs = useMemo(() => origins.flatMap((origin) => stairBoxes(origin)), [origins])

  return (
    <>
      {/*
        Une ambiance tres faible, juste pour que les noirs ne soient pas des
        trous. Toute la lumiere vient des lampes spheriques.
      */}
      {/*
        Presque rien : juste de quoi que les noirs restent des noirs colores et
        non des trous. A 0,045 elle relevait tout le fond de la salle, et la
        lampe n'avait plus rien a eclairer.
      */}
      <ambientLight color={PALETTE.calcaire} intensity={0.03} />
      <Lamps
        origins={origins}
        shadowIndex={profile.shadows ? Math.floor(origins.length / 2) : -1}
      />

      {/*
        Pas de miroir au sol ici.
        Il a ete essaye et mesure : sur un sol devenu noir il ne montre rien,
        et il coute un rendu de la scene entiere a chaque image. Le hall, lui,
        le garde : son sol est clair et il n'a qu'une poignee d'appels.
      */}
      <Slabs origins={origins} />
      <Boxes boxes={stone} color={PALETTE.calcaire} castShadow contour={0.02} />
      <Boxes boxes={wood} color={PALETTE.bois} castShadow contour={0.012} />
      <Boxes
        boxes={stairs}
        color={PALETTE.bois}
        castShadow
        meshRef={stairsRef}
      />
      <Books origins={origins} hexagon={hexagon} depth={depth} meshRef={booksRef} />
      <Mirrors origins={origins} />

      {/*
        L'aureole des lampes. Le bloom seul ne suffit pas quand la source est
        petite : il faut lui donner du volume.
      */}
      {origins.map((origin, index) => (
        <Halo
          key={index}
          position={[origin.x, LAMP_Y, origin.z]}
          radius={LAMP_RADIUS * 9}
          color={PALETTE.lampe}
          strength={0.55}
        />
      ))}

      {/* La poussiere qui tourne dans la lumiere de la galerie courante. */}
      <Dust
        count={profile.dust}
        radius={2.2}
        height={ROOM_HEIGHT}
        color={PALETTE.lampe}
        strength={0.16}
        size={6}
      />

      <Effects ambiance="bibliotheque" complet={profile.fullEffects} />
    </>
  )
}
