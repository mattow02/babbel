# Recherche — La Bibliothèque de Babel

> Document de référence factuel. Tout ce qui est décidé ici a une source.
> Dernière mise à jour : 2026-08-29

## 1. La nouvelle de Borges (1941)

« La Biblioteca de Babel », Jorge Luis Borges, recueil *Ficciones*.
L'univers est une bibliothèque infinie composée de galeries hexagonales identiques.

### Spécifications canoniques (texte de Borges)

| Élément | Valeur |
|---|---|
| Forme de la salle | hexagone régulier |
| Murs occupés par des livres | 4 sur 6 (2 murs = passages) |
| Étagères par mur | 5 |
| Livres par étagère | 32 |
| **Livres par hexagone** | **4 × 5 × 32 = 640** |
| Pages par livre | 410 |
| Lignes par page | 40 |
| Caractères par ligne | 80 |
| **Caractères par livre** | **410 × 40 × 80 = 1 312 000** |
| Alphabet | 25 symboles : 22 lettres + espace + virgule + point |

Les 2 murs libres : un couloir menant à une galerie identique, avec un
escalier en colimaçon (haut/bas), un cabinet pour dormir debout, un cabinet
pour les besoins. Une lampe sphérique éclaire chaque hexagone. Une balustrade
donne sur le puits central (les étages supérieurs et inférieurs visibles).

### Conséquence mathématique
Nombre total de livres = **25^1 312 000** ≈ 10^1 834 097.
À comparer : ~10^80 atomes dans l'univers observable.
=> **Aucun stockage n'est possible. La génération procédurale est la seule voie.**

## 2. libraryofbabel.info (Jonathan Basile, 2015)

Implémentation web de référence. Deux différences avec Borges :
- alphabet de **29 caractères** (26 lettres a–z + espace + virgule + point),
  choix pragmatique pour rendre l'anglais lisible ;
- l'unité adressable est **la page**, pas le livre.

### Le principe technique (le point clé à comprendre)

Le site ne stocke rien. Il utilise une **fonction pseudo-aléatoire inversible**
(bijection) entre :

```
adresse (hexagone, mur, étagère, volume, page)  <->  contenu de la page
```

- **sens direct** : on donne une adresse, l'algo produit toujours le même texte ;
- **sens inverse** : on donne un texte, l'algo retrouve l'adresse qui le contient.

C'est ce qui permet la fonction « rechercher un texte » : le texte n'est pas
cherché, il est *calculé* où il se trouve.

### L'algorithme
Un **LCG** (générateur congruentiel linéaire) en précision arbitraire :

```
forward :  x' = (a·x + c) mod m
inverse :  x  = a⁻¹·(x' − c) mod m      (a⁻¹ via Euclide étendu)
```

Contraintes :
- `m` > nombre total de permutations possibles ;
- `a`, `c` respectent le théorème de Hull–Dobell (période maximale) ;
- `a⁻¹` = inverse modulaire de `a`, calculé par l'algorithme d'Euclide étendu.

Le LCG seul donnant des résultats « pas assez aléatoires » (motifs visibles),
Basile ajoute une couche de **XOR + décalages de bits** (façon Mersenne Twister),
réversible en appliquant les opérations en ordre inverse.

Repo de référence : `librarianofbabel/libraryofbabel.info-algo`.
Portage TypeScript existant : `tdjsnelling/babel` (utilise GMP).

### Ce qu'on en retient pour nous
JavaScript a **BigInt natif** : pas besoin de GMP/WASM.
Le coût dépend entièrement de la granularité choisie :

| Granularité | Taille du nombre | Coût d'un mod-mul BigInt |
|---|---|---|
| Livre entier (1 312 000 car.) | ~6,1 Mbits en base 25 | lourd (~100 ms+) |
| **Page (3 200 car.)** | **~14,9 kbits** | **négligeable (<1 ms)** |

