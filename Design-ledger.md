# LOWI dossier — Design « Ledger » (2026-10-14)

> **Implémenté le 2026-10-14** dans `public/dossier.html` et
> `public/dossier-fr.html` (branche `design/ledger-2026-10`). `Design.md`
> reste en place pour l'historique et les règles qu'il porte (bilingue, tableaux,
> barres de rendement…) ; là où les deux divergent — polices, rayons, tampons,
> palette — **ce document prime**. Pages satellites (`thesis`,
> `momentum-leverage-analysis`, `deployment-timeline`, `agent-pipeline`, EN+FR)
> passées au même style le 2026-10-14. Non encore appliqué : `deck.html`.
>
> Maquettes (canevas privé, à partager depuis la page) :
> https://claude.ai/artifact/Cp4vsj92sa1uH5mEX4nNEm

## Pourquoi changer — ce qui a été mesuré sur lowi.asia (2026-10-14)

Relevé dans le navigateur (styles calculés + `document.fonts`), pas déduit :

| Constat | Mesure | Effet |
|---|---|---|
| `MCTen` n'a pas de glyphe `–` (U+2013) | « 8–10 % » du cover s'affiche « 8¯10 % » | Le chiffre-vedette n°1 du cover est cassé |
| `Aptos` n'est pas une webfont | `document.fonts.check('16px Aptos')` vrai **uniquement** parce qu'Office est installé sur le poste de test | Un investisseur sur Mac/iPhone lit une autre police (Archivo) que celle validée à l'écran. `Design.md` qualifie ce repli de « normal, pas un bug » : c'est vrai techniquement, mais on ne voit jamais ce que voit le lecteur |
| Arrondis | 12 valeurs distinctes : 0, 1, 2, 3, 4, 5, 6, 12 px, 50 %, 999 px, et deux arrondis partiels | Aucun système ; les cartes voisines ne « parlent » pas la même langue |
| Familles de polices effectives | 4 (MCTen, Aptos/Archivo, IBM Plex Mono, Helvetica/Arial) | Trop pour un document de 17 sections |
| Titres `h2` en MCTen 47 px | police pixel sur des phrases entières | Lecture « jeu vidéo », en contradiction avec le positionnement prime+ |
| Numérotation | les sections passent de **09 à 14** (10–13 absentes) | Un lecteur attentif cherche les 4 slides manquantes |

## Principes

1. **Une seule police de texte, une seule police de données.** Hanken Grotesk
   (titres 500, texte 400, cartes 600) + JetBrains Mono (étiquettes, chiffres
   de tableau, `tabular-nums`). Les deux sont des webfonts Google, servies
   identiques sur toutes les machines. **MCTen reste uniquement sur le logo
   `LOWI`** — c'est la marque, pas une police de contenu.
2. **Pas d'étiquettes en pastille.** Les tampons de provenance
   (MEASURED / INFERRED / PROJECTION) en bulle ont été retirés à la demande.
   La provenance reste écrite, en une ligne de texte discrète
   (`13px`, `--faint`) sous le bloc concerné : « Return figures are a model,
   not a promise. Market figures measured 2026-09-01… ». Les rôles des biens
   (Yield / Value / Renovation…) sont du texte mono coloré, sans fond.
3. **Pas de numéros dans les cartes.** Les « 01 / 02 / I. / II. » à l'intérieur
   des cases ont été supprimés ; le seul numéro est celui de la section, dans
   la colonne d'index.
4. **Une barre seulement quand une barre a du sens.** Voir « The return »
   plus bas : chaque terme a la visualisation de sa nature.

## Tokens

### Foncé (thème retenu)

