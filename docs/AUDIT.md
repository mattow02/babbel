# Audit — Babbel

> Revue complète du projet au 2026-08-31, après achèvement de la roadmap et des
> chantiers restants. Méthode : lecture du code, mesures dans un navigateur réel,
> et vérification des propriétés par des tests écrits pour l'occasion.
>
> Les constats sont classés par gravité. **Ce qui a été corrigé pendant l'audit
> est listé en premier, et honnêtement** : plusieurs de ces défauts ne sont pas
> des découvertes de relecture, ce sont des bugs que j'avais écrits.

## 1. L'état, en chiffres

| | |
|---|---|
| Fichiers source | 88 |
| Lignes (hors tests) | ≈ 6 200 |
| Lignes de tests | ≈ 2 000 |
| Tests | **227**, répartis en 22 fichiers |
| Avertissements de lint | **0** |
| `TODO` / `FIXME` / `@ts-ignore` / `as any` / assertions `!` | **0** |
| Dépendances de production | 8 |
| Vulnérabilités connues (`npm audit`) | **0** |
| Poids livré | 1,24 Mo, dont **347 Ko de JavaScript gzippé** |
| Appels de rendu | 39 (extérieur) · 39 (hall) · 54-55 (bibliothèque) · 30 (mobile) |
| Coût d'une image, effets compris | 3,4 ms dehors · **6,4 ms au point le plus chargé** — budget 16,6 ms |

Mesures prises sur le build de production, dans Chromium, sur GPU Intel Iris Xe,
en 2 161 × 1 350 (densité plafonnée à 1,5). Le « point le plus chargé » est le
vestibule : deux lampes, la trémie, la poussière et toute la chaîne d'effets.

