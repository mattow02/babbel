import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { Library } from './Library.tsx'
import { PALETTE } from './materials/palette.ts'

/**
 * La toile.
 *
 * Choix de rendu qui viennent de la direction artistique :
 *   - tone mapping ACES, indispensable pour tenir ces contrastes ;
 *   - brouillard exponentiel de la couleur du noir chaud, qui fait disparaitre
 *     les galeries lointaines au lieu de les couper net ;
 *   - `dpr` plafonne a 1,5 : au-dela on paye des pixels que personne ne voit.
 *
 * Les commandes sont provisoires. La navigation reelle — souris pour le
 * regard, clic maintenu pour avancer, travelling vers les points d'interet
 * (D13) — arrive en phase 5. Ici, une orbite suffit a inspecter la geometrie.
 */
export function Gallery(): React.ReactElement {
  return (
    <Canvas
      /*
       * `shadows` tout court demande PCFSoftShadowMap, qui est deprecie depuis
       * three 0.185 et retombe silencieusement sur PCFShadowMap. Autant le
       * demander explicitement plutot que de laisser une retrogradation muette.
       */
      shadows="percentage"
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      /*
       * On se tient en retrait, dos a un couloir, et on regarde vers l'autre :
       * la porte d'en face cadre la galerie suivante, et celle d'apres. C'est
       * le plan qui raconte l'infini.
       *
       * Le point de vue est BAS et legerement en contre-plongee : c'est la
       * grammaire de cadrage des images de reference (DIRECTION-ARTISTIQUE
       * § 4), et cela evite surtout que le sol, tout proche, mange le cadre.
       */
      camera={{ position: [-1.645, 1.42, -0.95], fov: 55, near: 0.05, far: 60 }}
      /*
       * Piege : la camera par defaut de R3F regarde l'origine (0, 0, 0), et le
       * `target` d'OrbitControls ne la reoriente PAS au montage. Sans ce
       * lookAt, on regardait le sol a 37 degres sous l'horizon. On vise donc
       * explicitement, a hauteur d'oeil.
       */
      onCreated={({ camera }) => {
        camera.lookAt(0, 1.42, 0)
      }}
    >
      <color attach="background" args={[PALETTE.nuit]} />
      <fogExp2 attach="fog" args={[PALETTE.nuit, 0.085]} />
      <Library depth={1} />
      <OrbitControls
        target={[0, 1.42, 0]}
        enablePan={false}
        minDistance={0.6}
        maxDistance={6}
        rotateSpeed={-0.35}
      />
    </Canvas>
  )
}
