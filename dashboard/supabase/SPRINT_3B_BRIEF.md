# Sprint 3b — Migration vitrine partie 2

## Contexte de départ

Sprint 3a livré (commit `c7313ed`). La vitrine Next.js existe sous `dashboard/app/(public)/` avec :
- Layout : LangProvider, LowiNav, LowiHalo, LowiFooter
- Pages existantes : `/` (landing) et `/a-propos`
- CSS : `public.css` (tokens + nav + footer + halo), `landing.css`, `a-propos.css`
- Composants : `_components/LangContext.tsx`, `LowiNav.tsx`, `LowiHalo.tsx`, `LowiFooter.tsx`

Branch courante : `feat/platform-v2`.

## Objectif de ce sprint

Porter les 3 pages restantes de la vitrine HTML vers Next.js, puis supprimer les fichiers HTML racine.

Livrable : toutes les pages vitrine en Next.js, anciens `.html` supprimés, `next build` ✅.

---

## Pages à créer

### 1. `/comment-ca-marche` — `app/(public)/comment-ca-marche/page.tsx`

**Source** : `comment-ca-marche.html` (racine du repo)

**Contenu** :
- Page hero avec image de fond `sunset-hero.jpg` — **attention** : cette image n'existe probablement pas dans Next.js public. Remplacer par le fond ink + radial-gradient teal comme sur la page projets (pas de dépendance image externe).
- 5 étapes en grille 2 colonnes (`step-row`) : Sélection, Structuration, Investissement, Distribution, Sortie
- Chaque étape : `step-left` (h3 avec `#N —` en gold via CSS counter) + `step-right` (`.step-detail` carte blanche)
- CTA final : fond `teal-dk`, liens vers `/` et `/a-propos`
- **Pas** de boutons "Stack technique" et "Pitch investisseur" (liens vers HTML statique hors scope)
- Traductions FR/EN/TH complètes (inline `T` object, pattern identique aux autres pages)

**CSS** : créer `comment-ca-marche.css` avec les styles spécifiques (`.steps-section`, `.steps-list`, `.step-row`, `.step-left`, `.step-right`, `.step-detail`). Le `.page-cta` peut être mutualisé dans `public.css` si identique à celui de `a-propos`.

### 2. `/projets` — `app/(public)/projets/page.tsx`

**Source** : `projets.html` (racine du repo)

**Contenu** :
- Page hero dark avec titre i18n + subtitle
- Filter bar sticky (type × 7, location × 4, sort × 4) — **entièrement côté client** (`'use client'`, `useState` pour filtres et tri)
- Results count
- Project grid 3 colonnes → 2 col → 1 col (responsive)
- 31 projets hardcodés (copier le tableau `projects` du HTML, avec les chemins `img/` vers `https://images.unsplash.com/` ou `/img/fazwaz/...`)
- Cards : image, type tag, status badge, progress bar image, metrics (IRR, distribution, ticket), funding bar, bouton selon status
- Pagination côté client (25 par page)
- Bouton de chaque carte : lien vers `/projets/[slug]`
- Pour l'instant **tous les projets pointent vers `/projets/chalok-villa`** (seul détail existant)

**CSS** : créer `projets.css` avec tous les styles de la page (filter bar, project grid, cards, badges, funding bars, pagination). Ces styles sont spécifiques à cette page.

**Attention** : les images `img/fazwaz/...` sont des assets locaux. Vérifier s'ils existent dans `dashboard/public/img/fazwaz/` ou copier depuis la racine. Si absents, utiliser les URLs Unsplash comme fallback.

### 3. `/projets/chalok-villa` — `app/(public)/projets/[slug]/page.tsx`

**Source** : `projet-chalok-villa.html` (racine du repo)

**Contenu** :
- Hero avec image, overlay, breadcrumb (`Projets > Chalok Baan Kao Pool Villa`), tags (status, type, bail), titre, location
- Stats bar (TRI, distribution/an, ticket min, bail, parts dispo)
- Layout 2 colonnes : contenu principal (description, photos galerie, documents) + sidebar sticky (recap investissement, funding bar, CTA)
- Sections : À propos, Points forts, Documents téléchargeables
- Data hardcodée pour la villa Chalok

**Slug** : `/projets/chalok-villa` (URL fixe pour l'instant, route dynamique `[slug]` préparée pour sprint 8)

**CSS** : créer `projet-detail.css` avec les styles du détail (hero, stats-bar, layout 2 col, sidebar).

---

## Suppression des fichiers HTML racine

Une fois toutes les pages créées et vérifiées en Next.js :

Fichiers à supprimer :
```
index.html
a-propos.html
comment-ca-marche.html
projets.html
projet-chalok-villa.html
proposer.html
confirmation-soumission.html
soumettre-bien.html
```

Garder (hors scope) :
- `lowi-pitch-investisseur.html` — document interne
- `lowi-tech.html` — document interne
- `contracts/` — docs contractuels

---

## Vérifications obligatoires (à faire avant commit)

### Build
```
cd dashboard && npm run build
```
→ `/comment-ca-marche`, `/projets`, `/projets/chalok-villa` apparaissent comme `○ (Static)`.

### Routes
- `GET /comment-ca-marche` → 200, contenu 5 steps visible
- `GET /projets` → 200, 31 cartes rendues, filtres fonctionnels
- `GET /projets/chalok-villa` → 200, détail complet visible

### Régression dashboard
- `GET /users` → 200, tableau users intact
- `GET /users/waitlist` → 200
- `GET /submissions/kyc` → 200
- `GET /invest/login` → 200

### i18n
- Switcher langue : toutes les pages basculent correctement FR/EN/TH
- `localStorage['lowi-lang']` persiste entre les pages

### Navigation
- Liens nav pointent vers les bonnes routes Next.js (pas de `.html`)
- Breadcrumb `/projets/chalok-villa` → lien Projets pointe vers `/projets`
- CTAs `/a-propos` et `/comment-ca-marche` pointent vers les bonnes routes

---

## Audit Opus en fin de sprint

Après le commit de sprint 3b, lancer un audit multi-agents :

1. **Visual** : screenshot `/`, `/a-propos`, `/comment-ca-marche`, `/projets`, `/projets/chalok-villa` — comparer avec HTML original
2. **Regression** : tester toutes les routes dashboard existantes
3. **RLS** : vérifier que les migrations 0001–0005 sont toujours appliquées (`list_migrations`)
4. **Links** : aucun lien `.html` restant dans les composants Next.js
5. **Performance** : Lighthouse `/projets` ≥ 85 (beaucoup d'images à charger)

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `dashboard/app/(public)/comment-ca-marche/page.tsx` | Créer |
| `dashboard/app/(public)/comment-ca-marche.css` | Créer |
| `dashboard/app/(public)/projets/page.tsx` | Créer |
| `dashboard/app/(public)/projets.css` | Créer |
| `dashboard/app/(public)/projets/[slug]/page.tsx` | Créer |
| `dashboard/app/(public)/projet-detail.css` | Créer |
| HTML racine (8 fichiers) | Supprimer en fin de sprint |

---

## Dépendances

Aucune nouvelle dépendance npm pour ce sprint. Tout en React pur + CSS.

Les images `img/fazwaz/` existent dans la racine. Avant suppression des HTML, copier les images nécessaires vers `dashboard/public/img/fazwaz/` ou utiliser uniquement les URLs Unsplash.
