/**
 * Ce que la sonde de mesure ajoute a la fenetre.
 *
 * Declarer ces champs plutot que de convertir `window` a chaque usage : les
 * conversions `as unknown as` masquent le compilateur, alors que cette
 * declaration l'informe. Elle dit aussi, noir sur blanc, quelle est la surface
 * exacte ajoutee au navigateur — et elle n'est posee que sur demande (`?sonde`,
 * voir scene/PerfProbe.tsx).
 */
interface BabbelReleve {
  readonly fps: number
  readonly calls: number
  readonly triangles: number
}

interface Window {
  /** Dernier releve publie, quatre fois par seconde. */
  __babbel?: BabbelReleve
  /** Chronometre N rendus et rend le cout d'une image. */
  __babbelBench?: (frames?: number) => Record<string, unknown>
  /** Fait avancer la boucle de rendu de N images. */
  __babbelStep?: (frames?: number, msPerFrame?: number) => number
}
