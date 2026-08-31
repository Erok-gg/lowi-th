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

## Cartes (données réelles, jamais inventées)

Les deux cartes de Bangkok du dossier (slide 04 "Bangkok's Momentum" et
slide 14 "Investment Universe") sont construites depuis les **fichiers
geojson réels du projet** (`public/data/bangkok-khet.geojson`,
`pois.geojson`, `corridors.geojson`), jamais dessinées à la main. Points
mesurés en construisant ces cartes :

- **`overflow:hidden` obligatoire sur le `<svg>`** — un district dont le
  centre tombe dans le cadre peut avoir une forme réelle qui s'étend très
  loin (ex. Bang Khun Thian, Nong Chok). Avec `overflow:visible`, ces
  pointes débordent du cadre et flottent sur le reste de la page. Avec
  `overflow:hidden`, elles sont proprement coupées au bord — comportement
  normal de n'importe quelle carte à fenêtre fixe.
- Les lignes de métro dupliquées (un feature par sens de circulation) sont
  dédupliquées par couleur, en gardant la géométrie **la plus longue** des
  deux (pas la première trouvée, qui peut être un fragment court).
- La catégorie OSM "monument" est bruitée (hôtels, arrêts de tram, marchés
  mal tagués) — les monuments affichés sont une liste **triée à la main**
  parmi les entrées réelles, pas un filtre automatique naïf.
- Suvarnabhumi n'est pas dans `pois.geojson` (seuls Don Mueang et 2
  aérodromes mineurs y sont) — ajouté manuellement avec sa coordonnée
  publique documentée, annoté comme tel dans le commentaire du générateur.

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
