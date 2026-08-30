# Décisions — Babbel (ADR)

Chaque décision structurante, avec sa raison. On n'annule pas une décision
sans écrire pourquoi.

## Prises

### D1 — Génération procédurale intégrale
25^1 312 000 livres : aucun stockage possible. Le contenu est une fonction pure
de l'adresse. Conséquence : pas de backend, déploiement statique, coût ~0.

### D2 — Bijection à l'échelle de la page, pas du livre
Un livre = 1 312 000 caractères ≈ 6,1 Mbits en BigInt : les opérations
modulaires deviennent lourdes. Une page = 3 200 caractères = 14 861 bits :
sous la milliseconde. C'est aussi ce que fait libraryofbabel.info, et ça
correspond exactement à la demande (génération au tournage de page).

### D3 — Calcul dans un Web Worker
Le thread qui dessine ne calcule jamais. Même si c'est rapide, le principe
protège le framerate pour toujours.

### D4 — BigInt natif, pas de GMP/WASM
JS a BigInt en natif ; à l'échelle page, aucune raison d'ajouter du WASM.
Réévaluer seulement si on passe à une bijection au niveau du livre.

### D5 — InstancedMesh systématique
Le facteur limitant en WebGL2 est le nombre de draw calls, pas les polygones.
640 livres par hexagone => 1 draw call.

### D6 — Streaming par chunks
On ne charge que l'hexagone courant et ses voisins visibles. L'infini est
suggéré par l'obscurité et le brouillard, jamais instancié.

### D7 — Une seule page de texte réel à la fois
Les livres lointains n'ont aucun texte généré, seulement une texture.
C'est ce qui rend l'ensemble tenable.

### D8 — `core/` sans dépendance
Le cœur mathématique est du TypeScript pur, testable sans navigateur.
Le rendu peut être entièrement réécrit sans y toucher.


### D9 — Alphabet : 25 symboles, fidèle à Borges
22 lettres + espace + virgule + point. Choix de fidélité assumé contre la
lisibilité des fragments (l'option 29 caractères de libraryofbabel.info est
écartée). L'alphabet reste **paramétré** dans `core/alphabet.ts` : rien dans le
code ne doit supposer 25 en dur, pour pouvoir changer d'avis sans tout casser.
Décidé le 2026-08-29.

### D10 — Vite + React + TypeScript
Pas de SSR ni d'API à servir : l'expérience est entièrement cliente. HMR rapide,
ce qui est décisif quand on itère sur de la 3D. Build statique.
Décidé le 2026-08-29.

### D11 — Deux mondes distincts : le Seuil et la Bibliothèque
Le projet contient **deux natures de scène**, à ne jamais confondre :

1. **Le Seuil** — scène *authorée à la main*, finie, composée : on arrive à
   l'extérieur, on voit le dôme (demi-sphère), on monte les marches, on franchit
   l'entrée unique, on débouche dans le grand hall où flotte le cube.
   C'est la séquence d'arrivée, le morceau de bravoure esthétique. Budget de
   rendu généreux (scène unique, chargée une fois, jamais dupliquée).
2. **La Bibliothèque** — infinie, *procédurale*, streamée par chunks,
   sous contrainte permanente de draw calls et de mémoire.

Conséquence : deux budgets de performance, deux méthodes de construction, deux
dossiers séparés dans `src/scene/`. Le Seuil peut se permettre ce que la
Bibliothèque ne peut pas. Décidé le 2026-08-29.

