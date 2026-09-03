# Décisions : Babbel (ADR)

Chaque décision structurante, avec sa raison. On n'annule pas une décision
sans écrire pourquoi.

## Prises

### D1 : Génération procédurale intégrale
25^1 312 000 livres : aucun stockage possible. Le contenu est une fonction pure
de l'adresse. Conséquence : pas de backend, déploiement statique, coût ~0.

### D2 : Bijection à l'échelle de la page, pas du livre
Un livre = 1 312 000 caractères ≈ 6,1 Mbits en BigInt : les opérations
modulaires deviennent lourdes. Une page = 3 200 caractères = 14 861 bits :
sous la milliseconde. C'est aussi ce que fait libraryofbabel.info, et ça
correspond exactement à la demande (génération au tournage de page).

### D3 : Calcul dans un Web Worker
Le thread qui dessine ne calcule jamais. Même si c'est rapide, le principe
protège le framerate pour toujours.

### D4 : BigInt natif, pas de GMP/WASM
JS a BigInt en natif ; à l'échelle page, aucune raison d'ajouter du WASM.
Réévaluer seulement si on passe à une bijection au niveau du livre.

### D5 : InstancedMesh systématique
Le facteur limitant en WebGL2 est le nombre de draw calls, pas les polygones.
640 livres par hexagone => 1 draw call.

### D6 : Streaming par chunks
On ne charge que l'hexagone courant et ses voisins visibles. L'infini est
suggéré par l'obscurité et le brouillard, jamais instancié.

### D7 : Une seule page de texte réel à la fois
Les livres lointains n'ont aucun texte généré, seulement une texture.
C'est ce qui rend l'ensemble tenable.

### D8 : `core/` sans dépendance
Le cœur mathématique est du TypeScript pur, testable sans navigateur.
Le rendu peut être entièrement réécrit sans y toucher.


### D9, Alphabet : 25 symboles, fidèle à Borges
22 lettres + espace + virgule + point. Choix de fidélité assumé contre la
lisibilité des fragments (l'option 29 caractères de libraryofbabel.info est
écartée). L'alphabet reste **paramétré** dans `core/alphabet.ts` : rien dans le
code ne doit supposer 25 en dur, pour pouvoir changer d'avis sans tout casser.
Décidé le 2026-08-29.

### D10 : Vite + React + TypeScript
Pas de SSR ni d'API à servir : l'expérience est entièrement cliente. HMR rapide,
ce qui est décisif quand on itère sur de la 3D. Build statique.
Décidé le 2026-08-29.

### D11, Deux mondes distincts : le Seuil et la Bibliothèque
Le projet contient **deux natures de scène**, à ne jamais confondre :

1. **Le Seuil**, scène *authorée à la main*, finie, composée : on arrive à
   l'extérieur, on voit le dôme (demi-sphère), on monte les marches, on franchit
   l'entrée unique, on débouche dans le grand hall où flotte le cube.
   C'est la séquence d'arrivée, le morceau de bravoure esthétique. Budget de
   rendu généreux (scène unique, chargée une fois, jamais dupliquée).
2. **La Bibliothèque** : infinie, *procédurale*, streamée par chunks,
   sous contrainte permanente de draw calls et de mémoire.

Conséquence : deux budgets de performance, deux méthodes de construction, deux
dossiers séparés dans `src/scene/`. Le Seuil peut se permettre ce que la
Bibliothèque ne peut pas. Décidé le 2026-08-29.

### D12 : Navigation à la première personne, sans ZQSD
La première personne est retenue (immersion), mais le clavier ZQSD est écarté :
inconfortable, et inadapté à un site web qu'on visite au trackpad ou au doigt.
Le schéma de contrôle exact reste à trancher (voir O3').
Décidé le 2026-08-29.


### D13, Schéma de contrôle : clic maintenu + points d'intérêt
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

### D14 : Bijection inversible dès le départ, recherche exposée plus tard
Le LCG est inversible **par construction** : rendre `core/bijection.ts`
réversible ne coûte rien de plus maintenant, alors que l'ajouter après
obligerait à tout reconcevoir. On implémente donc l'inverse et son test dès la
Phase 1, mais l'interface de recherche n'entre dans le périmètre qu'en Phase 7.
Décidé le 2026-08-29.

### D15 : Desktop cible v1, mobile en mode dégradé prévu dès le départ
La qualité visuelle se juge sur desktop. Mais les leviers de dégradation
(`dpr` plafonné, post-processing réduit, LOD agressif, distance de streaming
raccourcie) sont prévus dans l'architecture dès maintenant, pour ne pas avoir à
la retourner plus tard. Décidé le 2026-08-29.


### D16 : Direction artistique arrêtée, et éclairage baké au Seuil
DA établie à partir de 10 captures du film « Viens, je vais te
Montrer l'Infini »), documentée dans `docs/DIRECTION-ARTISTIQUE.md`.
Parti pris : **deux régimes de lumière**, le Seuil solaire et doré, la
Bibliothèque ténébreuse, qui recoupe exactement le découpage D11.

Décision technique qui en découle : **le Seuil, étant statique, aura son
éclairage précalculé en lightmaps** (baking hors ligne, chargé comme texture).
C'est ce qui rend atteignable en WebGL une qualité proche des rendus offline de
référence. La Bibliothèque, procédurale, ne peut pas être bakée : elle sera donc
sombre, avec très peu de sources dynamiques : ce qui est précisément le parti
pris artistique du film. La contrainte technique et l'intention esthétique
coïncident. Décidé le 2026-08-29.


### D17 : Cycle walking plutot qu'un LCG masque
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
moyenne, soit 58 % de calcul en trop, sans consequence, puisqu'un aller-retour
complet mesure 0,6 ms.

La permutation interne enchaine quatre tours de (decalage-XOR, multiplication
par une constante impaire dense), avec inversion des multiplications par
elevation de Hensel plutot qu'Euclide etendu (quatorze tours au lieu d'une
recursion). Decide et implemente le 2026-08-29.


### D18 : Un seul worker, sans etat, avec moteur injectable
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

### D19 : La cle de cache est un BigInt, jamais une chaine
`peek()` est appele a chaque image. Convertir le numero d'emplacement (14 861
bits) en base 36 pour s'en servir de cle coute **0,14 ms**, soit pres de 1 % du
budget d'une image, pour une simple recherche dans un cache. `Map` comparant les
BigInt par valeur, la cle brute fait le meme travail **300 fois plus vite**.

Regle generale a retenir : dans ce projet, toute conversion d'un grand entier
vers du texte est chere et n'a rien a faire sur un chemin chaud.
Mesure et decide le 2026-08-29.


### D20 : L'adresse vit dans le fragment de l'URL, pas dans le chemin
Deux raisons, et la seconde est la plus interessante.