| Rôle | Token | Hex |
|---|---|---|
| Fond page | `--bg` | `#0B0C0F` |
| Surface / carte | `--surface` | `#121318` |
| Creux (pistes, placeholders, en-têtes de tableau) | `--sunken` | `#1A1C22` |
| Texte | `--ink` | `#EEF0F3` |
| Texte secondaire | `--muted` | `#A0A6B1` |
| Texte tertiaire | `--faint` | `#7C828D` |
| Filet | `--rule` | `#22252C` |
| Filet appuyé | `--rule-strong` | `#30343C` |
| Accent (violet Lowi adouci) | `--accent` | `#A99DFF` |
| Fond accent | `--accent-soft` | `#221E3D` |
| Positif | `--pos` | `#6FCFAE` |
| Négatif | `--neg` | `#F0907A` |

### Clair

| Token | Hex |
|---|---|
| `--bg` | `#F7F7F4` |
| `--surface` | `#FFFFFF` |
| `--sunken` | `#EFEFEB` |
| `--ink` | `#0F1115` |
| `--muted` | `#545A66` |
| `--faint` | `#7A808C` |
| `--rule` / `--rule-strong` | `#E2E3E0` / `#CFD1CC` |
| `--accent` / `--accent-soft` | `#4F3FC4` / `#ECE9FB` |
| `--pos` / `--neg` | `#1E6B57` / `#B0452E` |

Positif et négatif diffèrent aussi en **luminosité**, pas seulement en teinte
(lisibles par un daltonien rouge-vert).

### Forme et espacement

- **Rayons : deux valeurs**, `--r-sm: 6px` (boutons, liens de nav) et
  `--r: 12px` (cartes, images, panneaux). Pastilles de légende : 2 px.
- **Grille 8 px.** Sections `120px` de padding vertical (`80px` sous 900 px),
  gouttière de grille `16px` (cartes) ou `32px` (équation du rendement),
  conteneur `max-width:1240px`, marges latérales `40px` → `20px` sur mobile.
- **Mise en page de section** : colonne d'index de `200px` à gauche
  (numéro + nom en mono, filet `--ink` au-dessus), contenu à droite ;
  les grilles de cartes passent en pleine largeur (`grid-column:1 / -1`).
- Grilles à nombre de cartes connu : `repeat(N, minmax(0,1fr))` fixe — même
  règle que `Design.md` (piège `auto-fit` déjà documenté).
- Cibles cliquables ≥ 44 px (boutons `height:44px`).

### Typographie

| Usage | Police | Taille / graisse |
|---|---|---|
| H1 cover | Hanken Grotesk | `clamp(52px,7vw,92px)` / 500, `letter-spacing:-0.045em`, `line-height:.98` |
| Titre « Teaser » | Hanken Grotesk | 88px / 500 |
| H2 de section | Hanken Grotesk | 48px (34px mobile) / 500, `-0.03em` |
| Chapô | Hanken Grotesk | 19px / 400, `--muted` |
| Titre de carte | Hanken Grotesk | 19px / 600 |
| Corps de carte | Hanken Grotesk | 14,5px / 400, `--muted` |
| Chiffres-vedettes | Hanken Grotesk | 36–72px / 500, `tabular-nums lining-nums` |
| Étiquettes, index, tableaux | JetBrains Mono | 11–12px / 400–500, capitales `0.08em` pour les étiquettes |

## Navigation : Teaser et Dossier

- Nav : `LOWI` · **Teaser** · **Dossier** · séparateur · Allocation ·
  Structure · Tax & exit · Platform · Risk · `FR` · *Request access*.
- **Teaser = page d'atterrissage.** Cover court (H1, chapô, panneau
  plateforme, 4 chiffres clés), puis un grand titre **« Teaser »** avant
  *The problem*, puis Problem, Return, Universe, Fees, et un bloc final
  « Open the full dossier ».
- **Clic sur Dossier** (ou sur tout bouton « Read / Open the full dossier ») :
  1. retour en haut de page (défilement doux, 400 ms) ;
  2. tout le contenu du teaser sous le H1 **s'efface du bas vers le haut**
     — `clip-path: inset(0 0 0 0)` → `inset(0 0 100% 0)` + opacité,
     2,6 s, `cubic-bezier(.65,0,.35,1)` ; total ≈ 3 s ;
  3. seul « Data. Discipline. Dividend. » reste — il devient la slide **01 ·
     Cover** ;
  4. le deck complet se **déploie de haut en bas**, slide par slide :
     animation `unfold` (translateY 40px + `clip-path` du haut vers le bas,
     1 s), décalée de 0,1 s à 1,6 s de la 01 à la 17.