TypeScript est en mode strict complet (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`). Le socle mathématique
(`src/core/`) n'a **aucune** dépendance et se teste sans navigateur.

---

## 2. Corrigé pendant l'audit

### A1 — Les parois du puits étaient posées de travers
**Trouvé par un test écrit pendant l'audit**, pas à la lecture.

Dans le vestibule, les quatre parois qui bordent la trémie avaient leurs
dimensions interverties : larges dans l'axe au lieu de la latérale. Elles
rebouchaient donc à moitié l'ouverture qu'elles étaient censées border.

Le test qui l'a attrapé est celui qui compte : *aucune boîte ne doit se trouver
là où les collisions autorisent à marcher*. Les collisions
(`navigation/geometry.ts`) et la construction (`hexagon/parts.ts`) sont deux
descriptions indépendantes du même lieu ; rien ne garantit qu'elles s'accordent
sauf de les confronter. Un mur planté dans le passage est invisible à la
lecture du code et se paye par un visiteur encastré dans la pierre.

### A2 — Aucun secours si WebGL manque
La toile levait une exception au montage et emportait toute la page. Or le
lecteur n'a besoin d'aucune 3D : on ne prive personne des livres pour une carte
graphique. `scene/webgl.ts` teste maintenant la disponibilité **avant** de
monter quoi que ce soit, et l'application se replie sur la lecture seule.

### A3 — Un worker qui échoue à naître emportait le rendu
`createDefaultEngine` ne testait que l'existence de l'API `Worker`. Un worker
peut échouer à naître pour bien d'autres raisons — politique de sécurité de
contenu, fichier introuvable — et l'exception remontait pendant le rendu. La
construction est désormais protégée, avec repli sur le calcul direct.

### A4 — Débordement horizontal en lecture sur petit écran
La page de 80 colonnes poussait toute la mise en page au lieu de défiler dans
sa propre boîte : la colonne de grille se dimensionnait sur son contenu.
Corrigé par `grid-template-columns: minmax(0, 1fr)`.

### A5 — Illisible sur téléphone
80 colonnes tenaient à 7,5 px — techniquement conforme, humainement inutile.
Plancher relevé à 9 px, le bloc défile désormais horizontalement dans sa boîte.
On lit ici des caractères au hasard : la lisibilité prime sur la vue d'ensemble.

### A6 — Le marbre avait fait passer la bibliothèque AU-DESSUS du budget
Le constat le plus important de cet audit, et le seul qui aurait dégradé
l'expérience pour tout le monde.

Le motif de marbre procédural avait été appliqué au calcaire des murs avec les
réglages d'une surface de premier plan : cinq octaves de bruit fractal, évaluées
**deux fois** par pixel (déformation puis reprise). Sur les immenses parois d'un
couloir vues de près, cela coûtait cher — le point le plus chargé mesurait
**19,45 ms par image, au-dessus des 16,6 ms d'une image à 60 images/s.**

Aucun test ne pouvait l'attraper : c'est un coût par pixel, invisible au compte
des appels de rendu et au nombre de triangles, qui étaient restés bons.
**Seule la mesure du temps d'une image l'a révélé.**

Correction : le nombre d'octaves et la déformation sont devenus des réglages du
matériau, fixés à la compilation du shader plutôt que lus dans un uniforme. Le
marbre du hall garde quatre octaves et sa déformation ; le calcaire des couloirs
descend à deux octaves sans déformation. Le point le plus chargé mesure
désormais **6,44 ms**, et le motif reste parfaitement lisible.

**Leçon à retenir, ajoutée aux disciplines :** un compte d'appels de rendu qui
ne bouge pas ne prouve rien. Un shader peut ruiner le budget sans jamais toucher
au nombre d'appels ni de triangles.

### A7 — Pas de message sans JavaScript
Ajouté, et il dit la vérité plutôt qu'une excuse : le site calcule chaque page
dans le navigateur, il **ne peut pas** exister en version dégradée.

---

## 3. P1 — à traiter

### P1.1 — Une surface de débogage part en production
`PerfProbe` expose `window.__babbel`, `__babbelBench` et `__babbelStep` sur le
site livré. `__babbelStep` permet de piloter la boucle de rendu depuis la
console.

Ce n'est pas une faille — il n'y a ni donnée ni privilège à voler, le site ne
sait rien de personne — mais c'est du code inutile en production et une surface
sans raison d'être.

*Nuance à assumer :* ces fonctions sont ce qui a permis de vérifier le **build
de production** tout au long du projet, dans un navigateur où compter les images
par seconde ne veut rien dire. Les supprimer purement et simplement ferait
perdre le seul moyen de mesure honnête dont dispose ce projet.
**Recommandation :** les conserver mais les conditionner à un paramètre d'URL
explicite plutôt que de les poser d'office.

### P1.2 — Le premier chargement fait payer la 3D à qui vient lire
347 Ko de JavaScript gzippé, dont l'essentiel est three.js et sa chaîne
d'effets. Quelqu'un qui ouvre une **URL de lecture partagée** — le cas le plus
probable de partage, puisque c'est ce que produit la recherche — télécharge
toute la machinerie 3D pour afficher du texte.

**Recommandation :** charger la galerie en différé (`React.lazy`). Le cœur, le
worker et le lecteur pèsent quelques kilo-octets ; tout le reste peut attendre
que le visiteur veuille entrer.

### P1.3 — Aucune intégration continue
`npm run check` (types + lint + 227 tests) n'existe que sur cette machine et
n'est lancé qu'à la main. Le jour où un tiers touche au dépôt, rien ne l'arrête.

### P1.4 — Un état mutable est lu pendant le rendu
`usePageText` appelle `library.peek()` pendant le rendu pour afficher une page
déjà en cache sans clignotement (décision assumée et commentée). C'est
volontaire et cela évite un rendu en cascade, mais cela lit un état extérieur
mutable pendant une phase que React se réserve le droit d'interrompre.
Aujourd'hui sans conséquence ; à surveiller si le rendu concurrent est activé.

---

## 4. P2 — à corriger quand l'occasion se présente

### P2.1 — La modale de recherche annonce une modalité qu'elle ne tient pas
Elle porte `aria-modal="true"` et met le focus dans le champ, mais **ne piège
pas le focus** : la tabulation s'échappe vers l'arrière-plan. Soit on pose un
piège de focus, soit on retire l'attribut. Annoncer une modalité qu'on n'assure
pas est pire que ne rien annoncer.

### P2.2 — 3 200 caractères aléatoires exposés aux lecteurs d'écran
Le `<pre>` de la page porte un `aria-label` mais son contenu reste lu. Faire
énoncer trois mille caractères sans signification n'aide personne.
**Recommandation :** `aria-hidden` sur le bloc, et un résumé textuel à côté
(adresse, nombre de lignes, extrait de la première ligne).

### P2.3 — Rien de ce qui est React n'est testé
Les 227 tests portent tous sur des modules purs. Les composants, les hooks
(`usePlayer`, `usePageText`, `useAddress`) et le moteur worker n'ont aucun test.
C'est un choix cohérent — la logique a été systématiquement extraite en modules
purs, précisément pour être testable — mais le câblage, lui, n'est vérifié qu'à
la main dans un navigateur.

Modules sans test direct : `engine.ts`, `page.worker.ts`, `usePlayer.ts`,
`ambience.ts`, `useLibraryStore.ts`, les hooks d'interface.

### P2.4 — Pas de licence
Aucun fichier `LICENSE`. À trancher avant toute mise en ligne publique.

### P2.5 — Huit conversions `as unknown as`
Toutes concentrées aux frontières avec three.js et l'API Web Audio, là où les
types publics ne décrivent pas ce que l'API permet réellement. Aucune ne masque
une erreur de conception, mais chacune est un endroit où le compilateur ne
protège plus.

---

## 5. Constats — ni bugs ni dettes, mais à savoir

### C1 — La bibliothèque peut produire n'importe quel texte
C'est la propriété même de l'objet : elle contient toutes les suites possibles
de 3 200 caractères, donc aussi les pires. La recherche permet d'y **calculer
l'adresse** de n'importe quelle phrase. C'est vrai de libraryofbabel.info depuis
2015 et c'est indissociable du propos de Borges — mais c'est à savoir avant de
publier, parce que cela signifie qu'un lien partagé peut mener à n'importe quoi.

### C2 — Le son n'a que deux états
Muet ou non. Pas de réglage de volume. Le niveau général est volontairement bas.

### C3 — La bibliothèque est une ligne, pas un plan
Les deux murs libres étant opposés (D23), les galeries s'enfilent en ligne
droite ; les étages empilent ces lignes (D43). L'espace est donc à deux
dimensions — colonne et étage — là où Borges suggère un pavage hexagonal
complet. C'est un choix assumé : des ouvertures opposées creusent une
perspective, des ouvertures adjacentes donneraient un labyrinthe.

### C4 — L'éclairage précalculé n'est pas de la cuisson
La décision D16 prévoyait des lightmaps cuites hors ligne. Faute de chaîne de
cuisson, le hall utilise une carte d'environnement rendue **une fois** au
démarrage à partir de quelques sources de forme. C'est l'équivalent le plus
proche disponible dans un navigateur, et le résultat est bon — mais ce n'est pas
de la radiosité, et il ne faut pas prétendre le contraire.

---

## 6. Ce qui tient particulièrement bien

Un audit qui ne relève que des défauts ment par omission.

- **Le cœur est isolé et prouvé.** `src/core/` ne dépend de rien, et le test
  `inverse(forward(x)) === x` couvre 2 000 tirages plus les bornes du domaine.
  Si le rendu était entièrement réécrit, ce dossier ne bougerait pas d'une ligne.
- **Les décisions sont écrites.** 46 décisions datées, chacune avec son
  pourquoi, y compris celles qui ont annulé une décision antérieure.
- **Les mesures sont réelles.** Aucun chiffre de ce document n'est estimé : tous
  viennent d'une exécution dans un navigateur, sur le build de production.
- **La discipline « logique pure + test » a payé, plusieurs fois.** Elle a
  attrapé un hachage affine qui rendait des motifs périodiques, un bourdon qui
  formait un accord au lieu d'une rumeur, un comptage d'appels de rendu faux, et
  les parois du puits posées de travers. Aucun de ces défauts n'était visible à
  la lecture.
- **Rien n'est téléchargé.** Ni texture, ni police, ni son, ni donnée. Le ciel,
  le marbre, la poussière, l'ambiance sonore et les livres sont calculés.

---

## 7. Ordre recommandé

1. **P1.2** — découpage de code : c'est ce qui se voit le plus, et pour tout le
   monde.
2. **P1.3** — intégration continue : c'est ce qui protège tout le reste.
3. **P2.1 et P2.2** — accessibilité : peu de travail, et ce sont des promesses
   actuellement non tenues.
4. **P1.1** — refermer la surface de débogage.
5. **P2.4** — licence, avant toute publication.
