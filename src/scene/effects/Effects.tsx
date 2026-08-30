import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { Vector2 } from 'three'
import { useMemo } from 'react'

/**
 * Le post-traitement.
 *
 * C'est, de loin, ce qui fait le plus pour l'image (DIRECTION-ARTISTIQUE § 6).
 * L'ordre d'importance y est donne, et il est respecte ici :
 *
 *   1. le VIGNETTAGE, present partout, qui isole le sujet ;
 *   2. le BLOOM sur les sources — le cube, les lampes, l'oculus ;
 *   3. le GRAIN, fin et constant, qui donne la matiere filmique ;
 *   4. l'ABERRATION CHROMATIQUE, tres legere, visible sur les bords ;
 *   5. le tone mapping ACES, deja applique par le rendu lui-meme.
 *
 * Les reglages ne sont pas les memes selon l'endroit : dehors, en plein soleil,
 * un vignettage lourd assombrirait le ciel ; dans les tenebres de la
 * bibliotheque, au contraire, il faut appuyer. D'ou trois jeux de reglages.
 */

export type Ambiance = 'exterieur' | 'hall' | 'bibliotheque'

interface Reglages {
  readonly vignette: number
  readonly vignetteFondu: number
  readonly bloomSeuil: number
  readonly bloomIntensite: number
  readonly grain: number
  readonly aberration: number
  readonly saturation: number
  readonly contraste: number
}

const REGLAGES: Record<Ambiance, Reglages> = {
  // Dehors : le ciel doit rester ouvert. Vignettage discret, bloom sur le
  // liseré du dome, grain leger.
  exterieur: {
    vignette: 0.42,
    vignetteFondu: 0.55,
    bloomSeuil: 0.72,
    bloomIntensite: 0.65,
    grain: 0.024,
    aberration: 0.00042,
    saturation: -0.04,
    contraste: 0.04,
  },
  // Le hall : une seule source, le cube. On appuie le bloom et le noir.
  hall: {
    vignette: 0.85,
    vignetteFondu: 0.22,
    bloomSeuil: 0.62,
    bloomIntensite: 1.25,
    grain: 0.036,
    aberration: 0.0007,
    saturation: 0.02,
    contraste: 0.07,
  },
  // La bibliotheque : tenebres. Vignettage lourd, halo autour des lampes.
  bibliotheque: {
    vignette: 0.9,
    vignetteFondu: 0.2,
    bloomSeuil: 0.58,
    bloomIntensite: 0.95,
    grain: 0.042,
    aberration: 0.0008,
    saturation: -0.02,
    contraste: 0.06,
  },
}

/**
 * @param complet quand il est faux, on ne garde que le vignettage — le seul
 *   effet dont l'image ne peut pas se passer, et le moins cher. C'est le mode
 *   des appareils modestes (scene/quality.ts).
 */
export function Effects({
  ambiance,
  complet = true,
}: {
  ambiance: Ambiance
  complet?: boolean
}): React.ReactElement {
  const r = REGLAGES[ambiance]
  const decalage = useMemo(() => new Vector2(r.aberration, r.aberration * 0.6), [r.aberration])

  if (!complet) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Vignette eskil={false} offset={r.vignetteFondu} darkness={r.vignette} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer
      /*
       * `multisampling={0}` : l'antialiasing du contexte suffit, et le MSAA du
       * composeur couterait une passe supplementaire pour un gain invisible a
       * cette densite de pixels.
       */
      multisampling={0}
      enableNormalPass={false}
    >
      <Bloom
        intensity={r.bloomIntensite}
        luminanceThreshold={r.bloomSeuil}
        luminanceSmoothing={0.28}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <ChromaticAberration
        offset={decalage}
        radialModulation
        modulationOffset={0.42}
        blendFunction={BlendFunction.NORMAL}
      />
      <HueSaturation saturation={r.saturation} />
      <BrightnessContrast contrast={r.contraste} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={r.grain} />
      <Vignette eskil={false} offset={r.vignetteFondu} darkness={r.vignette} />
    </EffectComposer>
  )
}
