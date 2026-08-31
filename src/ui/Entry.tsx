import { PAGE_COUNT } from '../core/index.ts'

/**
 * L'ecran d'entree.
 *
 * Il porte trois choses a la fois :
 *   - le titre, et la seule phrase qui dit de quoi il s'agit ;
 *   - le geste qui autorise le son (aucun navigateur ne le donne autrement) ;
 *   - le temps de reveiller le worker de generation, dont le demarrage coute
 *     60 ms qu'il vaut mieux payer ici (releve de la phase 2).
 *
 * Le nombre affiche n'est pas une figure de style : c'est le decompte exact
 * des pages de la bibliotheque, calcule au chargement.
 */
export function Entry({
  onEnter,
  onOpenShared,
}: {
  onEnter: () => void
  /**
   * Present quand l'URL porte deja une adresse : quelqu'un a partage une page.
   *
   * On lui donne alors la premiere place. C'est ce qu'il est venu chercher, et
   * c'est aussi ce qui permet de ne pas telecharger la 3D pour rien.
   */
  onOpenShared?: (() => void) | undefined
}): React.ReactElement {
  const chiffres = PAGE_COUNT.toString().length

  if (onOpenShared) {
    return (
      <div className="entree">
        <div className="entree__contenu">
          <h1 className="entree__titre">
            <span>La Bibliothèque</span>
            <span>de Babel</span>
          </h1>
          <p className="entree__phrase">
            Quelqu’un vous a envoyé une page. Elle n’est stockée nulle part&nbsp;: son adresse
            suffit à la <em>recalculer</em>, ici, dans votre navigateur.
          </p>
          <button type="button" className="entree__bouton" onClick={onOpenShared} autoFocus>
            ouvrir la page
          </button>
          <button type="button" className="entree__second" onClick={onEnter}>
            ou visiter la bibliothèque
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="entree">
      <div className="entree__contenu">
        <h1 className="entree__titre">
          <span>La Bibliothèque</span>
          <span>de Babel</span>
        </h1>
        <p className="entree__phrase">
          Toutes les pages possibles de quatre‑vingts caractères sur quarante lignes,
          rangées dans des galeries hexagonales. Rien n’est stocké&nbsp;: chaque page est
          calculée, au moment où vous la tournez, par votre propre navigateur.
        </p>
        <p className="entree__chiffre">
          <strong>{chiffres.toLocaleString('fr-FR')}</strong>
          <span>chiffres au compteur des pages</span>
        </p>
        <button type="button" className="entree__bouton" onClick={onEnter} autoFocus>
          entrer
        </button>
        <p className="entree__note">avec le son, de préférence</p>
      </div>
    </div>
  )
}