### D12 — Navigation à la première personne, sans ZQSD
La première personne est retenue (immersion), mais le clavier ZQSD est écarté :
inconfortable, et inadapté à un site web qu'on visite au trackpad ou au doigt.
Le schéma de contrôle exact reste à trancher (voir O3').
Décidé le 2026-08-29.


### D13 — Schéma de contrôle : clic maintenu + points d'intérêt
- souris : oriente le regard en continu ;
- clic maintenu : on avance vers où l'on regarde ; relâcher : on s'arrête ;
- clic sur un point d'intérêt (étagère, couloir, escalier, livre) : travelling
  cadré vers lui, la caméra compose le plan elle-même ;
- tactile : doigt appuyé = avancer, glissé = regarder. Même logique, rien à réécrire ;
- ZQSD reste fonctionnel en fallback silencieux, jamais annoncé dans l'UI.

Une seule règle à comprendre, une seule main, et les beaux plans sont placés
dans les points d'intérêt plutôt que laissés au hasard du joueur.
Contraintes de confort : accélérations douces, FOV 55-65°, respect de
`prefers-reduced-motion`. Décidé le 2026-08-29.

### D14 — Bijection inversible dès le départ, recherche exposée plus tard
Le LCG est inversible **par construction** : rendre `core/bijection.ts`
réversible ne coûte rien de plus maintenant, alors que l'ajouter après
obligerait à tout reconcevoir. On implémente donc l'inverse et son test dès la
Phase 1, mais l'interface de recherche n'entre dans le périmètre qu'en Phase 7.
Décidé le 2026-08-29.

### D15 — Desktop cible v1, mobile en mode dégradé prévu dès le départ
La qualité visuelle se juge sur desktop. Mais les leviers de dégradation
(`dpr` plafonné, post-processing réduit, LOD agressif, distance de streaming
raccourcie) sont prévus dans l'architecture dès maintenant, pour ne pas avoir à
la retourner plus tard. Décidé le 2026-08-29.


### D16 — Direction artistique arrêtée, et éclairage baké au Seuil
DA établie à partir des 10 captures de `design/` (film « Viens, je vais te
Montrer l'Infini »), documentée dans `docs/DIRECTION-ARTISTIQUE.md`.
Parti pris : **deux régimes de lumière** — le Seuil solaire et doré, la
Bibliothèque ténébreuse — qui recoupe exactement le découpage D11.

Décision technique qui en découle : **le Seuil, étant statique, aura son
éclairage précalculé en lightmaps** (baking hors ligne, chargé comme texture).
C'est ce qui rend atteignable en WebGL une qualité proche des rendus offline de
référence. La Bibliothèque, procédurale, ne peut pas être bakée : elle sera donc
sombre, avec très peu de sources dynamiques — ce qui est précisément le parti
pris artistique du film. La contrainte technique et l'intention esthétique
coïncident. Décidé le 2026-08-29.


### D17 — Cycle walking plutot qu'un LCG masque
Le plan initial reprenait l'approche de libraryofbabel.info : un LCG en
precision arbitraire, plus une couche de XOR et de decalages recalee a coups de
masques ad hoc. Probleme : le domaine est 25^3200, qui n'est pas une puissance
de deux, alors que toutes les operations qui melangent bien les bits vivent
modulo 2^b. Les masques de Basile existent precisement pour rattraper ce
decalage, et ils sont difficiles a prouver corrects.

Retenu a la place : **cycle walking** (Black & Rogaway, 2002). On construit une
permutation de [0, 2^BITS), la plus petite puissance de deux contenant le
domaine, puis on l'applique en boucle jusqu'a retomber dans [0, 25^3200).

Avantages : correction demontrable en une phrase, aucun cas particulier,
inversion exacte et symetrique. Cout : 2^14861 / 25^3200 = 1,58 tour en
moyenne, soit 58 % de calcul en trop — sans consequence, puisqu'un aller-retour
complet mesure 0,6 ms.

La permutation interne enchaine quatre tours de (decalage-XOR, multiplication
par une constante impaire dense), avec inversion des multiplications par
elevation de Hensel plutot qu'Euclide etendu (quatorze tours au lieu d'une
recursion). Decide et implemente le 2026-08-29.


### D18 — Un seul worker, sans etat, avec moteur injectable
Un seul worker suffit : une page coute 0,6 ms, donc meme une file de dix
demandes se vide en 6 ms, bien sous le budget de 16,6 ms d'une image. Ouvrir
plusieurs workers ajouterait complexite et memoire pour un probleme que nous
n'avons pas. On y reviendra si la mesure l'exige.

Le worker ne garde **aucun etat** : le cache vit cote client, ou il est visible
et mesurable. Un worker sans etat peut etre tue et relance sans rien perdre.

Le client ne connait qu'une interface `PageEngine`, ce qui permet de basculer
sur un calcul direct la ou `Worker` n'existe pas, d'injecter un faux moteur
dans les tests, et de changer de strategie plus tard sans toucher au client.
Decide le 2026-08-29.

### D19 — La cle de cache est un BigInt, jamais une chaine
`peek()` est appele a chaque image. Convertir le numero d'emplacement (14 861
bits) en base 36 pour s'en servir de cle coute **0,14 ms**, soit pres de 1 % du
budget d'une image, pour une simple recherche dans un cache. `Map` comparant les
BigInt par valeur, la cle brute fait le meme travail **300 fois plus vite**.