1. Le site est deploye en statique. Un chemin profond comme `/7c4g…/1/2/24/368`
   obligerait l'hebergeur a reecrire toutes les routes vers `index.html`, sinon
   un simple rechargement renvoie une 404. Le fragment marche partout, sans la
   moindre configuration.
2. **Un fragment n'est jamais envoye au serveur.** L'hebergeur ne peut donc pas
   savoir quelle page est lue : non par politique de confidentialite, mais par
   construction du web. C'est le prolongement exact de l'exigence du projet :
   le serveur ne sert que des fichiers statiques, et il ne sait rien.

Sur la longueur (environ 2 890 caracteres) : ce n'est pas un defaut de
conception. Le numero de galerie PORTE le contenu de la page. Une URL courte
devrait pointer vers un stockage, et il n'y en a pas. La longueur de l'URL est
la preuve qu'on ne triche pas. Decide le 2026-08-29.

### D21 : Zustand repousse a la phase 4
L'architecture prevoit zustand pour tenir l'etat hors de React et eviter un
rendu par image. La phase 3 n'a pas de boucle de rendu : l'etat de React et
l'URL suffisent. On n'ajoute pas une dependance avant qu'elle ne gagne sa place.
Elle sera introduite avec la scene 3D, la ou le probleme existe reellement.
Decide le 2026-08-29.

### D22 : La taille de la page est calculee, pas choisie
Une page fait 80 caracteres sur 40 lignes : ces dimensions sont imposees par
Borges, pas par le design. La taille de police est donc **derivee** de la place
disponible dans les deux dimensions (80 caracteres monospace font environ 48em
de large, 40 lignes a 1,55 d'interligne font 62em de haut), et on garde la plus
contraignante des deux.

Piege rencontre et corrige : dans un `font-size`, un pourcentage se rapporte a
la police du parent, jamais a la largeur. Il faut des unites de fenetre.
Decide le 2026-08-29.


### D23 : Les deux murs libres sont OPPOSES
Borges dit que les etageres « couvrent tous les cotes sauf deux », sans preciser
lesquels. Nous prenons deux murs opposes plutot qu'adjacents : des ouvertures
opposees alignent les galeries et creusent une perspective qui file au loin,
alors que des ouvertures adjacentes donneraient un labyrinthe. Nous voulons un
abime, pas un dedale. Decide le 2026-08-29.

### D24 : Le placement 3D est ecrit en mathematiques pures
`scene/hexagon/layout3d.ts` et `parts.ts` ne dependent pas de three.js : ils
rendent des nombres, pas des objets de rendu. On verifie donc sans GPU que les
640 volumes sont plaques contre les bons murs, reposent sur leur planche, ne se
chevauchent pas et ne debordent pas : exactement le genre de defaut qu'on ne
voit pas a l'oeil parmi 640 objets. Meme discipline que pour `core/` (D8).
Decide le 2026-08-29.

### D25 : Tout se ramene a une boite unitaire mise a l'echelle
Murs, jambages, linteaux, parois de couloir, planches, montants et volumes
partagent une seule geometrie de boite, mise a l'echelle par instance. Resultat :
un appel de rendu par MATERIAU, quel que soit le nombre d'objets. La galerie
entiere, trois exemplaires compris, tient en 27 appels.
Decide le 2026-08-29.

### D26 : Une seule lampe projette des ombres
Une lumiere ponctuelle avec ombres coute six rendus de carte d'ombre (une par
face du cube). En accorder une a chaque galerie triplerait ce cout pour un gain
invisible a travers un couloir. Seule la galerie ou se trouve le visiteur
projette des ombres. Decide le 2026-08-29.

### D27 : Sonde de performance maison plutot que r3f-perf
`r3f-perf` refuse de cohabiter avec Fiber 9 (conflit de peer dependencies), et
nous n'avons besoin que de deux nombres : les appels de rendu et le cout d'une
image. Les lire dans `gl.info` coute zero dependance, et permet en prime
d'exposer un banc d'essai appelable depuis l'exterieur : indispensable pour
verifier automatiquement le critere de sortie depuis un navigateur pilote, ou
compter les images par seconde ne veut rien dire (voir la note d'exploitation
dans ROADMAP). Decide le 2026-08-29.


### D28 : Le regard s'oriente par les BORDS de l'ecran
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

### D29 : Il n'y a pas de gestionnaire de morceaux, et c'est voulu
La roadmap prevoyait un « ChunkManager » et un reservoir d'objets a recycler.
En regardant le probleme, les deux se sont reveles inutiles.

Toutes les galeries sont geometriquement IDENTIQUES, et le visiteur est
toujours ramene au centre de la sienne par l'origine flottante. L'ensemble des
galeries visibles est donc toujours le meme : de -depth a +depth, aux memes
positions relatives. Les maillages instancies sont construits une fois au
montage et **ne changent plus jamais**, quelle que soit la distance parcourue.

Consequence : aucune allocation en cours de marche, donc aucune fuite possible
- non parce qu'on la previent, mais parce qu'il n'y a rien a allouer. Seules
les couleurs des tranches suivent le numero de galerie, pour qu'on sente qu'on
avance ; elles se recalculent au passage d'un couloir.

C'est l'infini parfaitement repetitif de Borges qui paye.
Decide le 2026-08-30.

### D30 : Origine flottante, obligatoire et non negociable
L'axe des couloirs EST l'enumeration des galeries : avancer d'une galerie,
c'est incrementer le numero d'hexagone. Or il y en a environ 10^4468. Aucun
systeme de coordonnees ne peut les couvrir : un float perd toute precision bien
avant.

Les positions sont donc toujours relatives a la galerie courante, et franchir
un couloir remet le compteur pres de zero en incrementant un BigInt. Teste sur
cent mille galeries parcourues : les coordonnees ne derivent jamais.
Decide le 2026-08-30.

### D31 : L'escalier est dans le couloir, pas au centre de la salle
La premiere roadmap parlait d'un « puits central + balustrade ». Relecture faite,
Borges ne decrit rien de tel : l'escalier en colimacon est dans le zaguan, le
couloir. Nous l'y mettons, plaque contre une paroi pour laisser le passage, et
le couloir passe de 1,20 m a 1,62 m de large pour l'accueillir.

Il est pour l'instant DECORATIF : la navigation verticale entre etages n'existe
pas encore. Il donne deja au couloir sa profondeur.
Decide le 2026-08-30.


### D32 : Un hachage sans structure lineaire
On est tente d'ecrire `(index * grandNombrePremier) >>> 0` pour deregler un
alignement. C'est une erreur, et elle SE VOIT : une multiplication est une
fonction affine de l'indice, donc l'ecart entre deux indices consecutifs est
constant. Les valeurs sont bien reparties prises isolement, mais elles defilent
avec une periode courte, et une rangee de cypres, ou de tranches de livres, se
met a montrer un motif qui se repete.

