# LOWI — Design System

## Identité

- **Nom produit :** LOWI
- **Marché :** Crowdfunding immobilier en Thaïlande
- **Ton :** Premium, accessible, transparent, digital-first
- **Langue principale :** Français

---

## Palette de couleurs

| Rôle | Nom | Hex |
|---|---|---|
| Accent principal | Gold | `#C9A84C` |
| Accent clair | Gold Light | `#E8C97A` |
| Secondaire | Teal | `#0D7C6E` |
| Secondaire foncé | Teal Dark | `#095448` |
| Fond page | Cream | `#FAF6EE` |
| Texte principal | Ink | `#1A1A2E` |
| Texte secondaire | Ink 2 | `#2E2E4A` |
| Texte désactivé | Muted | `#6B7280` |
| Fond carte | White | `#FFFFFF` |

### Variables CSS

```css
:root {
  --gold:    #C9A84C;
  --gold-lt: #E8C97A;
  --teal:    #0D7C6E;
  --teal-dk: #095448;
  --cream:   #FAF6EE;
  --ink:     #1A1A2E;
  --ink2:    #2E2E4A;
  --muted:   #6B7280;
  --white:   #FFFFFF;
}
```

---

## Typographie

- **Police :** `'Segoe UI'`, system-ui, -apple-system, sans-serif
- **Pas de police custom** pour l'instant (à remplacer par ex. Inter ou DM Sans)

| Élément | Taille | Poids | Notes |
|---|---|---|---|
| H1 hero | `clamp(2.4rem, 4.5vw, 3.8rem)` | 800 | letter-spacing: -.03em |
| H2 section | `clamp(1.8rem, 3vw, 2.8rem)` | 800 | letter-spacing: -.03em |
| H3 carte | `1.15rem` | 700 | |
| Label section | `0.78rem` | 700 | uppercase, letter-spacing: .12em, couleur Gold |
| Corps | `1.05rem` | 400 | line-height: 1.7, couleur Muted |
| Petit | `0.82–0.88rem` | 500 | métadonnées, tags |

---

## Espacement & Mise en page

- **Padding horizontal pages :** `8vw`
- **Padding sections :** `6rem` vertical
- **Gap grille cartes VP :** `1.75rem`
- **Gap carrousel :** `1.5rem`
- **Border-radius carte :** `2rem` (--r-xl)
- **Border-radius interne :** `1.25rem` (--r-lg)
- **Border-radius bouton pill :** `2rem`

---

## Composants

### Navbar

```
Position : fixed, top 0
Background : rgba(250,246,238,.88) + backdrop-filter: blur(18px)
Border-bottom : 1px solid rgba(201,168,76,.2)
Logo : "LOWI" en police MC Ten Lowercase Alt, couleur uniforme
CTA bouton : fond Gold, border-radius 2rem, font-weight 700
```

### Hero Badge (tag de statut)

```css
background: rgba(201,168,76,.15);
border: 1px solid rgba(201,168,76,.35);
color: var(--gold);
font-size: .8rem; font-weight: 700;
letter-spacing: .08em; text-transform: uppercase;
padding: .35rem .9rem; border-radius: 2rem;
```
Préfixe `●` automatique via `::before`.

### Boutons

| Variante | Fond | Texte | Border | Usage |
|---|---|---|---|---|
| Primary | `--ink` | White | — | Action principale |
| Secondary | Transparent | Ink | 2px solid Ink | Action secondaire |
| Gold | `--gold` | Ink | — | CTA final |
| Invest | `--ink` | White | — | Sur carte propriété |
| Full (complet) | `--muted` | White | — | Bien 100% financé |

Tous : `border-radius: 2rem`, `font-weight: 700`, `transition: transform .15s` (translateY -2px au hover).

### Cartes Valeur Proposition

```
Background : White
Border : 1px solid rgba(0,0,0,.07)
Border-radius : 2rem
Padding : 2rem 1.8rem
Hover : translateY(-6px) + box-shadow
Icône : 52×52px, border-radius 1.25rem, fond coloré pastel par carte
```

