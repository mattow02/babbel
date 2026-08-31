# Audit — Babbel

> Revue complète du projet au 2026-08-31, après achèvement de la roadmap et des
> chantiers restants. Méthode : lecture du code, mesures dans un navigateur réel,
> et vérification des propriétés par des tests écrits pour l'occasion.
>
> **Tous les constats P1 et P2 ont été corrigés**, et chaque correction est
> vérifiée. Ce document garde leur trace plutôt que de les effacer : savoir ce
> qui a cassé, et pourquoi, vaut mieux qu'une liste vide.
>
> Plusieurs de ces défauts ne sont pas des découvertes de relecture — ce sont
> des bugs que j'avais écrits. Trois n'ont été trouvés qu'en écrivant le test
> censé prouver que tout allait bien.

## 1. L'état, en chiffres

| | |
|---|---|
| Fichiers source | 94 |
| Lignes (hors tests) | ≈ 6 500 |
| Lignes de tests | ≈ 2 350 |
| Tests | **256**, répartis en 26 fichiers |
| Avertissements de lint | **0** |
| `TODO` / `FIXME` / `@ts-ignore` / `as any` / assertions `!` | **0** |
| Conversions `as unknown as` | **2**, toutes deux justifiées |
| Dépendances de production | 8 |
| Vulnérabilités connues (`npm audit`) | **0** |
| Poids livré, pour lire | **69 Ko gzip** (cœur + worker + lecteur) |
| Poids livré, pour visiter | + 292 Ko gzip, chargés **seulement si l'on entre** |
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

## 3. P1 — corrigés

### P1.1 — La surface de débogage ne part plus d'office ✅
`__babbel`, `__babbelBench` et `__babbelStep` ne s'installent plus que sur
demande explicite — `?sonde` dans l'URL, ou en développement — et se retirent
proprement au démontage.

On ne les a pas supprimées : ce sont elles qui permettent de mesurer le **build
de production** dans un navigateur où compter les images par seconde ne veut
rien dire. Les retirer, c'était perdre le seul moyen de mesure honnête du
projet. Elles sont désormais opt-in, ce qui règle le vrai reproche : elles
n'ont rien à faire sur la page de tout le monde.

### P1.2 — La 3D n'est plus payée par qui vient lire ✅
La galerie est chargée en différé. Le paquet initial tombe de **347 Ko à 69 Ko
gzippés** ; les 292 Ko de three.js et de sa chaîne d'effets ne sont téléchargés
que si le visiteur entre. **Cinq fois moins pour lire une page.**

Et le bénéfice est réellement atteignable : quand l'URL porte déjà une adresse
— ce que produit la recherche, donc le cas le plus probable de partage —
l'écran d'entrée propose d'abord **« ouvrir la page »**, et cette voie ne
télécharge jamais la galerie. Vérifié dans le navigateur : lecture affichée,
aucun canvas, chunk `Gallery` absent des ressources chargées.

### P1.3 — Intégration continue ✅
`.github/workflows/verification.yml` : types, lint, les 256 tests et le build,
à chaque poussée et à chaque demande de fusion.

### P1.4 — Le cache n'est plus lu pendant le rendu ✅
`PageLibrary` expose un abonnement, et `usePageText` passe par
`useSyncExternalStore` — l'API prévue exactement pour lire un état mutable
extérieur à React sans risquer l'incohérence si un rendu est interrompu puis
repris.

**Un second défaut est apparu en écrivant le test :** les adresses étaient
comparées **par référence**. Un parent qui reconstruit l'objet à chaque rendu
aurait vu les erreurs disparaître — et, plus grave, aurait relancé l'effet en
boucle, donc la génération. La comparaison se fait désormais sur le numéro
d'emplacement, qui identifie une page par valeur.

---

## 4. P2 — corrigés

### P2.1 — La modale tient enfin le focus qu'elle annonce ✅
`useFocusTrap` retient la tabulation dans la modale, boucle aux extrémités et
rend le focus à l'élément qui l'avait. La logique de bouclage est isolée dans
`ui/focus.ts` et testée à part.

**Défaut trouvé en le testant :** la première version filtrait les éléments
focalisables sur leur visibilité calculée (`offsetParent`). Cela dépend du
moteur de rendu, ne veut rien dire hors d'un navigateur, et se serait cassé sur
n'importe quel changement de mise en page. Le sélecteur écarte déjà ce qui est
désactivé : c'est suffisant, et c'est vérifiable.

### P2.2 — Le lecteur ne fait plus énoncer 3 200 caractères au hasard ✅
Le bloc est `aria-hidden`, et un résumé lisible le remplace :
*« Page de 40 lignes de 80 caractères. Elle commence par : … »*. C'est ce qu'un
lecteur voyant perçoit en un coup d'œil.

### P2.3 — React est testé ✅
`jsdom` et Testing Library ajoutés. **29 tests** couvrent désormais le lecteur,
la recherche, le piège à focus et `usePageText` — y compris le clignotement
qu'on cherchait à éviter, l'attribution d'une erreur à la bonne page, et le
préchargement des voisines.

### P2.4 — Licence ✅
MIT. **À confirmer** : c'est le choix par défaut le plus permissif, pas une
décision réfléchie sur ce que ce projet doit permettre.

### P2.5 — Conversions ramenées de 8 à 2 ✅
Un fichier de déclarations (`src/globals.d.ts`) informe le compilateur de la
surface ajoutée par la sonde au lieu de la contourner, et le protocole du
worker est typé par une union. Les deux restantes sont irréductibles : la
bibliothèque DOM masque le type de `self` dans un worker, et
`webkitAudioContext` n'est typé nulle part.

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
- **Les décisions sont écrites.** 50 décisions datées, chacune avec son
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

## 7. Ce qui reste ouvert

Une seule chose, et elle n'est pas corrigeable ici :

**Aucun test sur un vrai appareil mobile.** Le mode dégradé est décidé par une
fonction testée, et le rendu a été vérifié dans une fenêtre de 390 × 844 —
profil réduit appliqué, aucun débordement, page lisible et défilante. Mais une
fenêtre étroite n'est pas un téléphone : ni le même processeur graphique, ni la
même chauffe, ni le même pointeur. **À vérifier sur un appareil réel.**

Les quatre constats de la section 5 restent vrais par nature — ce ne sont pas
des défauts à corriger, mais des propriétés à connaître.

## 8. Ce qu'il faudra surveiller

- **Le coût par pixel.** Le constat A6 l'a montré : un shader peut ruiner le
  budget d'image sans jamais toucher au nombre d'appels de rendu ni de
  triangles. Mesurer le **temps d'une image**, pas seulement les compteurs.
- **Les seuils de temps dans les tests.** Un test qui compare une durée à un
  budget d'image mesure autant la machine que le code. Il en reste un ; sa
  marge a été élargie et la raison est écrite à côté.
- **La comparaison des adresses.** Toujours par valeur — le numéro
  d'emplacement — jamais par référence de l'objet.
