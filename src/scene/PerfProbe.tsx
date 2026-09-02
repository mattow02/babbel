import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Raycaster, Vector2 } from 'three'
import { ecarts, mesurerPhotometrie } from '../mesure/photometrie.ts'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { VUES, vuePar } from './vues.ts'

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
 * Les fonctions de mesure ne sont pas dangereuses : ce site ne sait rien de
 * personne, mais elles n'ont rien a faire sur la page de tout le monde. Elles
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

      /*
       * Le compte d'appels se lit sur UNE image, pas sur la serie.
       *
       * Fiber desarme la remise a zero automatique de `gl.info` pour la
       * piloter lui-meme a chaque image. Une boucle de rendu comme celle
       * ci-dessus fait donc s'additionner les compteurs, et l'on relevait
       * 2 318 appels la ou il y en a une quarantaine. Un outil de mesure qui
       * se trompe d'un facteur soixante est pire que pas d'outil du tout : on
       * remet a zero, on rend une image, on lit.
       */
      gl.info.reset()
      gl.render(scene, camera)

      return {
        /*
         * Attention a ce que ces deux nombres veulent dire.
         *
         * `msParImage` est le temps que met le PROCESSEUR a soumettre une
         * image, pas le temps qu'elle met a s'afficher. Le travail de la carte
         * graphique se fait apres, sans qu'on l'attende : une scene qui rend a
         * trois images par seconde peut tres bien annoncer 0,3 ms ici. C'est
         * ce qui a longtemps fait croire ce site rapide.
         *
         * `fps` est la cadence reellement observee, relevee par la boucle
         * d'affichage. C'est celui-la qu'il faut regarder.
         */
        msParImage,
        fps: window.__babbel?.fps ?? 0,
        soumissionSeulement: true,
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

    /*
     * Les points de vue de reference, tels que le module les definit.
     *
     * Le script de captures les lit ICI plutot que de tenir sa propre liste :
     * deux listes finissent toujours par diverger, et c'est alors le script
     * qui a raison contre le code.
     */
    window.__babbelVues = () => VUES.map((vue) => ({ ...vue }))

    /*
     * Le profil de qualite reellement en vigueur.
     *
     * Une mesure qui ne dit pas quelle version du rendu elle a mesuree ne vaut
     * rien : un navigateur pilote annonce « animations reduites » par defaut,
     * et le site lui sert alors sa version minimale, sans post-traitement. On
     * a cherche longtemps pourquoi la lampe ne rayonnait pas.
     */
    window.__babbelProfil = () => useLibraryStore.getState().profile

    /*
     * La photometrie de l'image affichee.
     *
     * On mesure dans la page plutot qu'en dehors : le navigateur sait deja
     * lire son propre canevas, et le faire ailleurs demanderait de decoder un
     * PNG, donc une dependance de plus pour la meme reponse. Le calcul, lui,
     * vit dans un module pur et teste.
     */
    /*
     * Recopie l'image rendue dans un canevas ordinaire.
     *
     * Le rendu est refait juste avant : un canevas WebGL ne conserve pas son
     * tampon d'une image a l'autre, et le lire sans le redessiner rend du
     * noir. C'est aussi ce qui garantit que la mesure et l'image enregistree
     * portent exactement sur la meme image.
     */
    const recopier = (cote: number): { plan: HTMLCanvasElement; largeur: number; hauteur: number } => {
      /*
       * On fait avancer la BOUCLE, on ne rend pas la scene soi-meme.
       *
       * `gl.render` dessine le monde brut et court-circuite le compositeur :
       * ni bloom, ni vignettage, ni grain. Les captures montraient donc une
       * image que personne ne voit, et l'on a cherche un moment pourquoi la
       * lampe ne rayonnait pas alors que le bloom etait simplement absent de
       * l'image mesuree.
       */
      advance(performance.now())
      const source = gl.domElement
      const largeur = Math.min(cote, source.width)
      const hauteur = Math.max(1, Math.round((largeur * source.height) / source.width))
      const plan = document.createElement('canvas')
      plan.width = largeur
      plan.height = hauteur
      const ctx = plan.getContext('2d')
      if (!ctx) throw new Error('photometrie : pas de contexte 2d')
      ctx.drawImage(source, 0, 0, largeur, hauteur)
      return { plan, largeur, hauteur }
    }

    window.__babbelPhoto = (cote = 420) => {
      const { plan, largeur, hauteur } = recopier(cote)
      const { data } = plan.getContext('2d')!.getImageData(0, 0, largeur, hauteur)
      return { ...mesurerPhotometrie(data, largeur, hauteur), largeur, hauteur }
    }

    /*
     * L'image rendue, en PNG.
     *
     * La capture d'ecran du pilote attend que la page se stabilise, ce qu'une
     * scene animee ne fait jamais : elle expire. On rend donc l'image
     * nous-memes, ce qui a l'avantage de livrer exactement celle qui est
     * mesuree juste a cote.
     */
    window.__babbelImage = (cote = 1600) => recopier(cote).plan.toDataURL('image/png')

    /*
     * Le verdict d'une vue : sa mesure, et ce qui lui manque.
     *
     * La comparaison a l'objectif vit dans le module teste, pas dans le
     * script de captures : c'est la seule facon qu'un critere de sortie ne
     * puisse pas etre assoupli par inadvertance depuis l'outillage.
     */
    window.__babbelControle = (nom, cote = 420) => {
      const vue = vuePar(nom)
      const mesure = window.__babbelPhoto?.(cote)
      if (!vue || !mesure) return null
      return { mesure, manques: vue.objectif ? ecarts(mesure, vue.objectif) : [] }
    }


    return () => {
      delete window.__babbelBench
      delete window.__babbelViser
      delete window.__babbelScene
      delete window.__babbelEtat
      delete window.__babbelStage
      delete window.__babbelStep
      delete window.__babbelVues
      delete window.__babbelProfil
      delete window.__babbelPhoto
      delete window.__babbelControle
      delete window.__babbelImage
      delete window.__babbel
    }
  }, [gl, scene, camera, advance, viseur, centreEcran])

  return null
}
