import { BackSide } from 'three'
import { SEUIL } from './palette.ts'

/**
 * Le ciel.
 *
 * Un degrade vertical seul est ce qui donne un fond « lineaire » : l'oeil suit
 * la rampe de couleur du haut vers le bas et n'a rien d'autre a regarder. Il
 * manque quatre choses, et ce sont celles qu'un ciel reel possede :
 *
 *  - un SOLEIL, avec son disque et son halo. C'est lui qui explique la lumiere
 *    rasante du reste de la scene ; sans lui, l'eclairage vient de nulle part ;
 *  - des NUAGES hauts, etires par le vent, qui donnent une profondeur au
 *    zenith ;
 *  - une brume d'horizon qui ne soit pas une simple bande, mais qui remonte
 *    plus haut du cote du soleil, comme le fait la diffusion atmospherique ;
 *  - du BRUIT, enfin, de l'ordre d'un demi-niveau de quantification. Sans lui,
 *    un degrade en huit bits par canal montre des bandes, et ces bandes sont
 *    exactement ce qu'on voit quand on trouve un ciel « trop lineaire ».
 *
 * Tout est calcule dans le shader : rien n'est telecharge.
 */

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 haut;
  uniform vec3 bas;
  uniform vec3 brume;
  uniform vec3 soleil;
  uniform vec3 versSoleil;
  varying vec3 vWorld;

  float cielHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.37, 0.11, 0.73));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float cielNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(cielHash(i + vec3(0,0,0)), cielHash(i + vec3(1,0,0)), f.x),
          mix(cielHash(i + vec3(0,1,0)), cielHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(cielHash(i + vec3(0,0,1)), cielHash(i + vec3(1,0,1)), f.x),
          mix(cielHash(i + vec3(0,1,1)), cielHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  float cielFbm(vec3 p) {
    float somme = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave += 1) {
      somme += cielNoise(p) * amplitude;
      p *= 2.07;
      amplitude *= 0.5;
    }
    return somme;
  }

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y, -1.0, 1.0);
    float vers = clamp(dot(dir, normalize(versSoleil)), -1.0, 1.0);

    // Le degrade principal, adouci par une puissance : un ciel ne monte pas
    // lineairement du sable au bleu, il bascule vite puis se stabilise.
    float montee = smoothstep(-0.05, 0.72, h);
    vec3 couleur = mix(bas, haut, pow(montee, 0.62));

    /*
     * La brume d'horizon, plus haute du cote du soleil.
     * C'est la diffusion atmospherique : elle depend de l'angle au soleil, pas
     * seulement de la hauteur. Une bande d'egale epaisseur tout autour serait
     * le principal indice qu'on regarde un degrade et pas un ciel.
     */
    float chaleur = pow(max(vers * 0.5 + 0.5, 0.0), 3.0);
    float bande = smoothstep(0.34 + chaleur * 0.24, -0.05, h);
    couleur = mix(couleur, brume, bande * (0.55 + chaleur * 0.45));

    // Le halo du soleil, puis son disque.
    float halo = pow(max(vers, 0.0), 26.0);
    couleur += soleil * halo * 0.55;
    float disque = smoothstep(0.99955, 0.99985, vers);
    couleur = mix(couleur, soleil * 1.35, disque);

    /*
     * Les nuages hauts. Ils sont etires horizontalement : le vent d'altitude,
     * et ne s'accrochent qu'au-dessus de l'horizon, sinon ils flotteraient
     * devant les montagnes.
     */
    vec3 q = dir * vec3(1.0, 2.6, 1.0) * 2.2;
    float voile = cielFbm(q * vec3(0.45, 1.0, 0.45));
    float nuage = smoothstep(0.52, 0.78, voile) * smoothstep(0.02, 0.3, h);
    vec3 teinteNuage = mix(vec3(1.0), soleil, 0.55 + chaleur * 0.35);
    couleur = mix(couleur, teinteNuage, nuage * 0.34);

    /*
     * Le tramage. Un degrade code sur huit bits par canal montre des bandes
     * visibles sur une surface aussi lisse qu'un ciel ; un demi-niveau de bruit
     * les dissout completement, pour un cout nul.
     */
    float grain = cielHash(vec3(gl_FragCoord.xy, 1.0)) - 0.5;
    couleur += grain / 255.0;

    gl_FragColor = vec4(couleur, 1.0);
  }
`

/**
 * La direction du soleil.
 *
 * Elle DOIT rester d'accord avec la lumiere directionnelle du Seuil : un
 * disque solaire d'un cote et des ombres portees de l'autre, c'est l'erreur qui
 * fait qu'une image « sonne faux » sans qu'on sache dire pourquoi.
 */
const SUN_DIRECTION: [number, number, number] = [-190, 70, 230]

export function Sky(): React.ReactElement {
  return (
    <mesh scale={900}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        fog={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          haut: { value: colorOf(SEUIL.cielHaut) },
          bas: { value: colorOf(SEUIL.cielBas) },
          brume: { value: colorOf(SEUIL.brume) },
          soleil: { value: colorOf(SEUIL.soleil) },
          versSoleil: { value: SUN_DIRECTION },
        }}
      />
    </mesh>
  )
}

/** Convertit un code hexadecimal en triplet lineaire pour le shader. */
function colorOf(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  const srgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255)
  // Conversion sRGB -> lineaire, sinon le degrade parait delave.
  return srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
}
