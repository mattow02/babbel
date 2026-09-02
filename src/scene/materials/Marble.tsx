import { useMemo } from 'react'
import { Color, type Material } from 'three'

/**
 * La forme minimale de ce que three.js passe a `onBeforeCompile`.
 *
 * Le type `Shader` a disparu des declarations publiques ; on decrit donc
 * exactement ce qu'on utilise, ce qui est de toute facon plus honnete.
 */
interface ShaderHook {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

/**
 * Du marbre veine, calcule.
 *
 * ------------------------------------------------------------------------
 * POURQUOI PAS UNE TEXTURE
 *
 * Une image de marbre pese quelques mega-octets, se repete visiblement des
 * qu'on l'etire sur une colonne de vingt metres, et trahit sa grille. Ici tout
 * le reste du site est calcule : le ciel, la poussiere, le son, les livres. Le
 * marbre n'a pas de raison de faire exception.
 *
 * ------------------------------------------------------------------------
 * COMMENT
 *
 * On ne remplace PAS le materiau standard : on lui greffe quelques lignes qui
 * modifient sa seule couleur de base. Tout le reste : eclairage, ombres,
 * brouillard, tone mapping : continue de fonctionner exactement comme avant.
 * C'est ce que permet `onBeforeCompile`, et c'est bien plus sur que d'ecrire
 * un materiau complet a la main.
 *
 * Le motif : un bruit fractal (quelques octaves de bruit de valeur), plie sur
 * lui-meme pour produire des VEINES nettes plutot qu'un nuage. Le pliage,
 * `abs(bruit - 0.5)` eleve a une puissance : est ce qui distingue le marbre de
 * la simple tache.
 */

const NOISE = /* glsl */ `
  float babbelHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float babbelNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(babbelHash(i + vec3(0,0,0)), babbelHash(i + vec3(1,0,0)), f.x),
          mix(babbelHash(i + vec3(0,1,0)), babbelHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(babbelHash(i + vec3(0,0,1)), babbelHash(i + vec3(1,0,1)), f.x),
          mix(babbelHash(i + vec3(0,1,1)), babbelHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  /*
   * Le nombre d'octaves est fixe a la COMPILATION, pas lu dans un uniforme :
   * une boucle a borne variable empeche le pilote de la derouler, et ce bruit
   * s'execute pour chaque pixel de chaque mur.
   */
  #ifndef BABBEL_OCTAVES
  #define BABBEL_OCTAVES 4
  #endif

  float babbelFbm(vec3 p) {
    float somme = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < BABBEL_OCTAVES; octave += 1) {
      somme += babbelNoise(p) * amplitude;
      p *= 2.03;          // pas tout a fait 2 : evite que les octaves s'alignent
      amplitude *= 0.5;
    }
    return somme;
  }
`

export interface MarbleOptions {
  /** Couleur du fond. */
  readonly base: string
  /** Couleur des veines. */
  readonly vein: string
  /** Taille du motif, en metres. Plus grand = veines plus larges. */
  readonly scale?: number
  /** Nettete des veines, de 1 (diffuses) a 8 (tranchantes). */
  readonly sharpness?: number
  /**
   * Nombre d'octaves de bruit, de 2 a 5.
   *
   * C'est le curseur de COUT : ce shader tourne pour chaque pixel de chaque
   * surface qui le porte. Quatre octaves et une deformation prealable donnent
   * un marbre de premier plan ; deux octaves sans deformation suffisent
   * largement a une paroi de couloir, et coutent trois fois moins cher.
   */
  readonly octaves?: number
  /** Deformer les coordonnees avant de reprendre le bruit. Double le cout. */
  readonly warp?: boolean
}

/** Greffe le motif de marbre sur un materiau standard. */
export function patchMarble(material: Material, options: MarbleOptions): void {
  const base = new Color(options.base)
  const vein = new Color(options.vein)
  const scale = options.scale ?? 3.2
  const sharpness = options.sharpness ?? 3.5
  const octaves = Math.min(5, Math.max(2, options.octaves ?? 4))
  const warp = options.warp ?? true

  material.onBeforeCompile = (shader: ShaderHook) => {
    shader.uniforms['marbreBase'] = { value: base }
    shader.uniforms['marbreVeine'] = { value: vein }
    shader.uniforms['marbreEchelle'] = { value: scale }
    shader.uniforms['marbreNettete'] = { value: sharpness }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vBabbelMonde;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n vBabbelMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vBabbelMonde;
         uniform vec3 marbreBase;
         uniform vec3 marbreVeine;
         uniform float marbreEchelle;
         uniform float marbreNettete;
         #define BABBEL_OCTAVES ${octaves}
         ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         {
           vec3 p = vBabbelMonde / marbreEchelle;
           ${
             warp
               ? `// On deforme les coordonnees avec du bruit avant d'en reprendre :
           // c'est ce qui donne aux veines leur allure tourmentee.
           float trouble = babbelFbm(p * 0.6);
           float n = babbelFbm(p + vec3(trouble * 1.7));`
               : `float n = babbelFbm(p);`
           }
           // Le pliage : c'est lui qui fait une VEINE et non une tache.
           float veine = pow(1.0 - abs(n - 0.5) * 2.0, marbreNettete);
           diffuseColor.rgb *= mix(marbreBase, marbreVeine, clamp(veine, 0.0, 1.0));
         }`,
      )
  }
  // Trois materiaux greffes differemment ne doivent pas partager un programme.
  material.customProgramCacheKey = () =>
    `marbre-${options.base}-${options.vein}-${scale}-${sharpness}-${octaves}-${String(warp)}`
  material.needsUpdate = true
}

/**
 * Un materiau de marbre, pret a poser.
 *
 * `key` force la recreation quand les options changent : un materiau greffe ne
 * se re-greffe pas tout seul.
 */
export function useMarble(options: MarbleOptions): (material: Material | null) => void {
  return useMemo(
    () => (material: Material | null) => {
      if (material) patchMarble(material, options)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.base, options.vein, options.scale, options.sharpness, options.octaves, options.warp],
  )
}