C'est le meme probleme que le LCG nu de `core/bijection.ts`, et la meme reponse :
une couche de decalages et de XOR. `scene/hash.ts` utilise le finalisateur
« lowbias32 ». Un test verifie explicitement l'absence de structure lineaire.
Trouve et corrige le 2026-08-30.

### D33 : Une boite instanciee peut s'incliner
`Box` n'avait qu'un lacet. Impossible dans ces conditions de plaquer un caisson
sur une coupole : il restait vertical et saillait comme un plot. On ajoute une
inclinaison optionnelle, appliquee apres le lacet (ordre YXZ). Le cout est nul
et cela ouvre tout ce qui doit epouser une surface courbe.
Decide le 2026-08-30.

### D34 : Le passage dehors -> dedans est une COUPE
On ne modelise pas le tunnel de l'entree, et on ne fait pas de fondu : on change
de plan. C'est du montage, et c'est ce que font les images de reference : une
succession de plans composes, pas un travelling continu. Cela evite aussi d'avoir
a percer une demi-sphere de 46 metres de rayon, ce qui n'apporterait rien a
l'image. Decide le 2026-08-30.


### D35 : Compter les appels de rendu avec un composeur d'effets
Avec un `EffectComposer`, `gl.info` est remis a zero A CHAQUE PASSE. Lu
naivement, le releve ne rapporte que la derniere passe : « 1 appel », et lu
avec la remise a zero desactivee sans precaution, il cumule toutes les images
depuis le dernier affichage : « 2 691 appels ». Les deux sont faux.

La bonne facon : desactiver `info.autoReset`, lire le total a la fin de chaque
image, remettre a zero soi-meme, et ne PUBLIER le chiffre que quatre fois par
seconde. Le releve se place a une priorite superieure a celle du composeur pour
passer apres lui. Corrige le 2026-08-30.

### D36 : Le son est synthetise, jamais charge
Comme les livres, l'ambiance est calculee dans le navigateur : quatre
oscillateurs graves volontairement NON harmoniques les uns des autres, chacun
avec sa propre respiration lente, plus un bruit brun filtre. Des rapports
entiers donneraient un accord, donc de la musique ; on cherche la rumeur d'un
tres grand volume de pierre. Un test verifie explicitement l'absence
d'harmonique exact : il a d'ailleurs attrape une octave dans la premiere
version.

Aucun fichier audio a telecharger, et le son ne demarre qu'au geste d'entree,
comme l'exigent les navigateurs. Decide le 2026-08-30.

### D37 : La poussiere est animee dans le shader, pas sur le processeur
Les grains ne sont pas simules : leur trajectoire est calculee dans le vertex
shader a partir du temps. Il n'y a donc aucune ecriture de tampon par image, et
le cout cote processeur est exactement nul : un seul appel de rendu pour tout
le nuage. Meme discipline que pour le reste : ce qui peut etre une fonction du
temps ne doit pas devenir un etat. Decide le 2026-08-30.

