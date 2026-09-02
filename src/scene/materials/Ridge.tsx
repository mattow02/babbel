import { useMemo } from 'react'
import type { Material } from 'three'

/**
 * Casser une silhouette trop reguliere.
 *
 * Un cone reste un cone, quel que soit le nombre de ses faces : c'est ce qui
 * faisait lire les montagnes de l'horizon comme des pyramides posees sur le
 * sable. Le defaut n'est pas dans la couleur mais dans la SILHOUETTE, et il ne
 * peut donc pas se corriger dans le fragment : il faut deplacer les sommets.
 *
 * On greffe donc quelques lignes sur le vertex shader du materiau : chaque
 * sommet est repousse le long de sa normale d'une quantite tiree d'un bruit
 * fractal, d'autant plus forte qu'on est loin du sommet du relief. Le resultat
 * a des aretes, des epaules et des ravines, et il ne coute rien de plus par
 * pixel : seulement quelques instructions par sommet, sur des maillages qui
 * en comptent une poignee.
 *
 * A utiliser avec `flatShading` : ce sont les facettes qui font la roche.
 */

interface ShaderHook {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

const BRUIT = /* glsl */ `
  float creteHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.19, 0.57, 0.83));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float creteNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(creteHash(i + vec3(0,0,0)), creteHash(i + vec3(1,0,0)), f.x),
          mix(creteHash(i + vec3(0,1,0)), creteHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(creteHash(i + vec3(0,0,1)), creteHash(i + vec3(1,0,1)), f.x),
          mix(creteHash(i + vec3(0,1,1)), creteHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  float creteFbm(vec3 p) {
    float somme = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave += 1) {
      somme += creteNoise(p) * amplitude;
      p *= 2.11;
      amplitude *= 0.5;
    }
    return somme;
  }
`

export interface RidgeOptions {
  /** Amplitude du deplacement, en fraction de la taille de l'objet. */
  readonly amount?: number
  /** Taille des accidents. Petit = ravines serrees. */
  readonly scale?: number
}

export function patchRidge(material: Material, options: RidgeOptions = {}): void {
  const amount = options.amount ?? 0.22
  const scale = options.scale ?? 0.34

  material.onBeforeCompile = (shader: ShaderHook) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${BRUIT}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           /*
            * Le relief est calcule dans le repere de l'INSTANCE, pas du monde :
            * chaque montagne a ainsi son propre accident, et deux instances
            * voisines ne se ressemblent pas. On attenue vers la pointe, sinon
            * le sommet se dedouble et le relief perd son arete maitresse.
            */
           float versLaBase = 1.0 - clamp(position.y + 0.5, 0.0, 1.0);
           float relief = creteFbm(position / ${scale.toFixed(3)}) - 0.5;
           transformed += normal * relief * ${amount.toFixed(3)} * (0.35 + versLaBase);
         }`,
      )
  }
  material.customProgramCacheKey = () => `crete-${amount}-${scale}`
  material.needsUpdate = true
}

/** Un materiau dont la silhouette est brisee, pret a poser. */
export function useRidge(options: RidgeOptions = {}): (material: Material | null) => void {
  return useMemo(
    () => (material: Material | null) => {
      if (material) patchRidge(material, options)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.amount, options.scale],
  )
}