Regle generale a retenir : dans ce projet, toute conversion d'un grand entier
vers du texte est chere et n'a rien a faire sur un chemin chaud.
Mesure et decide le 2026-08-29.


### D20 — L'adresse vit dans le fragment de l'URL, pas dans le chemin
Deux raisons, et la seconde est la plus interessante.

1. Le site est deploye en statique. Un chemin profond comme `/7c4g…/1/2/24/368`
   obligerait l'hebergeur a reecrire toutes les routes vers `index.html`, sinon
   un simple rechargement renvoie une 404. Le fragment marche partout, sans la
   moindre configuration.
2. **Un fragment n'est jamais envoye au serveur.** L'hebergeur ne peut donc pas
   savoir quelle page est lue — non par politique de confidentialite, mais par
   construction du web. C'est le prolongement exact de l'exigence du projet :
   le serveur ne sert que des fichiers statiques, et il ne sait rien.

Sur la longueur (environ 2 890 caracteres) : ce n'est pas un defaut de
conception. Le numero de galerie PORTE le contenu de la page. Une URL courte
devrait pointer vers un stockage, et il n'y en a pas. La longueur de l'URL est
la preuve qu'on ne triche pas. Decide le 2026-08-29.

### D21 — Zustand repousse a la phase 4
L'architecture prevoit zustand pour tenir l'etat hors de React et eviter un
rendu par image. La phase 3 n'a pas de boucle de rendu : l'etat de React et
l'URL suffisent. On n'ajoute pas une dependance avant qu'elle ne gagne sa place.
Elle sera introduite avec la scene 3D, la ou le probleme existe reellement.
Decide le 2026-08-29.

### D22 — La taille de la page est calculee, pas choisie
Une page fait 80 caracteres sur 40 lignes : ces dimensions sont imposees par
Borges, pas par le design. La taille de police est donc **derivee** de la place
disponible dans les deux dimensions (80 caracteres monospace font environ 48em
de large, 40 lignes a 1,55 d'interligne font 62em de haut), et on garde la plus
contraignante des deux.

Piege rencontre et corrige : dans un `font-size`, un pourcentage se rapporte a
la police du parent, jamais a la largeur. Il faut des unites de fenetre.
Decide le 2026-08-29.


### D23 — Les deux murs libres sont OPPOSES
Borges dit que les etageres « couvrent tous les cotes sauf deux », sans preciser
lesquels. Nous prenons deux murs opposes plutot qu'adjacents : des ouvertures
opposees alignent les galeries et creusent une perspective qui file au loin,
alors que des ouvertures adjacentes donneraient un labyrinthe. Nous voulons un
abime, pas un dedale. Decide le 2026-08-29.

### D24 — Le placement 3D est ecrit en mathematiques pures
`scene/hexagon/layout3d.ts` et `parts.ts` ne dependent pas de three.js : ils
rendent des nombres, pas des objets de rendu. On verifie donc sans GPU que les
640 volumes sont plaques contre les bons murs, reposent sur leur planche, ne se
chevauchent pas et ne debordent pas — exactement le genre de defaut qu'on ne
voit pas a l'oeil parmi 640 objets. Meme discipline que pour `core/` (D8).
Decide le 2026-08-29.

### D25 — Tout se ramene a une boite unitaire mise a l'echelle
Murs, jambages, linteaux, parois de couloir, planches, montants et volumes
partagent une seule geometrie de boite, mise a l'echelle par instance. Resultat :
un appel de rendu par MATERIAU, quel que soit le nombre d'objets. La galerie
entiere, trois exemplaires compris, tient en 27 appels.
Decide le 2026-08-29.

### D26 — Une seule lampe projette des ombres
Une lumiere ponctuelle avec ombres coute six rendus de carte d'ombre (une par
face du cube). En accorder une a chaque galerie triplerait ce cout pour un gain
invisible a travers un couloir. Seule la galerie ou se trouve le visiteur
projette des ombres. Decide le 2026-08-29.

