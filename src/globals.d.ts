/**
 * Ce que la sonde de mesure ajoute a la fenetre.
 *
 * Declarer ces champs plutot que de convertir `window` a chaque usage : les
 * conversions `as unknown as` masquent le compilateur, alors que cette
 * declaration l'informe. Elle dit aussi, noir sur blanc, quelle est la surface
 * exacte ajoutee au navigateur, et elle n'est posee que sur demande (`?sonde`,
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
  /**
   * L'etat du site, pour se rendre directement quelque part.
   *
   * Indispensable pour verifier un lieu dans un navigateur pilote : la
   * sequence d'arrivee dure une quinzaine de secondes, et une fenetre occultee
   * ne rend qu'une image par seconde. Sans cela, atteindre le hall demanderait
   * un quart d'heure de patience par capture.
   */
  __babbelStage?: (stage: string) => void
  /** L'etat courant : etape, volume ouvert, galerie. */
  __babbelEtat?: () => { stage: string; opened: unknown; hexagon: string }
  /** La scene et la camera, pour viser a la main depuis la console. */
  __babbelScene?: { scene: unknown; camera: unknown }
  /** Tire un rayon depuis le centre de l'ecran et rend ce qu'il rencontre. */
  __babbelViser?: (
    x?: number,
    y?: number,
  ) => {
    rayon: { origine: number[]; direction: number[] }
    touches: { distance: number; instance: number; instances: number; type: string }[]
  }
  /** Ce que le dernier tir de reticule a touche. */
  __babbelVise?: { distance: number; instance: number; portee: number; cibles: number }
  /** Repose le visiteur a un endroit donne du lieu courant. */
  __babbelPlace?: (x: number, z: number, yaw?: number) => void
}