=> **Décision : la bijection opère à l'échelle de la page.** C'est aussi ce que
fait libraryofbabel.info, et ça colle exactement à la demande (« générer à la
volée à chaque fois que l'utilisateur tourne une page »).

## 3. Limites physiques et techniques du navigateur

### 3.1 Stockage — limite absolue
25^1 312 000 livres. Rien n'est stockable, ni côté serveur ni côté client.
**Tout est procédural, tout est calculé dans le navigateur.** L'hébergeur ne
sert que des fichiers statiques (HTML/JS/assets). Coût serveur = ~0.
C'est un déploiement statique (Vercel/Netlify/Cloudflare Pages) sans backend.

### 3.2 Calcul du texte — non bloquant
- 1 page = 3 200 caractères = ~14,9 kbits en BigInt. Un `mod-mul` sur cette
  taille est sous la milliseconde en V8.
- Malgré tout : **génération dans un Web Worker**, jamais sur le thread principal.
  Règle d'or 3D : le thread qui dessine ne calcule pas.
- Cache LRU des pages déjà générées (une page = 3,2 ko de string).

### 3.3 Rendu 3D — les vraies contraintes

**Draw calls.** C'est le facteur limitant, pas le nombre de polygones.
1 hexagone = 640 livres. Naïvement = 640 draw calls. Avec `InstancedMesh` :
**1 seul draw call** pour les 640 (voire pour 20 hexagones = 12 800 livres).
Règle : dès qu'une géométrie est répétée >10 fois, c'est de l'instancing.

**Ce qui est confortable en WebGL2 (cible réaliste 2026) :**
- 50–150 draw calls par frame pour tenir 60 fps sur GPU intégré ;
- quelques centaines de milliers d'instances via `InstancedMesh` : OK ;
- textures : viser <200 Mo de VRAM, atlas + compression (KTX2/Basis).

**Infinité de la bibliothèque.** On ne peut pas instancier l'infini.
=> **streaming par chunks** : seuls l'hexagone courant + ses voisins
directement visibles (par les couloirs) existent en mémoire. Pool d'objets
recyclés, jamais de `new` en cours de navigation. Le reste est brouillard/noir.
C'est physiquement cohérent avec la nouvelle (on ne voit pas loin).

**Texte 3D.** Deux techniques, on utilise les deux selon la distance (LOD) :
- **troika-three-text** (SDF, via `<Text>` de drei) : net à n'importe quel zoom,
  parsing de police et layout **dans un web worker**, compatible avec les
  matériaux/ombres three.js. => pour la page ouverte qu'on lit.
- **texture canvas / motif procédural** : pour les tranches et les livres
  lointains, où le texte n'est qu'une texture bruitée. Beaucoup moins cher.
  Un livre lointain n'a AUCUN texte réel généré.

**WebGPU vs WebGL2.** Support WebGPU encore incomplet début 2026 :
**WebGL2 reste le choix de production**, avec three.js/WebGPURenderer en option
d'évolution plus tard.

**Mobile.** Contraintes fortes (bande passante mémoire, chauffe). Prévoir un
mode dégradé dès le départ : moins de post-processing, LOD plus agressif,
résolution de rendu abaissée (`dpr` plafonné à 1.5).

### 3.4 Résumé des limites
| Limite | Nature | Réponse |
|---|---|---|
| 25^1312000 livres | absolue, physique | génération procédurale, rien de stocké |
| Calcul BigInt | négligeable à l'échelle page | Web Worker + cache LRU |
| Draw calls | ~100/frame | InstancedMesh partout |
| Mémoire GPU | ~200 Mo | streaming par chunks, pool d'objets, atlas |
| Bibliothèque infinie | impossible à instancier | ne charger que les hexagones voisins |
| Lisibilité du texte | qualité vs coût | troika SDF de près / texture procédurale de loin |

## Sources
- [Library of Babel — Googology Wiki](https://googology.fandom.com/wiki/The_Library_of_Babel)
- [The Library of Babel and the information explosion — Irish Times](https://www.irishtimes.com/news/science/the-library-of-babel-and-the-information-explosion-1.2931731)
- [The Library of Babel (website) — Wikipedia](https://en.wikipedia.org/wiki/The_Library_of_Babel_(website))
- [libraryofbabel.info-algo — GitHub](https://github.com/librarianofbabel/libraryofbabel.info-algo)
- [tdjsnelling/babel — implémentation TypeScript](https://github.com/tdjsnelling/babel)
- [libraryofbabel.info — Theory](https://libraryofbabel.info/theory4.html)
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [InstancedMesh — three.js docs](https://threejs.org/docs/pages/InstancedMesh.html)
- [troika-three-text](https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md)