### D27 — Sonde de performance maison plutot que r3f-perf
`r3f-perf` refuse de cohabiter avec Fiber 9 (conflit de peer dependencies), et
nous n'avons besoin que de deux nombres : les appels de rendu et le cout d'une
image. Les lire dans `gl.info` coute zero dependance, et permet en prime
d'exposer un banc d'essai appelable depuis l'exterieur — indispensable pour
verifier automatiquement le critere de sortie depuis un navigateur pilote, ou
compter les images par seconde ne veut rien dire (voir la note d'exploitation
dans ROADMAP). Decide le 2026-08-29.


### D28 — Le regard s'oriente par les BORDS de l'ecran
La decision D13 demande trois choses qui se contredisent si l'on capture le
pointeur : un regard continu, un clic maintenu pour avancer, et un clic sur un
point d'interet. Sans curseur visible, on ne peut plus viser un livre.

Retenu : le curseur reste visible et sert de reticule. Il ne tourne la tete que
lorsqu'il approche des bords, avec une large zone morte au centre (45 % de
l'ecran) ou l'on ne fait que viser. Reponse quadratique au sortir de la zone
morte, pour eviter l'a-coup. Le regard reste continu, il n'y a jamais de
capture de pointeur, et le clic reste disponible pour designer.

Un appui de moins de 220 ms est un clic ; au-dela, c'est une marche. C'est ce
qui permet aux deux gestes de cohabiter sur le meme bouton.
Decide le 2026-08-30.

### D29 — Il n'y a pas de gestionnaire de morceaux, et c'est voulu
La roadmap prevoyait un « ChunkManager » et un reservoir d'objets a recycler.
En regardant le probleme, les deux se sont reveles inutiles.

Toutes les galeries sont geometriquement IDENTIQUES, et le visiteur est
toujours ramene au centre de la sienne par l'origine flottante. L'ensemble des
galeries visibles est donc toujours le meme : de -depth a +depth, aux memes
positions relatives. Les maillages instancies sont construits une fois au
montage et **ne changent plus jamais**, quelle que soit la distance parcourue.

Consequence : aucune allocation en cours de marche, donc aucune fuite possible
— non parce qu'on la previent, mais parce qu'il n'y a rien a allouer. Seules
les couleurs des tranches suivent le numero de galerie, pour qu'on sente qu'on
avance ; elles se recalculent au passage d'un couloir.

C'est l'infini parfaitement repetitif de Borges qui paye.
Decide le 2026-08-30.

### D30 — Origine flottante, obligatoire et non negociable
L'axe des couloirs EST l'enumeration des galeries : avancer d'une galerie,
c'est incrementer le numero d'hexagone. Or il y en a environ 10^4468. Aucun
systeme de coordonnees ne peut les couvrir — un float perd toute precision bien
avant.

Les positions sont donc toujours relatives a la galerie courante, et franchir
un couloir remet le compteur pres de zero en incrementant un BigInt. Teste sur
cent mille galeries parcourues : les coordonnees ne derivent jamais.
Decide le 2026-08-30.

### D31 — L'escalier est dans le couloir, pas au centre de la salle
La premiere roadmap parlait d'un « puits central + balustrade ». Relecture faite,
Borges ne decrit rien de tel : l'escalier en colimacon est dans le zaguan, le
couloir. Nous l'y mettons, plaque contre une paroi pour laisser le passage, et
le couloir passe de 1,20 m a 1,62 m de large pour l'accueillir.

Il est pour l'instant DECORATIF : la navigation verticale entre etages n'existe
pas encore. Il donne deja au couloir sa profondeur.
Decide le 2026-08-30.