### D38 : Le volumetrique est simule par un cone additif
Le rendu temps reel ne fait pas de volumetrique gratuitement. Un cone en
melange additif, dont l'opacite decroit vers le bas ET surtout vers les bords
(la ou l'on voit la surface de biais), suffit a lire comme un rai de lumiere.
Sans le terme de bord, le cone aurait une arete franche et paraitrait solide.
Quelques lignes de shader, aucune texture, un appel de rendu.
Decide le 2026-08-30.


### D39 : La recherche passe par le worker, comme le reste
Le protocole du worker porte desormais deux demandes, une par sens de la
bijection : `page` (adresse -> texte) et `locate` (texte -> adresse). La seconde
coute autant que la premiere, et doit donc respecter la meme regle : le thread
qui dessine ne calcule jamais. Le resultat n'est pas mis en cache : on ne
cherche pas deux fois la meme phrase. Decide le 2026-08-30.

### D40 : On transcrit au lieu de refuser
L'alphabet de Borges n'a que 22 lettres : ni j, ni k, ni w, ni x, et aucun
accent. Plutot que de rejeter ce que le visiteur tape, on le TRANSCRIT comme le
ferait un copiste latin : « Kafka » devient « cafca », « bibliothèque » devient
« bibliotheque », et on lui dit ce qu'on a change.

Ce n'est pas une commodite technique, c'est le sujet de la nouvelle : la
bibliotheque contient tout ce qui peut s'ecrire avec ces 25 signes, et rien
d'autre. Tout ce qu'on veut y chercher doit d'abord y entrer.

Detail : les blancs consecutifs sont ramenes a un seul. Dans une page de Borges
ils seraient legitimes, mais dans une barre de recherche ce ne sont que des
fautes de frappe qui meneraient a une tout autre adresse.
Decide le 2026-08-30.

### D41 : La qualite se decide sur des indices, pas sur une mesure
Aucune API ne dit honnetement de quoi une machine est capable. On lit donc des
indices : pointeur grossier, memoire annoncee, nombre de coeurs, largeur
d'ecran, et on choisit PRUDEMMENT : mieux vaut un telephone qui affiche moins
et reste fluide qu'un telephone qui rame.

Une demande de sobriete (`prefers-reduced-motion`) l'emporte sur tout le reste,
y compris sur la machine la plus puissante : ce n'est pas une question de
puissance, c'est une question de respect. Elle fait aussi sauter la sequence
d'arrivee.

La decision est une fonction pure, donc testable sans appareil.
Decide le 2026-08-30.


### D42 : Le rayon est lance a la main, pas par le moteur de rendu
La designation d'un objet ne passe plus par les evenements de React Three
Fiber : on lance nous-memes un rayon depuis le centre exact de l'ecran. Trois
raisons, et la troisieme a fini par etre decisive :

  - le reticule EST le viseur (D28). On designe ce qu'on REGARDE, pas ce que
    survole un curseur qui peut etre ailleurs ;
  - la touche « E » et le clic bref deviennent litteralement le meme geste, au
    lieu de deux chemins de code differents ;
  - cela ne depend plus d'aucune plomberie d'evenements, et devient donc
    verifiable depuis l'exterieur. Le trou de verification ouvert depuis la
    phase 5, ou R3F ignorait les evenements synthetiques et ou le clic reel de
    Playwright expirait, s'est referme tout seul.

Corollaire : une portee (3,2 m). Sans elle, le rayon traverserait les portes et
l'on ouvrirait par megarde un volume de la galerie voisine.

Autre correction issue de l'essai : monter ou descendre un escalier se lit dans
la DIRECTION du regard, pas dans le point touche. Le fut de l'escalier monte
bien au-dessus des yeux ; en se fiant au point d'impact, on montait meme en
regardant ses pieds. Decide le 2026-08-30.

### D43, Les etages : un seul entier lu dans deux dimensions
Le numero de galerie etait deja l'unique coordonnee du monde. Pour donner de la
hauteur a la bibliotheque, on n'ajoute PAS une seconde coordonnee : on lit le
meme entier autrement.

    galerie = etage x FOULEE + colonne

Monter, c'est ajouter une foulee ; avancer, c'est ajouter un. L'adresse d'un
livre ne change pas d'un iota, et rien de ce qui precede n'a eu besoin d'etre
touche, ni la bijection, ni l'origine flottante, ni les URL deja partagees.

FOULEE = 25^800 : le nombre de textes distincts de huit cents caracteres. Un
etage est donc long d'autant de galeries qu'il y a de facons de remplir huit
cents signes, soit environ 10^1118. Le choix reste arbitraire, mais il est tire
de l'alphabet plutot que du vide.

On atterrit toujours FACE a l'escalier apres un changement d'etage : sans cela
on se retrouve dos a ce qu'on vient d'emprunter, et l'on ne comprend plus ou
l'on est. Decide le 2026-08-30.


### D44 : Le zaguan, et non un escalier dans le couloir
Les cotes sont formelles : un escalier en colimacon ne tient pas dans un couloir
de 1,62 m sans le boucher, et le couloir ne peut pas s'elargir au-dela du mur
qu'il perce. Toutes les variantes essayees laissaient un passage de moins de
30 cm.

La bonne reponse etait dans la nouvelle : « dans le zaguan il y a un miroir...
une escalier spirale, qui s'abime et s'eleve vers le lointain ». On construit
donc un VESTIBULE carre entre deux galeries, plus large et plus haut que les
passages qui y menent, perce en son centre d'une tremie. On marche sur un
anneau autour du puits ; le passage n'est jamais bouche.

Consequence sur les collisions : un lieu de plus, avec sa regle propre, dans le
carre, hors du puits, plus les deux embrasures par lesquelles on y entre. Sans
ce dernier cas, la garde au mur fermait la porte de l'interieur.

Consequence sur le deplacement : `slide` a du apprendre a CONTOURNER. Ses deux
essais d'origine : avancee seule, ecart seul, suffisent le long d'un mur droit
mais pas contre un obstacle rond : en marchant droit sur la tremie, on restait
plante devant le vide. On tente desormais des directions deviees, de plus en
plus franches. Piege au passage : quand on marche pile dans l'axe, l'ecart
lateral vaut zero et le candidat « lateral seul » EST la position actuelle,
valide, donc on repondait « je ne bouge pas » sans avoir rien tente.
Decide le 2026-08-31.

### D45 : Le marbre est calcule, et son cout est reglable
Une image de marbre pese quelques mega-octets, se repete visiblement sur une
colonne de vingt metres, et trahit sa grille. Tout le reste du site est calcule :
le marbre n'a pas de raison de faire exception.

On ne remplace pas le materiau standard, on lui greffe quelques lignes qui
modifient sa seule couleur de base (`onBeforeCompile`). Eclairage, ombres,
brouillard et tone mapping continuent de fonctionner. Le motif est un bruit
fractal PLIE : `abs(bruit - 0.5)` eleve a une puissance, ce pliage etant ce qui
distingue une veine d'une tache.

Le nombre d'octaves et la deformation prealable sont des reglages du materiau,
fixes a la compilation du shader. Ce n'est pas un detail : applique avec les
reglages d'une surface de premier plan sur les immenses parois d'un couloir, ce
shader a fait passer la bibliotheque a 19,45 ms par image : au-dessus du budget.
Voir le constat A6 de l'audit. Decide le 2026-08-31.

### D46 : On ne prive personne des livres pour une carte graphique
Sans WebGL, la toile levait une exception au montage et emportait toute la page.
Or le lecteur n'a besoin d'aucune 3D. On teste donc la disponibilite AVANT de
monter quoi que ce soit, et l'application se replie sur la lecture seule.
Meme principe pour le worker : sa construction est protegee, avec repli sur le
calcul direct. Un site qui calcule tout dans le navigateur doit savoir se passer
de ce que le navigateur ne lui donne pas. Decide le 2026-08-31.


### D47 : La 3D est chargee en differe
three.js et sa chaine d'effets pesent 292 Ko gzippes, contre 69 Ko pour le coeur,
le worker et le lecteur reunis. Or le cas le plus probable de partage est une URL
de LECTURE : c'est ce que produit la recherche, et il serait absurde de faire
telecharger toute la machinerie a quelqu'un qui vient lire une page de texte.

La galerie passe donc par un import differe. Et pour que le benefice soit
reellement atteignable, l'ecran d'entree change de proposition quand l'URL porte
deja une adresse : « ouvrir la page » d'abord, « ou visiter la bibliotheque »
ensuite. Cette premiere voie ne telecharge jamais la 3D.
Decide le 2026-08-31.

### D48 : Les adresses se comparent par VALEUR, jamais par reference
`usePageText` comparait l'adresse d'un echec a l'adresse courante par identite
d'objet. Un parent qui reconstruit l'adresse a chaque rendu aurait vu les
erreurs disparaitre, et, plus grave, aurait relance l'effet en boucle, donc la
generation.

La comparaison se fait desormais sur le numero d'emplacement, qui identifie une
page sans ambiguite et dont deux BigInt egaux le sont pour `===`. Regle
generale : la correction d'un composant ne doit jamais dependre de la discipline
de son appelant. Trouve en ecrivant le test, le 2026-08-31.

### D49 : La sonde de mesure est opt-in
`__babbel`, `__babbelBench` et `__babbelStep` ne s'installent que sur demande
(`?sonde` dans l'URL, ou en developpement). On ne les supprime pas : ce sont
elles qui permettent de mesurer le BUILD DE PRODUCTION dans un navigateur ou
compter les images par seconde ne veut rien dire. Mais elles n'ont rien a faire
sur la page de tout le monde. Decide le 2026-08-31.

### D50 : Un piege a focus ne se fie pas a la mise en page
La premiere version filtrait les elements focalisables sur leur visibilite
CALCULEE (`offsetParent`). Cela depend du moteur de rendu, ne veut rien dire
hors d'un navigateur, et se serait casse au premier changement de mise en page.
Le selecteur ecarte deja ce qui est desactive, et une modale ne contient que ses
propres commandes : c'est suffisant, et c'est verifiable.
Trouve en ecrivant le test, le 2026-08-31.

### D51 : Le film s'arrete DEVANT l'entree
La sequence d'arrivee traversait le portail, franchissait les murs et deposait
le visiteur au milieu du hall. C'est ce qui donnait l'impression d'une
cinematique dans laquelle on passe a travers les objets, et c'est exactement ce
qu'un lieu ne doit pas faire.

Elle s'arrete desormais a quelques pas du seuil, a hauteur d'homme, face au
portail, et rend la main. Le visiteur marche sur le parvis et franchit l'entree
lui-meme. Un test verifie que la camera ne passe JAMAIS derriere le plan du
portail. Decide le 2026-08-31.

### D52 : Le hall d'accueil est une nef, et l'on y marche
La rotonde ne servait que de decor a un plan de cinema. Le lieu devient une nef
parcourue : une allee centrale bordee de deux files de piliers, deux bas-cotes,
deux escaliers lateraux qui montent aux tribunes, et le cube d'or au bout de
l'axe. S'approcher du cube fait entrer dans la bibliotheque.

Consequence technique : le marcheur ne connait plus un seul lieu. `usePlayer`
recoit desormais un MONDE (collisions, sols, origine flottante), et la
bibliotheque n'est que l'un d'eux. Decide le 2026-08-31.

### D53 : Deux sols au-dessus d'un meme point, et un pas maximal
Le bas-cote passe SOUS la tribune : au-dessus d'un meme point du plan, il y a
deux planchers, et une fonction `hauteur(x, z)` ne peut pas repondre. On rend
donc la LISTE des sols, et le marcheur choisit celui qui est a portee de son
pas.

Cette seule regle fait tout le travail : elle laisse monter une marche, elle
interdit de franchir la balustrade d'une tribune pour tomber dans la nef, et
elle n'a besoin d'aucun etat supplementaire. Decide le 2026-08-31.

### D54 : La pierre est calculee, comme le reste
Le monument etait un aplat de calcaire : sans assises, un dome de quarante-six
metres n'a aucune echelle, il pourrait aussi bien en faire trois. Un shader
greffe sur le materiau standard ajoute les trois choses qui font une facade :
les lits horizontaux entre blocs, la variation de bloc a bloc, et la patine
(dessus poussiereux, pieds de mur salis).

Meme raison qu'au D-marbre : une image de pierre pese des mega-octets, se
repete visiblement, et trahit sa grille. Decide le 2026-08-31.

### D55 : Une silhouette se corrige dans le vertex, pas dans la couleur
Les montagnes de l'horizon se lisaient comme des pyramides. Aucun reglage de
couleur n'y pouvait rien : le defaut etait dans la SILHOUETTE. Quelques lignes
greffees sur le vertex shader repoussent chaque sommet le long de sa normale
selon un bruit fractal, ce qui donne des aretes, des epaules et des ravines
pour quelques instructions par sommet, et rien du tout par pixel.
Decide le 2026-08-31.

### D56 : Le ciel a un soleil, des nuages et du bruit
Un degrade vertical seul EST un fond lineaire : l'oeil suit la rampe et n'a
rien d'autre a regarder. Le ciel recoit donc un disque solaire et son halo (qui
expliquent la lumiere rasante du reste de la scene), des cirrus etires, une
brume d'horizon plus haute du cote du soleil, et un demi-niveau de bruit de
tramage. Ce dernier point n'est pas cosmetique : un degrade code sur huit bits
par canal montre des bandes, et ces bandes sont precisement ce qu'on voit quand
on trouve un ciel « trop lineaire ». Decide le 2026-08-31.

### D57 : Le lecteur est un livre, pas une interface
Lire ne fait plus apparaitre un panneau par-dessus la scene. Le volume quitte
son etagere, vient flotter devant le lecteur, s'ouvre, et se laisse tourner :
c'est un objet du monde, eclaire par la lampe de la galerie comme le reste.
Cliquer du cote droit avance, du cote gauche revient.

Le tournage n'utilise pas les evenements du moteur de rendu mais le meme geste
maison que le reste du site (ecouter le relachement du pointeur et regarder de
quel cote il tombe) : trois lignes, aucune plomberie, et cela reste verifiable
depuis l'exterieur. Decide le 2026-08-31.

### D58, Plus aucun tableau de bord
Le releve de performance, les indications de touches, la barre d'adresse et le
reticule ont disparu de l'ecran. Il ne reste, et seulement quand un volume est
ouvert, qu'une croix pour le refermer. On ne met pas de barre d'outils dans une
bibliotheque. La mesure, elle, n'est pas perdue : elle vit dans la sonde (D49).
Decide le 2026-08-31.

### D59 : Un objet accroche a la camera n'est pas rendu
three ne dessine que ce qui pend de la SCENE. La camera, elle, n'y est pas : un
objet accroche a une camera hors scene n'est jamais rendu, et aucune erreur ne
le signale. Le livre etait donc ouvert dans l'etat, la croix s'affichait, l'URL
changeait, et l'on ne voyait rien.

On rattache la camera a la scene le temps de la lecture. Elle n'a aucune
apparence : cela ne change rien a l'image, seulement au parcours du graphe.
Trouve dans le navigateur, le 2026-08-31.

## Ouvertes (à trancher avec l'utilisateur)

- **La licence.** MIT a été posée par défaut, comme choix le plus permissif.
  C'est une décision à confirmer : elle autorise n'importe qui à reprendre,
  modifier et vendre ce travail.


### D60 : Le rendu passe en aplats
Le rendu physique demandait des matieres, et une matiere credible demande des
textures : veines de calcaire, grain de pierre, marbre du sol. Chacune coutait
un shader de plus et aucune ne se voyait vraiment. Mesure a l'appui, la
variation locale des surfaces plafonnait a la moitie de celle de
l'illustration de reference alors que la luminance moyenne etait identique :
on payait de la matiere que personne ne percevait.

On change de terrain. La lumiere est desormais projetee sur trois paliers, et
c'est le saut d'un palier a l'autre qui donne le relief. L'echelle de valeurs
est CALCULEE, comme tout le reste du site, et lue au plus proche voisin : sans
ce filtrage, le navigateur interpole et l'on retombe sur un degrade continu.

Les consequences depassent l'esthetique. Rugosite et metal n'ont plus de sens
et disparaissent des appels. Les veines de marbre et de calcaire sont retirees
partout. Et le compte d'appels de rendu de la galerie tombe de 39 a 12,
contours compris.

Le trait de contour est dessine en agrandissant la face arriere : un appel de
plus pour tout un paquet instancie, quel qu'en soit le nombre. Sans lui, deux
aplats de meme valeur se confondent et la piece perd ses aretes.
Decide le 2026-09-02.


### D61 : Le miroir du zaguan
« Dans le zaguan il y a un miroir, qui duplique fidelement les apparences. »
La phrase etait citee dans les dimensions du vestibule depuis la phase 8, et
le miroir n'avait jamais ete construit. Il n'est pas decoratif : c'est de lui
que le narrateur tire son doute, « les hommes en deduisent que la Bibliotheque
n'est pas infinie ; s'ils la deduisaient du miroir, ils auraient raison ».

En rendu a aplats, on ne cherche pas un reflet calcule : un miroir de dessin
est une plaque froide dans une piece chaude, et c'est ce contraste de
temperature qui le fait lire comme du verre. Il est pose sur un cote du
vestibule, hors de l'axe de passage.

Restent absents du texte : les deux cabinets minuscules, l'un pour dormir
debout, l'autre pour les besoins. Ils demandent de creuser deux niches dans
les parois du vestibule, donc de reprendre les collisions du lieu : c'est un
chantier a part, et il est ecrit ici pour ne pas etre oublie.
Decide le 2026-09-02.


### D62 : Le site quitte la trois dimensions
Trois jours de travail sur le rendu 3D ont produit une galerie que la premiere
illustration dessinee a depassee en une heure. Le constat n'est pas un avis :
les mesures photometriques donnaient a l'illustration deux fois la variation
locale du rendu pour une luminance identique, et il a fallu corriger trois
defauts de mesure avant de seulement pouvoir comparer.

S'y ajoutent des couts qui n'avaient rien d'esthetique : le moteur pesait 1,1
Mo sur 1,3, soit 84 % de ce que telechargeait un visiteur ; le deplacement
devenait penible des que la cadence tombait ; et le banc d'essai du projet
mesurait le temps de SOUMISSION d'une image et non son affichage, ce qui a
longtemps fait croire le site rapide.

Le dessin coute moins cher que la modelisation et rend mieux. On garde donc ce
qui fait le projet, et qui n'a jamais dependu de la 3D : la bijection, le
worker, le lecteur, la recherche, l'adressage dans le fragment d'URL. On perd
8 100 lignes et cinq dependances.

Ce qui ne change pas : le placement reste un probleme de geometrie pure, dans
un module pur et teste. Les 640 volumes d'une galerie sont calcules et portent
chacun leur adresse, comme ils le faisaient en instances.
Decide le 2026-09-03.


### D63 : La hauteur de la galerie, corrigee d'apres le texte
« Vingt etageres, cinq longues etageres par cote, couvrent tous les cotes sauf
deux ; LEUR HAUTEUR, QUI EST CELLE DES ETAGES, depasse a peine celle d'un
bibliothecaire normal. »

La hauteur des etageres est celle de l'etage. La salle fait donc environ deux
metres, pas trois, les cinq etageres montent jusqu'au plafond, et il n'y a
aucun mur nu au-dessus d'elles. Le grand pan vide qu'on cherchait a meubler ne
devait pas exister.
Decide le 2026-09-03.


### D64 : Le puits d'aeration existe
D31 avait ecarte l'idee d'un puits central en concluant que « Borges ne decrit
rien de tel ». La toute premiere phrase de la nouvelle dit le contraire : « des
galeries hexagonales, avec de vastes puits d'aeration AU MILIEU, entoures de
balustrades tres basses. De n'importe quel hexagone on voit les etages
inferieurs et superieurs : interminablement. »

L'escalier en colimacon, lui, est bien dans le zaguan : les deux coexistent.
Le puits est desormais au centre de chaque galerie, ceint de sa balustrade
tres basse, et c'est par lui qu'on descend d'un etage.
Decide le 2026-09-03.


### D65 : Plus de page d'accueil, et l'on entre par la porte
Le site s'ouvrait sur un ecran de titre, avec un bouton « entrer », puis un
second ecran avec un bouton « franchir le seuil ». Deux ecrans et deux boutons
avant de voir quoi que ce soit.

La bibliotheque est desormais la des la premiere image, et le texte s'ecrit
par-dessus elle en quatre phrases. On entre en cliquant la porte : le lieu ne
doit pas ressembler a une application. Le minutage vit dans un module pur et
teste (`ui/intro.ts`) parce que c'est la seule partie qui puisse se tromper, et
un test interdit a l'introduction de depasser douze secondes.

L'ecran d'accueil avait pourtant une raison technique : aucun navigateur
n'autorise le son avant un geste du visiteur. On ecoute donc le premier geste,
quel qu'il soit, ce qui revient au meme sans rien couter a l'oeil. Et un lien
partage n'a plus aucun ecran a franchir : il ouvre sa page directement, ce qui
est son sujet.
Decide le 2026-09-03.


### D66 : Un decor ne recoit jamais de clic
Un bogue a rendu la regle evidente. Le halo de la lampe, un simple disque
degrade, etait dessine APRES la porte du fond : il en couvrait
quatre-vingt-treize pour cent et avalait le clic sans que rien ne le montre. Il
fallait viser le liseré du bas. La meme cause rendait inertes les volumes les
plus lointains, et une zone invisible « monter d'un etage », posee par-dessus le
haut de la porte, faisait changer d'etage quand on croyait passer.

Deux mesures, et la premiere seule ne suffit pas :
1. tout le dessin est prive d'evenements dans la feuille de style, et seules
   les tranches et les cibles les recoivent. L'extinction passe par `:where()`,
   qui ne pese rien dans le calcul de specificite : sans lui elle l'emportait
   sur le rallumage, ce qui s'est produit a la premiere tentative ;
2. tout ce qui se clique vit dans une couche unique, dessinee en dernier. On ne
   compte plus sur l'ordre du dessin pour qu'une salle reste cliquable.

Chaque cible epouse exactement la forme dessinee et s'allume au survol : le
visiteur voit ce qu'il vise. Mesure apres correction : la porte du dehors
repond sur cinq points d'essai sur cinq, la porte du fond sur six sur six, y
compris le sommet de l'arc et les bords.
Decide le 2026-09-03.


### D67 : Le puits traverse aussi le plafond
Il n'y avait aucun moyen visible de monter d'un etage : la cible etait un
rectangle transparent pose sur la porte. Or le texte donne la solution.
« De n'importe quel hexagone on voit les etages inferieurs ET superieurs :
interminablement. » Le puits perce donc les deux faces.

L'ouverture du haut est enorme parce qu'elle est proche : le plafond est a
hauteur d'homme. On y voit la lampe de la galerie du dessus, minuscule, et une
autre au fond du puits, en dessous. Ce sont ces deux points de lumiere qui
disent « interminablement », et ils font d'un trou une invitation.

Detail de dessin qui a demande deux essais : la trouee est percee APRES le halo
de notre propre lampe. Dessinee avant, la lumiere la remplissait et l'on y
voyait une coupole.
Decide le 2026-09-03.


### D68 : Le livre se suffit
La lecture avait une barre d'outils : six couples etiquette-valeur alignes en
haut de l'ecran, un bouton « copier l'adresse », une croix pour fermer, et une
page de texte posee sur du noir. C'etait un panneau de controle devant un
livre.

Le volume est desormais dessine ouvert, deux pages face a face, et il porte
lui-meme ce que la barre affichait, la ou un livre le porte :
- l'adresse est le **titre courant** du verso, et la toucher copie le lien ;
- les numeros sont aux **angles exterieurs**, comme des folios ;
- le nombre de pages est le titre courant du recto ;
- on tourne **en cliquant la page**, a droite pour avancer, et le coin se
  souleve au survol pour le dire ;
- on referme en cliquant a cote du livre, ou avec echap.

La galerie reste montee derriere, dans le noir : on n'a pas quitte la piece,
on y a pris un livre. Refermer ne recharge donc rien.

Une seule mesure gouverne tout l'objet, le corps du texte : quatre-vingts
caracteres font 48em, quarante lignes 52em, et le reste est exprime dans cette
unite. Le livre se pose ainsi dans n'importe quelle fenetre sans jamais
deborder. Sous 860 pixels il n'ouvre plus qu'un feuillet et tourne une page a
la fois, parce que deux pages de quatre-vingts colonnes cote a cote n'y
tiennent pas.

Consequence sur la navigation : l'unite de deplacement n'est plus la page mais
le **feuillet**, deux pages a la fois. Une page paire, celle qu'a pu designer
un lien partage ou une recherche, se lit sur le feuillet ouvert a la page
precedente. `stepPage` reste la primitive, parce que les liens, eux, designent
bien une page.

Le meme piege de mise en page a ete retrouve : une colonne de grille en `auto`
se dimensionne sur son contenu, et le `max-width: 100%` de l'objet ne mord
alors sur rien. C'est `minmax(0, 1fr)` qui le corrige, exactement comme dans le
lecteur precedent.
Decide le 2026-09-03.


### D69 : La balustrade etait hors de la piece
Le defaut se voyait sans se nommer : la porte du fond paraissait posee sur la
rambarde. La cause n'etait pas dans la porte. La balustrade montait a 358 dans
un cadre ou la ligne de sol du mur du fond est a 391 : elle depassait donc de
trente-trois pixels le pied du mur le plus lointain, ce qui est impossible pour
un garde-corps pose sur un trou creuse dans le plancher. Elle mordait sur le
bas de la porte et l'amputait.

La geometrie du puits vit desormais dans `perspective.ts`, en fractions du sol
visible et non en coordonnees, avec un test qui interdit a la trouee comme a sa
balustrade de sortir de la piece. La verification a l'ecran donne cinquante-
quatre pixels d'ecart entre le bas de la porte et le haut de la rambarde.

Le dessin de la balustrade suit la meme correction. Ce n'etait qu'une ellipse
tracee et quinze rectangles de largeur constante ; c'est maintenant une main
courante coupee en deux arcs, celui du fond passant DERRIERE les montants et
celui de devant par-dessus, et trente-quatre montants verticaux dont l'epaisseur
et la teinte suivent la distance. Un montant reste vertical en perspective a un
point : les deux ellipses partagent donc le meme rayon horizontal, et c'est ce
qui rend le calcul aussi court.
Decide le 2026-09-03.


### D70 : Le Seuil se peuple
Le dehors etait juste : monument, marches, cypres, bassin. Il etait aussi vide,
et c'est un defaut different d'une erreur. Un ciel qui occupe le tiers haut de
l'image sans rien y mettre ne dit pas l'espace, il dit l'inachevement.

Cinq ajouts, tous serieux, aucun decoratif :
- des **cirrus** tres etires et tres pales, qui chauffent en descendant vers le
  soleil, et une **volee d'oiseaux** minuscule : c'est elle qui donne sa taille
  au ciel ;
- un **mur d'enceinte** a refends qui prolonge le monument jusqu'au bord du
  cadre. Pose bas, il disparaissait entierement derriere les cypres ; il monte
  donc plus haut que leur pied, et les verticales sombres des arbres se
  detachent sur une surface claire, ce qui vaut mieux que les deux a plat sur
  le ciel ;
- deux **vasques** au pied des marches, seules taches chaudes du dehors : elles
  annoncent la lumiere qu'on trouvera dedans, et reprennent le bol de la
  direction artistique ;
- un **dallage en cercles** sur le parvis, qui etait un aplat sans rien pour
  mesurer la distance ;
- **trois silhouettes** a trois distances au lieu d'une, chacune avec son ombre
  au sol. Le defaut avait deja ete releve pour les arbres : sans ombre, tout
  flotte.
Decide le 2026-09-03.


### D71 : L'escalier ne menait nulle part
Il s'arretait a 424, c'est-a-dire contre la face du stylobate : on montait sept
marches pour se cogner a un mur de seize pixels sur toute la largeur, et le
parvis ne menait donc a rien. Il monte maintenant jusqu'au niveau ou posent les
colonnes, en tranchant la face du podium, ce que fait tout escalier monumental.

Chaque marche est en deux temps, la contremarche dans l'ombre et le nez qui
prend le jour. Sans cela, sept rectangles empiles font des rayures et pas des
marches : c'est l'ecart de valeur entre deux surfaces qui dit qu'il y a une
arete, jamais le trait qui les separe.
Decide le 2026-09-03.


### D72 : Ce qui bouge, et ce qui ne bouge pas
Les scenes etaient justes et mortes. Le mouvement ajoute est partout le meme :
une propriete `transform` ou `opacity` animee par la feuille de style, donc par
le compositeur. Aucune image n'est calculee, aucun JavaScript ne tourne, et le
cout est nul : le site reste un dessin.

Dehors : les cirrus derivent sur deux couches a deux vitesses (c'est l'ecart
entre elles qui donne la profondeur du ciel, pas la vitesse) ; une volee
d'oiseaux tourne et bat des ailes ; les cypres ploient au vent ; les vasques
scintillent ; l'eau du bassin glisse ; le soleil respire ; la porte appelle par
un halo qui s'ouvre et s'efface.

Dedans : la lampe respire, son globe vacille, les deux lampes des galeries
voisines vacillent hors de phase (c'est ce qui les eloigne), et la poussiere
monte dans la lumiere. C'est la seule chose qui bouge dans une salle ou il ne
se passe rien, et c'est ce qui la rend habitee.

Trois regles apprises en le faisant :
1. **Une boucle doit se refermer sur elle-meme.** Les nuages sont dessines deux
   fois, la seconde decalee d'une largeur de cadre, et l'ensemble glisse
   d'exactement cette largeur : on ne voit jamais le retour au depart.
2. **Rien ne doit tomber en cadence.** Les periodes sont premieres entre elles
   et plusieurs sont tirees du hachage (D32), sinon le mouvement se lit comme
   un mecanisme. La flamme des vasques est deux animations de periodes
   incommensurables, ce qui suffit a faire une flamme.
3. **Un grain de poussiere n'est visible que dans la lumiere.** Son eclat suit
   sa distance a la lampe : sans cela on voit des points brillants au fond du
   noir, ce qui n'est pas de la poussiere mais une erreur.

Et un piege de feuille de style, retrouve a la verification : le bloc
`prefers-reduced-motion` etait ecrit AVANT les animations qu'il devait
eteindre. A specificite egale, c'est la derniere regle qui gagne : il ne les
eteignait donc plus. Sa place est en fin de fichier, et nulle part ailleurs.
Decide le 2026-09-03.


### D73 : L'URL ne se remplit qu'au premier geste
Au chargement, le site ecrivait aussitot `#/0/0/0/0/1` dans la barre d'adresse.
C'etait un reste du temps ou le lecteur ETAIT tout le site : ecrire l'adresse
des l'ouverture avait alors un sens, puisqu'on arrivait sur une page. Depuis
qu'on arrive devant le monument, cela affichait l'adresse d'un livre qu'on
n'avait pas ouvert, et le lien qu'on copiait ne designait rien de ce qu'on
venait de voir.

L'URL ne s'ecrit donc plus qu'au premier geste qui la justifie : ouvrir un
volume, changer de galerie, changer d'etage, trouver une phrase. Un test le
tient, parce que c'est exactement le genre de detail qu'on rajoute sans y
penser en voulant « rendre l'adresse toujours copiable ».
Decide le 2026-09-03.


### D74 : Le mouvement reduit arrete ce qui se deplace, pas ce qui luit
Le site etait entierement immobile sur l'ordinateur de bureau de l'utilisateur,
et c'etait notre faute : Windows propose d'eteindre les effets d'animation, ce
reglage se lit dans `prefers-reduced-motion`, et nous coupions absolument tout.

Le reglage est frequent sur une machine de bureau, ou il ne signale aucun
trouble mais un gout pour les interfaces sobres. Et ce qui gene, dans le
mouvement, c'est le DEPLACEMENT : ce qui glisse, tourne, grandit ou defile. Une
variation d'opacite ne deplace rien.

On arrete donc les nuages, les oiseaux, les arbres, la poussiere et le halo qui
s'ouvre devant la porte, et l'on garde la lumiere qui respire : la lampe, son
globe, les lampes des galeries voisines, les vasques, le reflet de l'eau et la
porte. Les animations concernees ont chacune une variante en opacite seule.
Decide le 2026-09-03.


### D75 : Une porte n'est pas un trou
Elle avait l'air posee sur le dessin, et c'etait exact : c'etait un rectangle
noir surmonte d'un demi-cercle, sans encadrement, sans epaisseur de mur, sans
seuil, pose sur une bande d'ombre plate. Trois choses lui manquaient, et la
troisieme est la plus importante.

1. **Un encadrement.** Chambranle en pierre claire, joints de claveaux qui
   disent que l'arc est appareille, et une clef qui saille : c'est elle qui
   centre le monument.
2. **Un seuil.** Une dalle plus claire, un peu plus large que le chambranle, ou
   l'escalier arrive.
3. **Une epaisseur.** L'embrasement montre le mur en coupe, joue eclairee d'un
   cote et noire de l'autre. C'est lui qui fait le plus de travail : sans lui,
   une porte reste une decoupe, quelle que soit la richesse du cadre.

Le mur qui la porte a change aussi. Une ombre ne doit pas etre un aplat, sinon
elle n'a pas de matiere et tout ce qu'on y pose a l'air colle dessus : la cella
a donc ses assises, sa plinthe, son lit d'ombre sous l'entablement et ses antes
aux extremites.

Et le portail TIENT DANS LE MUR. L'ancien montait a 250 quand le mur commence a
292 : son arc passait donc par-dessus l'entablement, ce qui suffisait a lui
seul a le detacher du batiment. Toutes ses parties, cible du clic comprise,
decoulent maintenant de six nombres declares une fois.
Decide le 2026-09-03.


### D76 : La colonnade n'etait pas dans l'axe
Trouve en verifiant le portail, et invisible autrement : les colonnes etaient
ecrites de 204 a 780, donc centrees sur 492, quand la coupole, l'entablement,
le stylobate et l'entree sont centres sur 480. Douze pixels. Aucun element ne
paraissait faux isolement, mais rien ne repondait a rien, et l'entree ne
tombait pas au milieu de son entrecolonnement.

Les colonnes se calculent maintenant a partir de l'axe, cinq de chaque cote au
meme pas, symetriques par construction, avec un entrecolonnement central plus
large que les autres : c'est la regle pour une entree monumentale, et cela
laisse au portail vingt-trois pixels de mur de chaque cote. Le meme dessin sert
dehors et dans le reflet du bassin, ce qui interdit aux deux de diverger.

Verifie a l'ecran : colonnade, portail, coupole et milieu du cadre tombent tous
sur la meme abscisse.

Ajoute au passage ce qui manquait a la silhouette : la coupole repose sur un
socle a deux ressauts au lieu de pousser hors du toit, et la corniche prend une
ombre sous son larmier.
Decide le 2026-09-03.


### D77 : Rien ne pose au-dessus de l'horizon
Deux defauts signales par l'utilisateur, une seule cause.

La « bande grise » qui courait sous le batiment etait le muret d'enceinte : un
rectangle plat, de 378 a 426, pose au ras de la ligne d'horizon qui etait a
430. Le socle du monument avait le meme probleme, sa base tombant a 424. Or ce
qui est au-dessus de l'horizon est au-dela de l'infini : rien ne peut y poser.
Les deux flottaient donc, et aucune retouche de couleur n'y aurait rien change.

Le monument se tient desormais sur une TERRASSE surelevee dont on ne voit,
frontalement, que la face. Cette face court d'un bord a l'autre du cadre : elle
cache l'horizon, elle le devient, et il n'y a plus rien a empiler derriere.
L'escalier la traverse, les montagnes butent dessus, et les cypres se tiennent
devant, sur le parvis, les plus proches encadrant l'image de deux verticales
sombres au lieu de la border.

Les « rectangles pour faire de la profondeur » etaient les retours lateraux,
deux parallelogrammes, l'un clair a gauche et l'autre sombre a droite. Ils
etaient faux deux fois : une elevation strictement frontale ne montre aucune
face laterale, et donner du jour a l'une et de l'ombre a l'autre supposait un
point de vue de biais que tout le reste du dessin contredit. Ils sont
supprimes. La masse se lit par les RESSAUTS, corniche qui saille, mur en
retrait, podium qui ressort : c'est ainsi qu'une elevation dit son epaisseur,
et la corniche a maintenant une sous-face sur toute sa longueur.

Les cretes se brisent enfin en deux ressauts par versant : quatre triangles
nets se lisaient comme des pyramides posees sur le ciel, pas comme du relief.
Decide le 2026-09-03.
