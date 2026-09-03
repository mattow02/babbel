# Babbel : la Bibliothèque de Babel, dessinée

> **Le fichier de conf unique du projet.** Il remplace `docs/RECHERCHE.md`,
> `docs/ARCHITECTURE.md`, `docs/DIRECTION-ARTISTIQUE.md` et
> `docs/PLAN-ESTHETIQUE.md`, supprimés le 3 septembre 2026 parce qu'ils
> décrivaient l'architecture three.js, abandonnée. S'il y a un désaccord entre
> ce fichier et un autre, c'est celui-ci qui a raison.
> **À tenir à jour à chaque session notable.**

Un site où l'on visite la bibliothèque infinie de Borges, dont chaque livre est
calculé à la volée dans le navigateur du visiteur.

## Attentes de Matteo, non négociables

1. **Fidélité au format de Borges.** 410 pages, 40 lignes, 80 caractères,
   hexagones, 4 murs × 5 étagères × 32 livres. Le format est la contrainte.
2. **Génération côté client.** Les caractères d'une page sont calculés au
   moment où le visiteur tourne la page, **par son navigateur, jamais par
   l'hébergeur**. Exigence explicite : le serveur ne sert que des fichiers
   statiques.
3. **Vraiment propre.** Architecture pensée avant le code, responsabilités
   séparées. Pas de code jeté vite fait.
4. **Astucieux plutôt que brutal.** Le cœur est un problème de mathématiques,
   on l'attaque comme tel.
5. **Vraiment esthétique.** Beau et distinctif, jamais générique. Passer par
   les skills de design avant de coder une UI.

## Les faits, sourcés