### D32 — Un hachage sans structure lineaire
On est tente d'ecrire `(index * grandNombrePremier) >>> 0` pour deregler un
alignement. C'est une erreur, et elle SE VOIT : une multiplication est une
fonction affine de l'indice, donc l'ecart entre deux indices consecutifs est
constant. Les valeurs sont bien reparties prises isolement, mais elles defilent
avec une periode courte — et une rangee de cypres, ou de tranches de livres, se
met a montrer un motif qui se repete.

C'est le meme probleme que le LCG nu de `core/bijection.ts`, et la meme reponse :
une couche de decalages et de XOR. `scene/hash.ts` utilise le finalisateur
« lowbias32 ». Un test verifie explicitement l'absence de structure lineaire.
Trouve et corrige le 2026-08-30.

### D33 — Une boite instanciee peut s'incliner
`Box` n'avait qu'un lacet. Impossible dans ces conditions de plaquer un caisson
sur une coupole : il restait vertical et saillait comme un plot. On ajoute une
inclinaison optionnelle, appliquee apres le lacet (ordre YXZ). Le cout est nul
et cela ouvre tout ce qui doit epouser une surface courbe.
Decide le 2026-08-30.

### D34 — Le passage dehors -> dedans est une COUPE
On ne modelise pas le tunnel de l'entree, et on ne fait pas de fondu : on change
de plan. C'est du montage, et c'est ce que font les images de reference — une
succession de plans composes, pas un travelling continu. Cela evite aussi d'avoir
a percer une demi-sphere de 46 metres de rayon, ce qui n'apporterait rien a
l'image. Decide le 2026-08-30.


### D35 — Compter les appels de rendu avec un composeur d'effets
Avec un `EffectComposer`, `gl.info` est remis a zero A CHAQUE PASSE. Lu
naivement, le releve ne rapporte que la derniere passe — « 1 appel » — et lu
avec la remise a zero desactivee sans precaution, il cumule toutes les images
depuis le dernier affichage — « 2 691 appels ». Les deux sont faux.

La bonne facon : desactiver `info.autoReset`, lire le total a la fin de chaque
image, remettre a zero soi-meme, et ne PUBLIER le chiffre que quatre fois par
seconde. Le releve se place a une priorite superieure a celle du composeur pour
passer apres lui. Corrige le 2026-08-30.

### D36 — Le son est synthetise, jamais charge
Comme les livres, l'ambiance est calculee dans le navigateur : quatre
oscillateurs graves volontairement NON harmoniques les uns des autres, chacun
avec sa propre respiration lente, plus un bruit brun filtre. Des rapports
entiers donneraient un accord, donc de la musique ; on cherche la rumeur d'un
tres grand volume de pierre. Un test verifie explicitement l'absence
d'harmonique exact — il a d'ailleurs attrape une octave dans la premiere
version.

Aucun fichier audio a telecharger, et le son ne demarre qu'au geste d'entree,
comme l'exigent les navigateurs. Decide le 2026-08-30.

### D37 — La poussiere est animee dans le shader, pas sur le processeur
Les grains ne sont pas simules : leur trajectoire est calculee dans le vertex
shader a partir du temps. Il n'y a donc aucune ecriture de tampon par image, et
le cout cote processeur est exactement nul — un seul appel de rendu pour tout
le nuage. Meme discipline que pour le reste : ce qui peut etre une fonction du
temps ne doit pas devenir un etat. Decide le 2026-08-30.

