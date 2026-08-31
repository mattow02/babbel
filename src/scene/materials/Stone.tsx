import { useMemo } from 'react'
import { Color, type Material } from 'three'

/**
 * De la pierre de taille, calculee.
 *
 * Le marbre du hall (materials/Marble.tsx) donne des VEINES ; ce n'est pas ce
 * qu'il faut dehors. Une facade de calcaire ne se lit pas a ses veines mais a
 * trois choses, et ce sont exactement les trois que ce shader ajoute :
 *
 *  1. les ASSISES — les lits horizontaux entre blocs. Sans elles, un dome de
 *     quarante-six metres n'a plus d'echelle : il pourrait aussi bien faire
 *     trois metres, rien dans l'image ne le dit ;
 *  2. la VARIATION de bloc a bloc — deux pierres du meme banc ne sont jamais
 *     exactement de la meme couleur, et c'est ce qui distingue un mur bati
 *     d'une surface peinte ;
 *  3. la PATINE — les surfaces horizontales prennent la poussiere, les pieds de
 *     mur se salissent, les aretes se lavent. C'est ce qui donne l'age.
 *
 * Comme pour le marbre, on ne remplace pas le materiau standard : on lui greffe
 * quelques lignes. L'eclairage, les ombres et le brouillard continuent de
 * fonctionner tels quels.
 */

interface ShaderHook {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

const BRUIT = /* glsl */ `
  float pierreHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float pierreNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(pierreHash(i + vec3(0,0,0)), pierreHash(i + vec3(1,0,0)), f.x),
          mix(pierreHash(i + vec3(0,1,0)), pierreHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(pierreHash(i + vec3(0,0,1)), pierreHash(i + vec3(1,0,1)), f.x),
          mix(pierreHash(i + vec3(0,1,1)), pierreHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  float pierreFbm(vec3 p) {
    float somme = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 3; octave += 1) {
      somme += pierreNoise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return somme;
  }
`

export interface StoneOptions {
  /** Couleur de la pierre au soleil. */
  readonly base: string
  /** Couleur des salissures : pied de mur, joints, poussiere. */
  readonly patine: string
  /** Hauteur d'une assise, en metres. Zero pour une surface sans lits. */
  readonly assise?: number
  /** Taille des taches de bloc a bloc, en metres. */
  readonly grain?: number
  /** Altitude a laquelle le pied de mur cesse d'etre sali. */
  readonly pied?: number
  /** Force generale de l'effet, de 0 a 1. */
  readonly force?: number
}

export function patchStone(material: Material, options: StoneOptions): void {
  const base = new Color(options.base)
  const patine = new Color(options.patine)
  const assise = options.assise ?? 1.6
  const grain = options.grain ?? 3.4
  const pied = options.pied ?? 0
  const force = options.force ?? 1

  material.onBeforeCompile = (shader: ShaderHook) => {
    shader.uniforms['pierreBase'] = { value: base }
    shader.uniforms['pierrePatine'] = { value: patine }
    shader.uniforms['pierreAssise'] = { value: assise }
    shader.uniforms['pierreGrain'] = { value: grain }
    shader.uniforms['pierrePied'] = { value: pied }
    shader.uniforms['pierreForce'] = { value: force }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vPierreMonde;\n varying vec3 vPierreNormale;')
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vPierreMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vPierreNormale = normalize(mat3(modelMatrix) * objectNormal);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vPierreMonde;
         varying vec3 vPierreNormale;
         uniform vec3 pierreBase;
         uniform vec3 pierrePatine;
         uniform float pierreAssise;
         uniform float pierreGrain;
         uniform float pierrePied;
         uniform float pierreForce;
         ${BRUIT}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         {
           vec3 p = vPierreMonde;

           // 1. Le bloc : une tache large, constante sur une pierre entiere.
           float bloc = pierreFbm(p / pierreGrain);

           // 2. L'assise : le lit horizontal entre deux rangees de pierres.
           //    On l'ignore sur les faces horizontales, ou elle n'aurait aucun
           //    sens : un dallage n'a pas de lits verticaux.
           float lit = 0.0;
           if (pierreAssise > 0.01) {
             float h = p.y / pierreAssise;
             float bord = abs(fract(h) - 0.5) * 2.0;
             float horizontale = abs(vPierreNormale.y);
             lit = smoothstep(0.86, 1.0, bord) * (1.0 - horizontale);
           }

           // 3. La patine : les faces tournees vers le ciel prennent la
           //    poussiere, et les pieds de mur se salissent par ruissellement.
           float dessus = clamp(vPierreNormale.y, 0.0, 1.0);
           float bas = 1.0 - smoothstep(pierrePied, pierrePied + 3.5, p.y);
           float sale = clamp(dessus * 0.45 + bas * 0.5 + lit * 0.9, 0.0, 1.0);

           vec3 teinte = mix(pierreBase, pierrePatine, sale * pierreForce);
           // La variation de bloc a bloc, discrete : plus elle est forte, plus
           // le mur devient un camouflage.
           teinte *= 1.0 + (bloc - 0.5) * 0.16 * pierreForce;
           diffuseColor.rgb *= teinte;
         }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         {
           // Le grain : la pierre n'a pas un poli uniforme, et c'est ce qui
           // fait accrocher la lumiere rasante.
           float micro = pierreFbm(vPierreMonde * 2.7);
           roughnessFactor = clamp(roughnessFactor + (micro - 0.5) * 0.22 * pierreForce, 0.05, 1.0);
         }`,
      )
  }
  material.customProgramCacheKey = () => `pierre-${options.base}-${options.patine}-${assise}-${grain}-${pied}-${force}`
  material.needsUpdate = true
}

/** Un materiau de pierre, pret a poser. */
export function useStone(options: StoneOptions): (material: Material | null) => void {
  return useMemo(
    () => (material: Material | null) => {
      if (material) patchStone(material, options)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.base, options.patine, options.assise, options.grain, options.pied, options.force],
  )
}
