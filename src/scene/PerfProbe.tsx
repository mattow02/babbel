import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useLibraryStore } from '../store/useLibraryStore.ts'

/**
 * Le releve de performance, maison.
 *
 * `r3f-perf` refuse de cohabiter avec Fiber 9, et de toute facon nous n'avons
 * besoin que de deux nombres : les appels de rendu et les images par seconde.
 * Les lire directement dans `gl.info` coute zero dependance et donne aussi de
 * quoi verifier automatiquement le critere de sortie depuis le navigateur.
 *
 * Le releve est ecrit dans le store QUATRE fois par seconde, jamais a chaque
 * image : c'est tout l'interet d'avoir sorti cet etat de React (D21).
 */
export function PerfProbe(): null {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const setPerf = useLibraryStore((state) => state.setPerf)
  const images = useRef(0)
  // Initialise a la premiere image, jamais pendant le rendu : appeler
  // `performance.now()` au rendu est impur et donne des resultats instables.
  const depuis = useRef(0)

  useFrame(() => {
    const maintenant = performance.now()
    if (depuis.current === 0) {
      depuis.current = maintenant
      return
    }
    images.current += 1
    const ecoule = maintenant - depuis.current
    if (ecoule < 250) return

    const releve = {
      fps: Math.round((images.current * 1000) / ecoule),
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    }
    setPerf(releve)
    ;(window as unknown as { __babbel?: unknown }).__babbel = releve
    images.current = 0
    depuis.current = maintenant
  })

  /*
   * Un banc d'essai appelable de l'exterieur.
   *
   * Compter les images par seconde ne veut rien dire quand la fenetre est
   * occultee : le navigateur bride alors requestAnimationFrame a une image par
   * seconde, et la mesure ne dit plus rien du cout reel du rendu. On expose
   * donc de quoi forcer N rendus d'affilee et chronometrer, ce qui donne le
   * cout d'une image independamment de la cadence d'affichage.
   */
  useEffect(() => {
    const bench = (frames = 200): Record<string, unknown> => {
      gl.render(scene, camera) // une image de chauffe, hors mesure
      const depart = performance.now()
      for (let index = 0; index < frames; index += 1) {
        gl.render(scene, camera)
      }
      const msParImage = (performance.now() - depart) / frames
      return {
        msParImage,
        fpsEquivalent: Math.round(1000 / msParImage),
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        camera: {
          position: camera.position.toArray().map((n) => Number(n.toFixed(3))),
          pitchDeg: Number(((camera.rotation.x * 180) / Math.PI).toFixed(1)),
        },
      }
    }
    ;(window as unknown as { __babbelBench?: unknown }).__babbelBench = bench
  }, [gl, scene, camera])

  return null
}