- **Clic sur Teaser** ou sur le logo : retour immédiat au teaser.
- À prévoir à l'implémentation : `prefers-reduced-motion` → bascule
  instantanée, sans animation (non fait dans la maquette).

## Slides du dossier (contenu de lowi.asia, re-mis en forme)

| N° | Section | Forme |
|---|---|---|
| 01 | Cover | H1 conservé de l'animation + 5 chiffres clés en bande |
| 02 | The problem | 4 cartes sur **une seule ligne**, avec les 4 photos du pitch actuel, sans numéro |
| 03 | Market opportunity | 3 cartes (Window / Cycle / 2030) + graphique offre/prix (placeholder) + encadré « 1.6 M vacant condos… » |
| 04 | Bangkok's momentum | 4 cartes + carte des lignes et zones (placeholder) |
| 05 | Pooled asset strategy | 4 rôles + 2 principes d'exploitation |
| 06 | Structure & guarantees | 4 étapes en chaîne (l'escrow mis en avant) + encadré juridique |
| 07 | Investment thesis | bande de 4 chiffres + 4 règles de sélection + « Not in this number » |
| 08 | The return | équation (voir ci-dessous) |
| 09 | Why LOWI wins | 4 avantages |
| 14 | Investment universe | carte (placeholder) + liste des 9 biens avec leur rôle |
| 15 | Fee structure | tableau + illustration chiffrée |
| 16 | The team | 3 cartes, photos en placeholder |
| 17 | Close | H1 répété + annexes A–E en cartes + CTA |

Encadrés (`callout`) : filet gauche de 2 px en `--accent`, titre 20px/600,
texte `--muted` — remplacent les bandeaux pleine largeur.

## « The return » — l'équation au lieu des barres

Retour utilisateur sur la première version : « bonne idée, mauvaise
exécution — on ne peut pas tout présenter sous forme de barre ». Les cinq
termes n'ont pas la même nature ; chacun reçoit sa propre forme :

| Terme | Valeur | Visualisation |
|---|---|---|
| Rental income | +5,0–7,0 % | bande 5–7 % sur une échelle 4–8 %, avec les 3 rendements mesurés en points (Bang Kapi 6,49 / Suan Luang 6,51 / Wang Thonglang 6,76) |
| − Running costs | 1,8–2,2 % | liste des postes (charges, gestion internalisée, vacance, assurance + taxe foncière) — **pas de ventilation chiffrée** : elle n'existe pas dans la source |
| + Appreciation | +2,5–3,5 % | courbe composée sur 10 ans : ×1,34 à 3 %/an (modélisé) contre ×1,63 à 5 %/an (borne haute observée) |
| + Entry discount | +2,2–3,0 % | prix d'entrée positionné face à la médiane de l'immeuble, écart −20–30 % |
| − Transaction costs | 0,8–1,0 % | mini-tableau : transfert 2 %, SBT 3,3 %, retenue 1 % |
| **= Target IRR** | **8–10 %** | une seule échelle 0–12 % : 6–8 % sans décote (gris) contre 8–10 % avec (accent) — le seul endroit où la barre est la bonne forme |

Opérateurs `−` / `+` placés dans la gouttière entre les cartes (masqués sous
1 100 px, où l'équation passe en 2 colonnes). Chapô conservé :
« Without the entry discount, the model returns the conservative 6–8 %, not
the headline. »

## Implémentation (2026-10-14)

Six commits, un par étape, chacun vérifié dans le navigateur :

1. Chiffres-vedettes hors MCTen (tiret du cover).
2. Tokens, polices, rayons ; nuages et quadrillage masqués.
3. Colonne d'index, pastilles retirées (8 rails + légende + 2 phrases),
   Problem sur une ligne. **Trouvé en route** : `dossier*.html` n'avaient pas
   de `<meta name="viewport">` — un téléphone recevait la page de 980 px
   dézoomée — et les grilles à colonnes fixées en ligne élargissaient la page
   à 519 px sur un écran de 375. Les deux sont corrigés ; vérifié sans
   débordement sur les 7 routes à 375 px.
4. « The return » en équation.
5. Teaser en route `/`, dossier en `#/dossier`. Le Teaser **clone au
   chargement** Problem, Return et Fees depuis le dossier
   (`data-clone-from`) : une seule source, pas d'image base64 en double.
   Séquence chronométrée : effacement à 0,4 s, dossier à 3,0 s, H1 à la même
   hauteur (163 px) dans les deux vues.
6. Report à l'identique sur `dossier-fr.html` (mêmes scripts de remplacement
   vérifiés, textes traduits).

## Ce qui n'est PAS fait

- **`deck.html`** garde l'ancien style (diaporama de 5,7 Mo, format slides
  distinct ; il a déjà sa balise `viewport`).
