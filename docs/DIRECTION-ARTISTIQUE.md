# Direction artistique : Babbel

> Établie le 2026-08-29 à partir de 10 captures de
> « Viens, je vais te Montrer l'Infini » (youtube.com/watch?v=J3JsyxABi0g).
> Ces images sont la **référence visuelle de vérité** du projet.

## 1. Le parti pris central : deux régimes de lumière

C'est la clé de toute la direction artistique, et elle recoupe exactement notre
découpage architectural (D11).

| | **Le Seuil** | **La Bibliothèque** |
|---|---|---|
| Lumière | solaire, rasante, dorée | ténèbres, sources ponctuelles rares |
| Palette | calcaire crème, ciel teal, or | noir chaud, halos ambrés, marbre froid |
| Sensation | chaleur, dehors, monument | vertige, dedans, écrasement |
| Références | captures 1, 2, 3 (dôme, vue aérienne, paysage) | captures 5, 6, 7, 9, 10 (mur de livres, couloir aux torches, coupole étoilée, Atlas) |

Le visiteur passe **du plein soleil aux ténèbres**. C'est l'arc dramatique du
site entier, et c'est ce que le film fait.

## 2. Palette

```
CALCAIRE / TRAVERTIN
  crème clair     #E8DCC8   surfaces éclairées, dôme, dalles
  sable           #D4C3A5   demi-teintes
  ombre chaude    #8A7660   ombres portées sur la pierre

LUMIÈRE
  soleil rasant   #F2C078   lumière directe du Seuil
  or / laiton     #C9A227   le cube, les détails
  flamme          #E86A2B   torches du couloir sombre

CIEL
  teal profond    #2E4A52   haut du dégradé
  teal pâle       #7A9A9E   horizon
  brume dorée     #E0B98A   raccord soleil/horizon

TÉNÈBRES
  noir chaud      #0D0B0A   fond de la Bibliothèque
  brun sourd      #2A2320   étagères, boiseries
  rouge éteint    #5C3A38   dos de livres (voir capture 5)

MARBRE FROID
  blanc statue    #F4F2EF   statues, autel
  bleu nuit       #1A1F26   coupole étoilée
```

**Règle :** jamais de gris neutre. Toutes les ombres tirent vers le brun-violacé,
toutes les lumières vers l'ambre. C'est ce qui donne la matière.

## 3. Formes et composition

**Géométrie primitive, monumentale, assumée.** Le dôme est une sphère posée dans
un bol. Le sanctuaire est un cube. Les colonnes sont des cylindres. Aucune
fioriture : la puissance vient de l'échelle et de la pureté, pas du détail.

**Symétrie frontale absolue.** Presque tous les plans ont un axe vertical central
et un point de fuite au milieu du cadre (captures 4, 6, 7, 8). C'est solennel,
c'est immédiatement lisible, et c'est facile à composer.

**Répétition sérielle.** Cyprès en anneau autour du dôme, colonnades qui fuient,
caissons de coupole, dos de livres à perte de vue. La répétition *est* le sujet :
elle dit l'infini sans avoir à le montrer. **C'est aussi exactement ce que
l'instancing GPU sait faire pour rien** : la forme et la technique coïncident.

**Échelle écrasante.** L'humain n'est jamais le sujet. Les colonnades sortent du
cadre par le haut, les murs de livres n'ont pas de sommet visible.

## 4. Caméra

- **Contre-plongée basse**, souvent au ras du sol (captures 3, 4, 6, 7).
- **Focale longue**, perspective écrasée, peu de déformation.
- **Un objet lumineux unique au centre**, cerné de vide sombre : le cube d'or,
  la statue d'Atlas, l'autel. C'est la signature du film.
- Mouvements lents, glissés, jamais de secousse. Cohérent avec D13.
- Format large, léger letterbox pendant les transitions.

## 5. Matériaux

| Matériau | Où | Rendu |
|---|---|---|
| Calcaire mat | dôme, dalles, murs du Seuil | roughness haute, micro-relief, quasi aucun spéculaire |
| Marbre veiné | colonnes, sol du hall | veines sombres marquées, sol **poli et réfléchissant** |
| Or brossé émissif | le cube | émissif + bloom, c'est la seule vraie source du hall |
| Bois sombre | étagères | brun sourd, absorbe la lumière |
| Bronze / fer | torches, échelles, balustrades | sombre, spéculaire ponctuel |

Le **sol réfléchissant** revient dans presque tous les plans intérieurs
(captures 4, 6, 7, 10) : c'est ce qui double la lumière et donne la profondeur.
À traiter comme un élément de première importance, pas comme un détail.

## 6. Post-processing (l'essentiel de l'ambiance)

Par ordre d'importance :
1. **Vignettage lourd** : présent partout, c'est ce qui isole le sujet ;
2. **Bloom** sur les sources (cube, torches, ouverture du dôme, autel) ;
3. **Grain** fin et constant, donne la matière filmique ;
4. **Profondeur de champ** légère, sur les plans rapprochés ;
5. **Aberration chromatique** très légère (visible sur les bords de la capture 4) ;
6. **Tone mapping filmique** (ACES) : indispensable pour ces contrastes.

## 7. La contrainte technique et le parti pris coïncident

Point important, et c'est ce qui rend cette DA **réalisable en WebGL** alors que
les images de référence sont des rendus offline avec ray tracing :

- **Le Seuil est statique.** Une scène fixe, jamais dupliquée => on peut
  **précalculer tout l'éclairage en lightmaps** (baking hors ligne, chargé comme
  une texture). On obtient une qualité d'éclairage impossible en temps réel,
  pour un coût de rendu quasi nul. C'est *le* levier de la séquence d'arrivée.
- **La Bibliothèque est procédurale**, donc impossible à baker. Elle doit être
  éclairée par très peu de sources dynamiques... c'est-à-dire **sombre**.
  Or c'est exactement le parti pris du film : ténèbres, halos rares, l'infini
  suggéré par ce qu'on ne voit pas.

Autrement dit : **ce qu'on ne peut pas se permettre techniquement est
précisément ce qu'il ne faut pas faire artistiquement.** On ne subit pas la
contrainte, on s'en sert.

Corollaires :
- pas de ray tracing => réflexions du sol par plan miroir ou SSR léger ;
- ombres : cascades limitées et de faible portée, le noir fait le reste ;
- éclairage d'ambiance par HDRI/IBL, une seule lumière directionnelle au Seuil ;
- les cyprès, colonnes, livres, caissons : instanciés, jamais dupliqués.

## 8. Motifs à reprendre explicitement

- **Le dôme dans son bol**, ceinturé de deux anneaux de cyprès : l'image d'arrivée.
- **Le cube d'or en lévitation** sous une coupole à caissons : le cœur du hall.
  À envisager comme l'objet de navigation du site.
- **Le mur de livres sans sommet**, parcouru d'échelles obliques.
- **Le couloir aux torches**, jalonné jusqu'à un point lumineux lointain.
- **La coupole à caissons percée d'étoiles** : le plafond de la bibliothèque.
- **Atlas portant le globe**, éclairé à contre-jour dans une niche.

## 9. Ce qu'il faut éviter

- le gris neutre et la lumière blanche uniforme ;
- le détail décoratif, les moulures chargées : la force est dans la nudité ;
- une lumière ambiante forte qui « déboucherait » les noirs ;
- le mobilier réaliste, les personnages ;
- toute interface qui flotterait par-dessus sans appartenir au monde.
  L'overlay 2D doit être minimal, en calcaire et or, jamais en blanc pur.
