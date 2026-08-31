import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Raycaster, Vector2 } from 'three'
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
/**
 * La sonde est-elle demandee ?
 *
 * Les fonctions de mesure ne sont pas dangereuses — ce site ne sait rien de
 * personne — mais elles n'ont rien a faire sur la page de tout le monde. Elles
 * ne s'installent donc que sur demande explicite : `?sonde` dans l'URL, ou en
 * developpement.
 *
 * On ne les supprime pas purement et simplement : ce sont elles qui permettent
 * de mesurer le BUILD DE PRODUCTION dans un navigateur ou compter les images
 * par seconde ne veut rien dire. Les retirer, c'est perdre le seul moyen de
 * mesure honnete dont dispose ce projet.
 */
function sondeDemandee(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('sonde')
}

export function PerfProbe(): null {
  // Alloues une fois : la sonde ne doit rien couter quand on ne s'en sert pas.
  const viseur = useMemo(() => new Raycaster(), [])
  const centreEcran = useMemo(() => new Vector2(0, 0), [])
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const advance = useThree((state) => state.advance)
  const setPerf = useLibraryStore((state) => state.setPerf)
  const images = useRef(0)
  // Initialise a la premiere image, jamais pendant le rendu : appeler
  // `performance.now()` au rendu est impur et donne des resultats instables.
  const depuis = useRef(0)

  /*
   * Avec un composeur d'effets, `gl.info` est remis a zero a chaque PASSE :
   * lu tel quel, il ne rapporte que la derniere passe, soit « 1 appel ». On
   * desactive donc la remise a zero automatique et on la fait nous-memes, une
   * fois par image : le compteur totalise alors la scene ET le post-traitement,
   * ce qui est le seul chiffre honnete.
   */
  useEffect(() => {
    // Le linter deconseille de modifier ce qu'un hook a rendu. Ici c'est
    // l'objet three.js lui-meme, dont c'est l'API prevue : il n'y a pas
    // d'autre facon de desactiver la remise a zero automatique.
    // oxlint-disable-next-line react/immutability
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
    }
  }, [gl])

  const derniersAppels = useRef(0)
  const derniersTriangles = useRef(0)

  useFrame(() => {
    // On lit le total de CETTE image, puis on remet le compteur a zero. Sans
    // cela, `gl.info` cumulerait toutes les images depuis le dernier releve.
    derniersAppels.current = gl.info.render.calls
    derniersTriangles.current = gl.info.render.triangles
    gl.info.reset()

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
      calls: derniersAppels.current,
      triangles: derniersTriangles.current,
    }
    setPerf(releve)
    if (sondeDemandee()) window.__babbel = releve
    images.current = 0
    depuis.current = maintenant
  }, 2)

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
    if (!sondeDemandee()) return
    window.__babbelBench = bench
    // La scene elle-meme : de quoi lancer un rayon a la main depuis la console
    // et verifier ce que le reticule designe reellement.
    window.__babbelScene = { scene, camera }
    /*
     * Ce que le reticule designe VRAIMENT.
     *
     * Le meme tir que celui de la scene, mais lance depuis la console : c'est
     * le seul moyen de distinguer « le rayon ne touche rien » de « la scene ne
     * fait rien du rayon », et cette distinction a deja coute une soiree.
     */
    window.__babbelViser = (x = 0, y = 0) => {
      centreEcran.set(x, y)
      viseur.setFromCamera(centreEcran, camera)
      const rayon = {
        origine: viseur.ray.origin.toArray().map((n) => Number(n.toFixed(3))),
        direction: viseur.ray.direction.toArray().map((n) => Number(n.toFixed(3))),
      }
      const touches = viseur.intersectObjects(scene.children, true).slice(0, 4).map((touche) => ({
        distance: Number(touche.distance.toFixed(3)),
        instance: touche.instanceId ?? -1,
        instances: (touche.object as { count?: number }).count ?? -1,
        type: touche.object.type,
      }))
      return { rayon, touches }
    }
    window.__babbelEtat = () => {
      const { stage, opened, hexagon } = useLibraryStore.getState()
      return { stage, opened, hexagon: hexagon.toString() }
    }
    window.__babbelStage = (stage) => {
      const store = useLibraryStore.getState()
      if (stage === 'threshold') store.begin()
      else if (stage === 'parvis') store.arrive()
      else if (stage === 'hall') store.enterHall()
      else if (stage === 'library') store.enterLibrary()
    }

    /*
     * Faire tourner la boucle a la demande.
     *
     * Indispensable pour verifier la stabilite memoire : dans un navigateur
     * pilote dont la fenetre est occultee, requestAnimationFrame est bride a
     * une image par seconde, et l'on ne peut pas « marcher cinq minutes ».
     * Cette fonction avance la simulation autant de fois qu'on le demande.
     */
    const step = (frames = 600, msPerFrame = 16.67): number => {
      let clock = performance.now()
      for (let index = 0; index < frames; index += 1) {
        clock += msPerFrame
        advance(clock)
      }
      return frames
    }
    window.__babbelStep = step

    return () => {
      delete window.__babbelBench
      delete window.__babbelViser
      delete window.__babbelScene
      delete window.__babbelEtat
      delete window.__babbelStage
      delete window.__babbelStep
      delete window.__babbel
    }
  }, [gl, scene, camera, advance, viseur, centreEcran])

  return null
}
