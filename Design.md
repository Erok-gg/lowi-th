# LOWI dossier — Design.md

Cahier des charges design pour `public/dossier.html` (et les pages de détail
qui en dépendent : `thesis.html`, `momentum-leverage-analysis.html`,
`deployment-timeline.html`). À respecter pour toute nouvelle section ou
tout nouveau composant.

## Typographie

- **Titres de section** (`h1`, `h2`, `.slide__t`) : police d'affichage
  `MCTen` (embarquée en base64 dans le `<style>`, voir `@font-face` en tête
  de fichier). Aucun `max-width` en `ch` sur les titres — ça forçait un
  retour à la ligne même quand le contenu tenait sur une ligne. Le titre
  utilise toute la largeur disponible (`max-width:100%`) et ne se casse que
  si le texte l'exige réellement.
- **Titres de bloc / carte** (`.cell__t`, `.case__name`, `.node__t`,
  `.step__t`, `.deal-card__name`, `.xref__t`, `.brow--total .brow__k`) :
  police `Aptos` (fallback `Archivo` si Aptos n'est pas installé sur la
  machine du visiteur — c'est un fallback normal, pas un bug). Poids
  renforcé (600-700) pour compenser l'absence de la police d'affichage.
- **Tout le reste** (corps de texte, `body`) : `Aptos, Archivo, 'Helvetica
  Neue', Arial, sans-serif`.
- **Logo LOWI** (`.brand` en topbar, `.cover__mark` en hero) : reste en
  MCTen — c'est la marque, pas un titre de contenu.
- **Chiffres d'affichage** (`.fact__v`, `.casenum__v`) : restent en MCTen —
  ce sont des chiffres-vedettes, pas des titres textuels.

## Le logo animé

`.cover__mark` porte un dégradé violet → or → violet
(`linear-gradient(135deg, var(--violet), var(--gold), var(--violet))`)
appliqué en `background-clip:text`, avec `background-size:220% 220%` et une
animation `background-position` sur 11s (`ease-in-out infinite`) — un
glissement lent, jamais un clignotement. Respecte
`prefers-reduced-motion`. Taille et emplacement du mark ne changent pas.

## Système de rectangles

Règle simple, à ne jamais casser :

- Un rectangle qui occupe **au moins 50 %** de la largeur de page est seul
  sur sa ligne (100 % de large), sauf s'il y en a **exactement 2** prévus
  côte à côte (alors 50/50).
- Les rectangles plus petits (cartes dans une grille) sont **séparés par un
  espace constant** (`gap:14px`, jamais un filet de 1px avec un fond
  partagé qui simule une séparation).
- **Piège CSS Grid rencontré et corrigé** : `grid-template-columns:
  repeat(auto-fit, minmax(...))` peut faire flotter un nombre de colonnes
  différent selon la largeur du conteneur (ex. 4 cartes qui s'affichent en
  3 + 1 au lieu d'un carré 2×2). **Toujours fixer explicitement** le nombre
  de colonnes avec `grid-template-columns:repeat(N,1fr)` en style inline
  quand N est connu à l'avance (nombre de blocs fixe), plutôt que de
  laisser `auto-fit` deviner.
- `.grid`/`.cell` : le fond partagé + bordure de 1px sur `.grid` a été
  retiré ; chaque `.cell` porte sa propre bordure, son propre
  `border-radius`, et un vrai `gap` la sépare de ses voisines. Même
  traitement sur `.case__nums`/`.casenum`.

## Tableaux

Tout le contenu des cellules (`table.data`, `table.fee`) est centré
**horizontalement et verticalement** (`text-align:center;
vertical-align:middle`), y compris la première colonne (qui n'est plus
alignée à gauche par défaut).

## Espacement sous les titres de section

`.slide__t{margin-bottom:34px}` (porté à cette valeur après retour terrain —
18px collait le premier bloc au titre). S'applique à tout titre de section,
pas seulement au premier cas corrigé.

## Mise en cascade ("waterfall")

Pour une séquence d'étapes qui se succèdent logiquement (`.flow`/`.node`,
utilisé sur la slide Structure & Guarantees) : les blocs se chevauchent en
escalier plutôt que de s'empiler avec un espace constant.
`margin-top:-24px` sur chaque `.node` sauf le premier, décalage horizontal
croissant (`margin-left:7%` par étape, `z-index` croissant pour que
l'étape suivante recouvre partiellement la précédente). Repli mobile en
`@media(max-width:720px)` : empilement simple, plus d'overlap ni de
décalage horizontal (l'effet cascade suppose de la largeur).

## Boutons de renvoi flottants (desktop)

`.rf-btn` : un lien flottant à droite de l'écran (`position:fixed;
right:26px`), un par page de renvoi référencée dans la slide courante,
positionné à une hauteur fixe (`top` en %) pour ne jamais se chevaucher.
Caché par défaut (`opacity:0; transform:translateX(-140vw)`), affiché
seulement au-delà de `min-width:1040px` (l'animation n'a pas de sens sur
mobile, où le lien inline suffit).

Comportement scroll : un `IntersectionObserver` détecte quand la slide
d'origine du lien entre/sort du viewport et bascule les classes `is-in` /
`is-out` :
- **Entrée** (`is-in`) : glisse depuis la gauche vers sa position finale
  (`cubic-bezier(.15,.86,.32,1.02)`, 620ms) — un atterrissage, accélération
  puis freinage net.
- **Sortie** (`is-out`) : repart vers la droite (`cubic-bezier(.5,-.2,.85,.4)`,
  500ms) — un décollage, départ franc puis relâche.

Chaque lien inline dans le texte porte un attribut `data-rf-btn="id"` qui le
relie à son bouton flottant correspondant — pas de lien flottant sans lien
inline d'origine (le flottant est un raccourci, jamais la seule voie
d'accès).

## Traitement des images de bloc

`.cell__photo{height:210px; opacity:.8; filter:saturate(.85)}` — l'image
déborde le padding du bloc (`width:calc(100% + 42px); margin:-21px -21px
4px`) pour venir affleurer les bords, mais reste légèrement assourdie
(désaturée + opacité réduite) pour ne jamais dominer visuellement le texte
du bloc.

## Restructuration en pages de renvoi (deuxième vague)

Deux mécanismes supplémentaires suivant le patron déjà établi
(§ Pages de détail) :
- **Slide entière devenue renvoi** : l'ancienne slide "Agent Pipeline"
  (9 bots) a été retirée du flux principal et existe uniquement comme
  `agent-pipeline.html`, liée depuis la slide "Why LOWI Wins" par un lien
  texte discret — même patron qu'un renvoi de bloc, à l'échelle d'une slide
  entière.
- **Slides devenues miniatures cliquables** : les 4 études de cas
  (Thonglor Art 25, Park Origin Chula-Samyan, Four Street Mansion, Master
  View Executive Place) ne sont plus des slides séparées : elles sont
  devenues 4 `.deal-card` dans la grille de la slide "The Investment
  Universe" (9 vignettes au total avec les 5 déjà existantes), chacune
  ouvrant son détail complet via `showDeal(key)` (toggle JS, pas de modal —
  même mécanisme que les vignettes déjà présentes). Le contenu textuel de
  ces 4 fiches reste à retravailler (format posé, contenu à revoir).

## Notes de bas de page (légal)

`.foot` porte : `LOWI®` (marque déposée), `© 2026 LOWI. All rights
reserved.`, et une adresse **de quartier seulement** (`Central, Hong Kong
SAR`) — jamais d'adresse exacte (immeuble, étage, rue) tant que la structure
juridique n'est pas finalisée.

## Fond animé

`.cloud-bg` (3 `<span>` avec `filter:blur(90px)`, couleurs violet / bleu
foncé / gris-anthracite) dérive très lentement en arrière-plan
(`animation: 46-58s ease-in-out infinite alternate`), **derrière** le
quadrillage existant (`body::before`, inchangé) — le quadrillage reste
visible, les nuages sont une couche supplémentaire en dessous. Respecte
`prefers-reduced-motion`.

## Pages de détail (mécanisme "renvoi")

Un contenu jugé secondaire (démonstration, calcul détaillé, risque
approfondi) est retiré de la diapo principale et déplacé vers une **page
HTML autonome**, ouverte dans un **nouvel onglet** (`target="_blank"`), qui
reprend intégralement le `<style>` de `dossier.html` (mêmes tokens, même
police, mêmes composants) pour garder la même présentation. Un lien texte
discret (violet, soulignement fin) est laissé en bas de la diapo d'origine.

Pages existantes suivant ce patron :
- `thesis.html` — le calcul de décote 25-42 % (retiré de la slide 02)
- `momentum-leverage-analysis.html` — risque d'inflation/crédit, friction
  d'accès étranger, statut "premier véhicule conservateur" (référencé
  depuis la slide 03)
- `deployment-timeline.html` — le calendrier de déploiement en 2 levées
  (retiré de la slide 07)

Nouveau générateur : voir les scripts `build_dossier*.py` dans l'historique
de session pour le patron exact (extraction du bloc `<style>` de
`dossier.html`, réinjection dans un gabarit minimal avec `topbar` +
`.detail-wrap`).

## Cartes (données réelles, mêmes tuiles que le produit lowi_bkk)

**Réécrit le 2026-09-01** — remplace la version précédente (reconstruction
SVG statique à partir des geojson). Les deux cartes de Bangkok du dossier
(slide 04 "Bangkok's Momentum" et slide 14 "Investment Universe") sont
désormais des cartes **vivantes MapLibre GL JS**, pas des SVG dessinés une
fois par un script Python. C'est littéralement le même produit que
`lowi_bkk` : même fournisseur de tuiles (`https://tiles.openfreemap.org/
styles/dark`, OpenFreeMap — gratuit, sans clé), même re-teinte (fond
`#0d0d12`, eau `#1e3a5f`, frontières admin masquées), mêmes fichiers
geojson (`public/data/bangkok-khet.geojson`, `pois.geojson`,
`corridors.geojson`, copiés depuis `Lowi_bkk/public/data/`, chargés par
`fetch()` côté client — pas de traitement serveur).

- **Chargement** : `maplibre-gl@4.7.1` via CDN unpkg (lien CSS + script
  dans le head), une fois pour toute la page. Les deux cartes s'initialisent
  dans une IIFE en fin de `<script>`, après le bloc de routing existant —
  `if (typeof maplibregl === "undefined") return;` en garde en tête, la
  page reste fonctionnelle si le CDN est injoignable.
- **Attribution obligatoire** : `attributionControl:{compact:true}` —
  licence ODbL d'OpenStreetMap, ne jamais désactiver.
- **`cooperativeGestures:true`** — affiche "Use Ctrl + scroll to zoom" au
  lieu de capter la molette de la page ; la carte est encastrée dans une
  page qui défile, pas en plein écran comme sur `lowi_bkk`. Rotation/pitch
  désactivés (`dragRotate.disable()`, `touchZoomRotate.disableRotation()`)
  — carte à plat, pas d'usage pour l'inclinaison ici.
- **Couches ajoutées par-dessus le fond** : districts khet (fill+line,
  violet discret, même rôle que le produit principal), lignes de métro
  (`pois.geojson`, catégorie `metro_line`, couleur officielle via
  `["get","color"]` — pas de dédup par couleur nécessaire, MapLibre rend
  les doublons de géométrie sans artefact visuel contrairement à un
  chemin SVG concaténé à la main). Sur la carte momentum uniquement :
  lignes futures (`corridors.geojson`, `future_line`, tiret) + zones de
  développement/expat (`dev_zone`/`expat_zone`, remplissage + étiquette
  posée au centroïde de chaque polygone, calculé côté client). Sur la
  carte universe uniquement : aéroports (3 réels + Suvarnabhumi manuel,
  absent du jeu de données — voir `SUVARNABHUMI` dans le script) et
  monuments **triés à la main par nom** (`MONUMENT_NAMES`, catégorie OSM
  bruitée), plus les 9 pins des biens du pool en vraies coordonnées
  lng/lat (`PROPS`), chaque pin appelant `showDeal(key)` au clic — même
  mécanisme que les vignettes de la grille en dessous.
- **CSS mort retiré** : `.map-wrap`, `.map-district`, `.map-metro`,
  `.map-future`, `.map-airport`, `.map-monument`, `.map-pin*` (l'ancien
  habillage SVG) supprimés une fois les deux cartes converties ; `.map-
  legend` conservé (toujours utilisé). `.corr-map-wrap`/`.corr-zone-label`
  restent en usage réel — c'est le graphique en ligne de la slide 03, une
  classe partagée par nom mais pas par fonction, à ne pas confondre avec
  les cartes.

## Palette des types de bien (yield / value / renovation / declined)

Validée avec le script `validate_palette.js` du skill `dataviz` plutôt que
choisie à l'œil :

| Rôle | Couleur | Token |
|---|---|---|
| Yield | `#C9A84C` (or) | `--gold` |
| Value | `#A368FF` (violet) | `--violet` |
| Renovation | `#1FA39B` (teal) | `--reno` (nouveau) |
| Declined | `#E07070` (rouge) | `--pass` |

Le premier choix pour "Renovation" (`#5B8DEF`, bleu) échouait le contrôle
vision-normale contre le violet (ΔE 12.7, sous le plancher de 15 —
confondu même sans daltonisme). Remplacé par un teal qui passe tous les
contrôles CVD. `--reno` a un token light-mode dédié (`#158079`), présent
dans les 3 endroits où les tokens sont déclarés (`:root` sombre par
défaut, `@media (prefers-color-scheme: light)`, `:root[data-theme="light"]`
— **les trois doivent toujours être synchronisés**, un token oublié dans
l'un des trois blocs casse silencieusement ce mode).