- **Pages satellites (2026-10-14)** : même conversion que le dossier, plus
  trois corrections communes — `viewport` ajouté, retour vers
  `dossier.html#/dossier` (et non plus `dossier.html`, qui ouvre désormais le
  Teaser), barre « suite » en bas de page. Contenu de `thesis` réaligné sur le
  dossier : l'écart de 25–42 % est le chiffre du *filtrage* ; les décotes
  *vérifiées* sont plus basses (Thonglor −20,2 %, Park Origin −33,2 %) et le
  modèle retient 20–30 % ; « quatre études de cas » devient neuf biens filtrés
  dont quatre détaillés, avec Master View (−40,8 % → ~−15 %, écarté).
  Contenu des 3 autres pages non relu ligne à ligne : seuls les chiffres
  croisables avec le dossier (13 bots) ont été vérifiés.
- **Compteur d'annonces en direct** : chiffre figé au 2026-09-01, animé de 0
  au chargement. Un vrai compteur demanderait un appel à la base ou une
  régénération du HTML à chaque cycle — à trancher.
- **Animation non vue à l'œil** : le navigateur de test avait « réduire les
  animations » activé ; la séquence a été vérifiée par chronométrage des
  classes, pas visuellement. À regarder sur un vrai poste.
- **Placeholders** de la maquette (graphique, cartes, photos) : sans objet ici,
  le site garde ses vrais graphiques, cartes MapLibre et photos.
- **Grand logo animé LOWI** retiré de la cover (le slogan devient le H1) ; la
  marque reste dans la barre du haut. Réversible si on le regrette.
- **Numérotation 10–13** : laissée telle quelle (09 → 14).

## À faire — demandé le 2026-10-15

- **Slide « Leverage »** : le levier de négociation sur les biens prime
  sous-cotés (acheteur cash face à des vendeurs pressés — p. ex. acheteurs
  chinois en retrait, −23,8 % au S1 2026, REIC). S'appuyer sur la page
  existante `momentum-leverage-analysis.html`.
- **Slide « Network »** : le réseau qui apporte ces biens (agents, avocats,
  propriétaires) — comment une offre repérée par la plateforme devient une
  acquisition.
- Arbitrer le « 8–10 % » des titres (cover, 07, 08) : le scénario principal
  donne 7,4–9,5 % (entrée −20/−30 %).
- ~~Intégrer les éléments sourcés de l'article « La crise des logements vides à
  BKK »~~ — fait le 2026-10-15 (vacance TREVC/AREA/CBRE, acheteurs chinois REIC,
  loyers prime JLL). Les risques ont été **retirés du site** et consignés mot
  pour mot dans `Risques-a-reformuler.md`, à reformuler en en disant le moins
  possible.