Icônes et fonds pastel associés :
- Sélection premium 🏝️ → `#FEF3C7`
- Rendements 📈 → `#D1FAE5`
- Sécurité 🔒 → `#EDE9FE`
- Liquidité 💱 → `#FEE2E2`
- Expertise locale 🌏 → `#E0F2FE`
- Dashboard 📊 → `#F0FDF4`

### Cartes Propriété (carrousel)

```
Largeur fixe : 340px
Border-radius : 2rem
Image : 210px de haut, object-fit: cover
Tag type : position absolute top-left, fond White, border-radius 2rem
Barre de financement : 4px en bas de l'image, fond Gold
Corps : padding 1.4rem
Métriques : grille 3 colonnes, fond Cream, border-radius .6rem
Barre de progression : 6px, gradient Teal → Gold
```

Données affichées sur chaque carte :
1. Photo + tag localisation/type
2. Nom + ville
3. Rendement annuel · Investissement minimum · Durée
4. Barre de progression financement + pourcentage
5. Bouton "Investir maintenant"

### Section "Comment ça marche"

```
Background : --ink (fond sombre)
Texte : White / rgba(255,255,255,.6)
Étapes : grille 4 colonnes
Numéros : cercles 4rem, gradient Gold
Ligne de connexion : position absolute, gradient Gold → Teal
```

### Bande Chiffres Clés

```
Background : gradient 135deg --teal-dk → --teal
Grille : 4 colonnes
Chiffre : 2.5rem, font-weight 800, White
Unité : Gold Light
Description : .85rem, rgba(255,255,255,.65)
```

---

## Effets & Animations

| Effet | Valeur |
|---|---|
| Shadow carte | `0 8px 40px rgba(0,0,0,.14)` |
| Shadow légère | `0 4px 20px rgba(0,0,0,.08)` |
| Hover lift | `translateY(-6px)` |
| Hover btn | `translateY(-2px)` |
| Transition standard | `0.2s ease` |
| Carrousel | `transform .5s cubic-bezier(.25,.1,.25,1)` |
| Auto-avance carrousel | `4500ms` |
| Backdrop blur navbar | `blur(18px)` |

---

## Propriétés du carrousel

- **Largeur carte :** 340px
- **Gap :** 24px (1.5rem)
- **Pas de défilement :** `cardWidth + gap = 364px`
- **Auto-avance :** pause au survol, reprise au mouseleave
- **Touch/swipe :** seuil 50px
- **Indicateurs :** dots — inactif `8px` rond, actif `24px` pilule Gold

---

## Breakpoints responsive

| Point | Comportement |
|---|---|
| `≤ 1024px` | Hero 1 colonne, visuel hero masqué, VP 2 colonnes, steps 2×2 |
| `≤ 640px` | VP 1 colonne, nav links masqués, steps 1 colonne, footer centré |

---

## Propriétés exemple (données mock)

| Bien | Type | Ville | Rendement | Min. | Durée | Financement |
|---|---|---|---|---|---|---|
| The Coconut Residences | Villa | Rawai, Phuket | 10.2% | 500€ | 36 mois | 87% |
| Samui Azure Villas | Resort | Chaweng, Koh Samui | 11.5% | 1 000€ | 24 mois | 62% |
| Sky Loft Sukhumvit | Condo | Sukhumvit, Bangkok | 8.8% | 500€ | 48 mois | 100% |
| Nimman Heritage Hotel | Boutique Hotel | Chiang Mai | 9.5% | 2 000€ | 60 mois | 38% |
| Coral Bay Residence | Résidence | Jomtien, Pattaya | 12.1% | 500€ | 30 mois | 55% |
| Railay Eco Bungalows | Eco-resort | Railay, Krabi | 10.8% | 500€ | 42 mois | 22% |

---

## Chiffres clés affichés (hero & trust band)

- Rendement annuel moyen : **8–12%**
- Investissement minimum : **500 €**
- Investisseurs actifs : **2 400+**
- Total financé : **18 M€**
- Propriétés financées : **42**
- Rendement moyen constaté : **10.4%**

---

## Structure des sections (ordre de la page)

1. Navbar (fixe)
2. Hero — pitch + stats + visuel carte
3. Valeur Proposition — 6 cartes
4. Comment ça marche — 4 étapes (fond sombre)
5. Chiffres clés — bande teal
6. Carrousel propriétés
7. CTA final
8. Footer