**La nouvelle de Borges (1941).** La bibliothèque *est* l'univers : elle n'a
pas d'extérieur, pas de vestibule, pas de dehors. Chaque hexagone a quatre murs
de rayonnages, un couloir, un escalier en colimaçon, et deux petits cabinets
(un pour dormir debout, un pour les besoins). L'alphabet compte **25 symboles**
(22 lettres, l'espace, la virgule, le point), paramétré dans
`core/alphabet.ts` : jamais 25 en dur ailleurs.

**Le nombre.** 25^1 312 000 livres possibles, soit un nombre à plus de
1,8 million de chiffres. **Rien n'est stockable.** Tout est une fonction pure
de l'adresse : il n'y a pas de base de données, il n'y en aura jamais.

**La bijection opère à l'échelle de la page**, pas du livre : 3 200 caractères
font 14 861 bits en `BigInt`, quand un livre entier en ferait 6,1 millions,
trop lourd. Elle utilise le **cycle walking** et non un générateur masqué
(D17) : plus simple à prouver correct, aucun cas particulier.

**Le test qui compte** : `inverse(forward(x)) === x`. S'il casse, tout est
faux. Il vit dans `src/core/__tests__/bijection.test.ts`.

## L'architecture, telle qu'elle est

**Vite + React + TypeScript strict.** Site statique, rien n'est téléchargé :
ni texture, ni police, ni son. Tout est calculé.

```
src/
  core/      TypeScript pur : bijection, adresses, alphabet, pages.
             AUCUNE dépendance à React. Testable sans navigateur.
  workers/   le calcul, hors du thread de rendu. Cache LRU, préchargement.
  vue2d/     les scènes, dessinées en SVG calculé : Seuil, Galerie,
             perspective, couleurs, étages, hash.
  ui/        lecteur, recherche, navigation, routage par fragment d'URL.
  audio/     ambiance synthétisée, aucun fichier audio.
  store/     l'état hors React (zustand) : l'étape, la galerie, le volume ouvert.
```

**Le site est dessiné, pas modélisé** (D62, 3 septembre 2026). Le moteur 3D a
été retiré. Les scènes sont du SVG calculé en React : une galerie, c'est
640 tranches, chacune portant son adresse. Le placement reste de la géométrie
pure et testée, comme en 3D : c'est la partie qui a survécu.

**Les décisions D23 à D61 qui parlent de three.js sont historiques** : elles
disent pourquoi le projet a été construit ainsi, pas ce qu'il est aujourd'hui.

**L'URL vit dans le fragment** (D20) : un site statique n'a alors aucune
réécriture à configurer, et surtout un fragment n'est **jamais envoyé au
serveur**. L'hébergeur ne peut donc pas savoir quelle page on lit, non par
politique de confidentialité mais par construction du web. Une adresse fait
environ 2 890 caractères : ce n'est pas un défaut, le numéro de galerie
**porte** le contenu de la page.

**Deux lieux, et un seul geste entre eux** (3 septembre 2026, D82) : *le Seuil*
(dehors, au soleil rasant) et *les salles des livres* (procédurales, infinies).
On pousse la porte, et l'on y est. Le hall qui servait de sas a été retiré : la
bibliothèque de Borges n'a pas de vestibule. Plus de page d'accueil non plus :
on arrive devant la bibliothèque.

## L'esthétique, telle qu'elle est

**Deux régimes de lumière**, et c'est l'arc du site entier : le Seuil solaire,
calcaire crème et or, ciel teal ; les salles ténébreuses, noir chaud et halos
ambrés. Le visiteur passe du plein soleil aux ténèbres.

**Géométrie primitive et monumentale**, symétrie frontale, point de fuite
central, échelle écrasante. **Répétition sérielle** partout (cyprès,
colonnades, caissons, dos de livres) : elle dit l'infini.

⛔ **Jamais de gris neutre ni de lumière blanche uniforme.** Les ombres tirent
vers le brun violacé, les lumières vers l'ambre.

Référence visuelle : la vidéo « Viens, je vais te Montrer l'Infini »
<https://www.youtube.com/watch?v=J3JsyxABi0g>. Ses images ne sont pas dans le
dépôt, ce qu'on en a retenu est décrit ici.

## Disciplines de dev, toutes payées cher

**Le cœur et le calcul**

- `src/core/` ne dépend de rien. Si le rendu change, le cœur ne bouge pas.
- Tout calcul dans un Web Worker. Le thread de rendu ne calcule jamais.
- Depuis un rendu, appeler `PageLibrary.peek()` (synchrone, cache) et **jamais**
  `read()` en `await`. Une image ne peut pas attendre.
- Toute conversion d'un grand entier vers du texte coûte 0,14 ms : jamais sur
  un chemin chaud (D19). Clé de cache en `BigInt`, pas en chaîne : 300× plus
  rapide.
- Les adresses se comparent **par valeur**, jamais par référence de l'objet :
  sinon la correction dépend de la discipline de l'appelant.

**Le dessin**

- Le placement s'écrit en maths pures dans `vue2d/perspective.ts`, sans rien
  qui touche au DOM : c'est la seule façon de vérifier 640 objets (D24).
- Chaque tranche est un nœud SVG cliquable qui porte son adresse :
  l'interaction est dans le document, pas dans un lancer de rayon.
- **Un décor ne reçoit jamais de clic** (D66). Le dessin est privé d'événements
  dans la feuille de style, et tout ce qui se clique vit dans une couche unique
  dessinée en dernier. Ne jamais compter sur l'ordre du dessin : un halo ajouté
  après une porte l'avale en silence.
- **Ce qui est répété ou symétrique se calcule à partir de l'axe**, jamais à la
  main : une colonnade écrite en dur était décentrée de douze pixels, et plus
  rien ne répondait à rien sans qu'aucun élément ne paraisse faux (D76).
- **Rien ne pose au-dessus de la ligne d'horizon** (D77) : ce qui est plus haut
  qu'elle est au-delà de l'infini. Un élément dont la base y monte flotte, et
  aucune retouche de couleur n'y changera rien.
- Une **élévation frontale ne montre aucune face latérale**. La masse se dit par
  les ressauts, pas par des parallélogrammes de côté.
- **C'est le noir du contact qui pose un objet** (D79), avant le socle et avant
  l'ombre portée. Sans lui tout flotte, quel que soit le détail ajouté. Le
  défaut a été relevé trois fois : arbres, piliers, silhouettes.
- L'**ordre de dessin est un fait de la scène**, pas une affaire de boucle
  (D78) : trier par profondeur à la construction, et séparer les ombres des
  objets en deux passes.
- Un **membre est une ligne épaissie**, jamais une surface dessinée contour par
  contour : sinon l'épaisseur du coude finit par égaler la longueur du bras
  (D81). Un arc tracé au fil se lit comme un fil.
- Une **silhouette** a besoin de quelque chose derrière elle et de rien devant :
  un voile de lumière peint par-dessus la ramène à la valeur du fond (D81).
- Une **porte n'est pas un trou** : encadrement, seuil, et surtout une
  **épaisseur** de mur visible en coupe (D75).
- Pour dérégler un alignement, passer par `vue2d/hash.ts` : **jamais** par une
  multiplication, qui est affine et produit un motif périodique (D32).

**Le mouvement**

- Ce qui bouge bouge par `transform` ou `opacity` dans la feuille de style,
  jamais par du JavaScript : aucune image n'est calculée (D72). Une boucle se
  referme sur elle-même, et les périodes ne tombent jamais en cadence, sinon le
  mouvement se lit comme un mécanisme.
- Le bloc `prefers-reduced-motion` va en **fin** de feuille de style : à
  spécificité égale, la dernière règle écrite gagne. Placé avant les
  animations, il ne les éteint pas.
- Le mouvement réduit arrête ce qui se **déplace**, pas ce qui **luit** (D74) :
  une variation d'opacité ne déplace rien, et le réglage est courant sur un PC
  de bureau sans signaler aucun trouble.
- Ce qui peut être une **fonction du temps** ne doit pas devenir un état.
- L'URL ne s'écrit qu'au **premier geste** qui la justifie (D73) : au
  chargement, on est devant le monument, pas dans un livre.

**Le reste**

- Toute logique un peu subtile d'une scène est extraite en module pur et testée
  (`perspective.ts`, `couleurs.ts`, `etages.ts`, `hash.ts`).
- Une colonne de grille en `auto` se dimensionne sur son contenu : le
  `max-width: 100%` de l'enfant ne mord alors sur rien et déborde. C'est
  `minmax(0, 1fr)` qu'il faut. Le piège s'est présenté deux fois.
- Mesurer avant d'optimiser, **et vérifier ce que l'on mesure** : le banc du
  projet a longtemps chronométré la soumission d'une image et non son
  affichage, ce qui faisait croire le site rapide.
- `?sonde` dans l'URL installe les fonctions de mesure sur un build de
  production.
- **`npm run check`** (typecheck + lint + tests) doit être vert avant tout
  commit.

## L'état, au 3 septembre 2026

**194 tests verts**, build vert, environ 250 Ko de paquet dont 75 Ko gzippés
pour lire. Site statique, aucun serveur.

Les sept phases prévues sont faites (cœur, worker, lecteur, galerie,
navigation, Seuil, esthétique, recherche), puis le projet a quitté la 3D et
perdu son hall. Il est **publié en réalisation Cobaalt** sur `cobaalt.app`, et
servi depuis `~/projets/cobaalt/web/public/babel/`.

Dépôt : <https://github.com/mattow02/babbel>, branche `master`.

## Ce qui n'est pas fait

- Le **Seuil est une invention** : chez Borges, la bibliothèque *est* l'univers,
  elle n'a pas d'extérieur. Il est gardé comme seuil de fiction, à assumer
  franchement ou à retirer comme l'a été le hall.
- Les **deux petits cabinets** du zaguán ne sont pas dessinés.
- **Aucun test sur un vrai appareil mobile.**

## Les deux journaux qui restent

`docs/ROADMAP.md` tient le journal des phases et des reprises, et sa fin liste
honnêtement ce qui reste. `docs/DECISIONS.md` tient les 82 décisions
structurantes et leur pourquoi : c'est là qu'on va pour savoir *pourquoi* le
code est ainsi, et c'est ce qui a permis d'annuler proprement le hall.