### D38 — Le volumetrique est simule par un cone additif
Le rendu temps reel ne fait pas de volumetrique gratuitement. Un cone en
melange additif, dont l'opacite decroit vers le bas ET surtout vers les bords
(la ou l'on voit la surface de biais), suffit a lire comme un rai de lumiere.
Sans le terme de bord, le cone aurait une arete franche et paraitrait solide.
Quelques lignes de shader, aucune texture, un appel de rendu.
Decide le 2026-08-30.


### D39 — La recherche passe par le worker, comme le reste
Le protocole du worker porte desormais deux demandes, une par sens de la
bijection : `page` (adresse -> texte) et `locate` (texte -> adresse). La seconde
coute autant que la premiere, et doit donc respecter la meme regle : le thread
qui dessine ne calcule jamais. Le resultat n'est pas mis en cache — on ne
cherche pas deux fois la meme phrase. Decide le 2026-08-30.

### D40 — On transcrit au lieu de refuser
L'alphabet de Borges n'a que 22 lettres : ni j, ni k, ni w, ni x, et aucun
accent. Plutot que de rejeter ce que le visiteur tape, on le TRANSCRIT comme le
ferait un copiste latin — « Kafka » devient « cafca », « bibliothèque » devient
« bibliotheque » — et on lui dit ce qu'on a change.

Ce n'est pas une commodite technique, c'est le sujet de la nouvelle : la
bibliotheque contient tout ce qui peut s'ecrire avec ces 25 signes, et rien
d'autre. Tout ce qu'on veut y chercher doit d'abord y entrer.

Detail : les blancs consecutifs sont ramenes a un seul. Dans une page de Borges
ils seraient legitimes, mais dans une barre de recherche ce ne sont que des
fautes de frappe qui meneraient a une tout autre adresse.
Decide le 2026-08-30.

### D41 — La qualite se decide sur des indices, pas sur une mesure
Aucune API ne dit honnetement de quoi une machine est capable. On lit donc des
indices — pointeur grossier, memoire annoncee, nombre de coeurs, largeur
d'ecran — et on choisit PRUDEMMENT : mieux vaut un telephone qui affiche moins
et reste fluide qu'un telephone qui rame.

Une demande de sobriete (`prefers-reduced-motion`) l'emporte sur tout le reste,
y compris sur la machine la plus puissante : ce n'est pas une question de
puissance, c'est une question de respect. Elle fait aussi sauter la sequence
d'arrivee.

La decision est une fonction pure, donc testable sans appareil.
Decide le 2026-08-30.


### D42 — Le rayon est lance a la main, pas par le moteur de rendu
La designation d'un objet ne passe plus par les evenements de React Three
Fiber : on lance nous-memes un rayon depuis le centre exact de l'ecran. Trois
raisons, et la troisieme a fini par etre decisive :

  - le reticule EST le viseur (D28). On designe ce qu'on REGARDE, pas ce que
    survole un curseur qui peut etre ailleurs ;
  - la touche « E » et le clic bref deviennent litteralement le meme geste, au
    lieu de deux chemins de code differents ;
  - cela ne depend plus d'aucune plomberie d'evenements — et devient donc
    verifiable depuis l'exterieur. Le trou de verification ouvert depuis la
    phase 5, ou R3F ignorait les evenements synthetiques et ou le clic reel de
    Playwright expirait, s'est referme tout seul.

Corollaire : une portee (3,2 m). Sans elle, le rayon traverserait les portes et
l'on ouvrirait par megarde un volume de la galerie voisine.

Autre correction issue de l'essai : monter ou descendre un escalier se lit dans
la DIRECTION du regard, pas dans le point touche. Le fut de l'escalier monte
bien au-dessus des yeux ; en se fiant au point d'impact, on montait meme en
regardant ses pieds. Decide le 2026-08-30.

### D43 — Les etages : un seul entier lu dans deux dimensions
Le numero de galerie etait deja l'unique coordonnee du monde. Pour donner de la
hauteur a la bibliotheque, on n'ajoute PAS une seconde coordonnee : on lit le
meme entier autrement.

    galerie = etage x FOULEE + colonne

Monter, c'est ajouter une foulee ; avancer, c'est ajouter un. L'adresse d'un
livre ne change pas d'un iota, et rien de ce qui precede n'a eu besoin d'etre
touche — ni la bijection, ni l'origine flottante, ni les URL deja partagees.

FOULEE = 25^800 : le nombre de textes distincts de huit cents caracteres. Un
etage est donc long d'autant de galeries qu'il y a de facons de remplir huit
cents signes, soit environ 10^1118. Le choix reste arbitraire, mais il est tire
de l'alphabet plutot que du vide.

On atterrit toujours FACE a l'escalier apres un changement d'etage : sans cela
on se retrouve dos a ce qu'on vient d'emprunter, et l'on ne comprend plus ou
l'on est. Decide le 2026-08-30.

## Ouvertes (à trancher avec l'utilisateur)

_Aucune. Toutes les décisions de cadrage sont prises._
