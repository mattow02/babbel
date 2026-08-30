/**
 * La palette du Seuil.
 *
 * Elle est l'inverse de celle de la bibliotheque, et c'est le parti pris
 * central de la direction artistique (§ 1) : ici on est DEHORS, en plein
 * soleil rasant, sur du calcaire clair et sous un ciel teal desature. Le
 * visiteur passera ensuite aux tenebres.
 */
export const SEUIL = {
  /** Calcaire eclaire du dome et des terrasses. */
  calcaire: '#e8dcc8',
  /** Le meme, dans l'ombre. */
  calcaireOmbre: '#c0a988',
  /** La plaine, plus sableuse. */
  plaine: '#c9ad84',
  /** Soleil rasant. */
  soleil: '#ffd9a0',
  /** Ciel, du zenith a l'horizon. */
  cielHaut: '#24424c',
  cielBas: '#9fb6b2',
  /** Brume doree de l'horizon. */
  brume: '#e0b98a',
  /** Les cypres, presque noirs. */
  cypres: '#1e2a1f',
  /** Les montagnes lointaines, en silhouette. */
  montagne: '#4f5a56',
  /** L'or du cube. */
  or: '#d8a53a',
  /** L'interieur du hall, dans l'ombre. */
  hall: '#d8c8ab',
  hallOmbre: '#4a3b30',
} as const
