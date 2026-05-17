# Plan révisé — LOWI : plateforme unifiée Next.js (vitrine + dashboard + soumission propriétés)

## Contexte

LOWI part de :
- **Vitrine HTML statique** à la racine du repo (zéro auth, propriétés Chalok hardcodées)
- **Dashboard Next.js 14** ([dashboard/](dashboard/)) avec auth Supabase, KYC investisseur via Google Drive, workflow admin pour KYC + waitlist
- **Tables Supabase** : `profiles`, `waitlist`, `identity_profiles`, `kyc_submissions`, `kyc_documents`, `reservations` — toutes créées via UI Supabase, **aucune migration SQL versionnée**, **aucune RLS** (faille majeure : tout dépend des guards applicatifs Next.js)

L'utilisateur veut transformer LOWI en plateforme unifiée :
- **Migration vitrine HTML → Next.js** (option (b) RealT/Brickken : tout sous le même runtime)
- Inscription user avec **email vérifié** (magic link Supabase), pas de téléphone, **boutons OAuth Google/Facebook grisés** (UI prête, brancher plus tard)
- Users loggés peuvent **soumettre une propriété comme lead** (free submission + warning que les docs KYB seront demandés à l'acceptation)
- **Système KYB documents** déclenché côté admin quand une soumission est acceptée pour proposition : passeport (si pas déjà KYC), title deed, Company DBD (<3 mois), director nomination
- Identifiants internes courts (`usr_xxx`, `prop_xxx`)
- Photos propriétés dans **Supabase Storage** (re-encodage sharp, file d'attente si la charge grimpe)
- Réorganisation `/img` (assets site uniquement) et Google Drive (par `usr_xxx`)
- Sécurité contre attaques classiques : RLS, rate limit, validation, headers, anti-spam

**Risque #1 actuel** : aucune RLS. Pour l'éliminer sans casser l'existant, on **audite d'abord** chaque route API pour identifier quel client Supabase elle utilise (anon vs admin), puis on active RLS avec policies cohérentes.

---

## Décisions actées (validées par l'utilisateur)

| Sujet | Choix | Note |
|---|---|---|
| Vitrine | **Migration complète vers Next.js** dans la même app que le dashboard | Routes publiques `/`, `/projets`, `/comment-ca-marche`, etc. servies par le même runtime |
| Soumission propriété | **Free submission** + warning docs KYB demandés à l'acceptation | Sans blocage pour pas freiner l'inscription |
| Profil user | **Email seulement** (vérifié magic link), pas de téléphone | Boutons OAuth Google/Facebook UI prête mais désactivés |
| KYB à l'acceptation | Passport (si pas déjà KYC) + Title deed + Company DBD <3 mois + Director nomination | Tous PDF ou image |
| Storage photos | **Supabase Storage** | Re-encodage avec sharp ; si charge grimpe, file d'attente |
| IDs publics | **Stripe-style** `usr_xxx`, `prop_xxx` (8 chars nanoid base32) | |
| Migrations DB | **SQL versionnées** dans [dashboard/supabase/migrations/](dashboard/supabase/migrations/) | |
| RLS | **Audit avant activation**, puis policies testées par paires user A/B | |
| Rate limiting | **In-memory LRU pour MVP**, Upstash plus tard | |

---

## Schéma DB cible

### Table `profiles` — alter
```sql
ALTER TABLE profiles ADD COLUMN public_id text UNIQUE;        -- usr_xxx, généré par trigger
ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
-- email_verified : lu directement depuis auth.users.email_confirmed_at, pas dupliqué
-- PAS de colonne phone : décision actée
```

### Nouvelle table `properties` (soumissions = leads)
```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text UNIQUE NOT NULL,                    -- prop_xxx (trigger)
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'lead',               -- lead | reviewing | accepted | rejected | active | closed
  -- contenu de la soumission
  title text NOT NULL,
  description text,
  location_city text,
  location_country text DEFAULT 'TH',
  property_type text,                                -- villa | condo | hotel | land | ...
  estimated_value_thb bigint,
  surface_sqm integer,
  bedrooms integer,
  contact_email text,
  -- gestion admin
  admin_notes text,                                  -- privé, jamais exposé au soumetteur
  kyb_requested_at timestamptz,                      -- moment où l'admin a passé en 'accepted'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Nouvelle table `property_photos`
```sql
CREATE TABLE property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,                        -- prop_xxx/uuid.webp
  position integer DEFAULT 0,
  width integer,
  height integer,
  uploaded_at timestamptz DEFAULT now()
);
```

### Nouvelle table `property_kyb_documents` (déclenchée à l'acceptation)
```sql
CREATE TABLE property_kyb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  doc_type text NOT NULL,                            -- 'passport' | 'title_deed' | 'company_dbd' | 'director_nomination'
  storage_path text NOT NULL,                        -- bucket privé
  status text NOT NULL DEFAULT 'pending',            -- pending | approved | rejected
  rejection_reason text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);
```

### RLS — principe par table
- `profiles` : user lit/écrit son propre profil ; admin tout
- `properties` :
  - User lit/écrit ses lignes uniquement si `status IN ('lead', 'reviewing')`
  - Lecture publique des `status='active'` (limitée à colonnes whitelist via vue)
  - Admin tout
- `property_photos` / `property_kyb_documents` : RLS via join sur `properties.submitted_by`
- `kyc_*`, `identity_profiles`, `reservations` : user voit ses lignes ; admin tout
- `audit_logs` : admin uniquement

---

## Buckets Supabase Storage

| Bucket | Public | RLS write | Usage |
|---|---|---|---|
| `property-photos` | Public read | Owner de la `property` OU admin | Photos publiques |
| `property-kyb` | Privé (signed URLs) | Owner OU admin | Passport, title deed, DBD, director nomination |
| `user-avatars` | Public read | Owner uniquement | Optionnel sprint ultérieur |

**Path** : `{property.public_id}/{uuid}.{ext}` — UUID fichier aléatoire = pas d'énumération.

KYC investisseur reste sur **Google Drive** (audit trail compliance), avec convention `KYC/{usr_xxx}/` au lieu de `KYC/{prénom_nom}/`.

---

## Migration vitrine HTML → Next.js

La vitrine actuelle (`index.html`, `projets.html`, `a-propos.html`, etc.) est portée dans la même app Next.js que le dashboard. Structure cible :

```
dashboard/app/
  (public)/                              # nouveau group route — vitrine
    page.tsx                             # ex-index.html
    a-propos/page.tsx
    comment-ca-marche/page.tsx
    projets/
      page.tsx                           # liste dynamique depuis DB
      [publicId]/page.tsx                # ex-projet-chalok-villa.html, générique
    proposer/page.tsx                    # ex-proposer.html (formulaire signup + lead)
    layout.tsx                           # nav + footer vitrine
  (auth)/                                # déjà existant
  (investor)/                            # déjà existant
  (dashboard)/                           # déjà existant
  api/                                   # déjà existant
```

Assets statiques migrés vers `dashboard/public/img/` :
```
dashboard/public/img/
  site/                                  # logos, illustrations, icônes
  properties-featured/chalok/            # photos statiques propriété démo
  team/                                  # à venir
```

Toutes les images uploadées par les users vont dans **Supabase Storage**, jamais dans le repo.

L'ancien dossier `/img/` à la racine et les `.html` à la racine sont **supprimés** une fois la migration validée.

---

## Pages à créer / modifier

### Vitrine publique ([dashboard/app/(public)/](dashboard/app/(public)/))
| Route | Description |
|---|---|
| `/` | Landing (port direct ex-index.html, refonte en JSX) |
| `/a-propos` | Port direct |
| `/comment-ca-marche` | Port direct |
| `/projets` | Liste dynamique des `properties.status='active'` depuis DB |
| `/projets/[publicId]` | Détail propriété, données dynamiques |
| `/proposer` | Formulaire CTA → soumission propriété (force login si pas connecté) |

### Investor ([dashboard/app/(investor)/](dashboard/app/(investor)/))
| Route | Description |
|---|---|
| `/profile` | Nom, prénom, email (badge "vérifié"), nationalité. Boutons OAuth Google/Facebook **grisés**. |
| `/properties/new` | Formulaire soumission propriété + upload photos. Warning : docs KYB demandés à l'acceptation. |
| `/properties/mine` | Liste de mes soumissions avec statut |
| `/properties/[publicId]` | Détail soumission (édition tant que `lead`) |
| `/properties/[publicId]/kyb` | Apparaît si admin a passé en `accepted` : upload des 4 docs KYB |

### Admin ([dashboard/app/(dashboard)/](dashboard/app/(dashboard)/))
| Route | Description |
|---|---|
| `/properties` | Queue par statut, filtres, recherche par `public_id` |
| `/properties/[publicId]` | Détail complet (photos, contact, notes), actions de transition |
| `/properties/[publicId]/kyb` | Validation docs KYB un par un |
| `/users` (existant) | Ajouter colonnes `public_id` et email vérifié |

### API ([dashboard/app/api/](dashboard/app/api/))
| Route | Méthode | Auth |
|---|---|---|
| `/api/profile` | GET, PATCH | User |
| `/api/properties` | POST (create lead), GET (mine) | User |
| `/api/properties/[id]` | GET, PATCH, DELETE | Owner OR admin |
| `/api/properties/[id]/photos` | POST, DELETE | Owner OR admin |
| `/api/properties/[id]/kyb` | POST (upload doc), GET | Owner OR admin |
| `/api/public/properties` | GET (status=active uniquement) | Public |
| `/api/admin/properties` | GET (queue) | Admin |
| `/api/admin/properties/[id]/transition` | POST `{ status, notes }` | Admin |
| `/api/admin/properties/[id]/kyb/[docId]/review` | POST `{ decision, reason }` | Admin |

---

## Sécurité

### 1. RLS Supabase — workflow d'activation sans casse
1. **Audit** : pour chaque route API existante, noter quel client Supabase elle utilise (`anon`, `server` cookies, `admin` service-role) et quelles tables elle touche
2. **Documenter** dans `dashboard/supabase/RLS_AUDIT.md`
3. Écrire les policies par table en SQL
4. **Tester en staging** avec deux users : A ne doit JAMAIS voir les lignes de B
5. Activer en prod migration par migration

### 2. Rate limiting (middleware Next.js, LRU in-memory)
- `/api/signup` : 5/IP/heure
- `/api/properties` POST : 10/user/heure
- `/api/properties/*/photos` POST : 20/user/heure
- `/api/profile` PATCH : 30/user/heure
- Tous autres POST : 60/IP/min

### 3. Upload de fichiers
- Validation MIME **côté serveur via `file-type`** (magic bytes, pas Content-Type)
- Taille max : 10 Mo photo, 25 Mo doc KYB
- **Re-encodage avec `sharp`** : strip EXIF, convert webp, max 2400px
- Path randomisé (UUID)
- Quota : 20 photos max par propriété
- **File d'attente** : si la charge CPU sharp dépasse seuil (ex >70% sur Vercel function), router vers une queue (BullMQ + Redis ou Supabase Edge Function). À implémenter **uniquement si nécessaire** après mesure réelle.

### 4. Validation input
- **Zod** sur toutes les API routes (body, query, params)
- Erreurs uniformes en prod : `{ error: "Invalid input" }`

### 5. Headers ([dashboard/next.config.js](dashboard/next.config.js))
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- `Content-Security-Policy` strict (script-src 'self' + Supabase + Drive + Google OAuth domains)
- `Referrer-Policy: strict-origin-when-cross-origin`

### 6. Anti-spam signup
- Honeypot field (input hidden, si rempli → reject silencieux)
- Rate limit IP
- Email domain blacklist (jetables open source)

### 7. Énumération
- `/api/identity` GET et lookups user → réponse uniforme (status code + payload identiques que l'user existe ou pas)

### 8. Audit logs
Étendre `audit_logs` pour : soumission propriété, transition statut, upload KYB, review KYB, accès admin à un KYC.

---

## Découpage en sessions Claude Pro (Opus 4.7)

Chaque sprint = **1 session** (~2-3h utiles). Chaque session a un livrable testable de bout en bout.

| # | Session | Livrable | Critère de réussite |
|---|---|---|---|
| **0** | **Audit RLS + migrations init** ✅ | `dashboard/supabase/RLS_AUDIT.md` listant chaque route API et son client + état RLS réel par table. `dashboard/supabase/migrations/0001_init_existing.sql` snapshot fidèle de l'existant. `0002_fix_rls_holes.sql` préparé. | ✅ Audit livré. Découverte : RLS déjà partielle, 5 trous identifiés sur `waitlist`, `audit_logs`, `bin`, `permissions`, `signup_attempts`. |
| **1** | **Correctifs RLS + refactor /api/signup + buckets** ✅ | ✅ Refactor `app/api/signup/route.ts` (3 ops sur admin). ✅ Migration 0002 (correctifs trous). ✅ **Migration 0003 (bug critique catché : infinite recursion → `is_superadmin()` SECURITY DEFINER)**. ✅ Migration 0004 (buckets `property-photos` 10MB public + `property-kyb` 25MB privé). Tests A/B passés, dashboard admin régression OK. | ✅ Tous les tests passent. User authenticated non-superadmin voit 0 lignes sur tables protégées. /api/signup fonctionne (200/409/429). Bug latent critique éliminé. |
| **2** | **Schema properties + IDs** ✅ | ✅ `lib/id-generator.ts` (nanoid base32). ✅ Migration 0005 (`generate_short_id`, `profiles.public_id` + backfill, tables `properties`/`property_photos`/`property_kyb_documents`, triggers `usr_xxx`/`prop_xxx`, RLS complète). | ✅ Backfill OK (0 NULL). Trigger `prop_xxx` testé. RLS non-owner → 0 lignes. Owner → 1 ligne. |
| **3a** | **Migration vitrine partie 1** | Setup route group `(public)/`, layout, port de `/` (landing) et `/a-propos`. Assets dans `dashboard/public/img/site/`. | Vitrine `/` et `/a-propos` rendues en Next.js, visuellement identiques. |
| **3b** | **Migration vitrine partie 2** | Port de `/comment-ca-marche`, `/projets` (statique pour l'instant avec Chalok hardcodé), `/projets/[publicId]`. Suppression des `.html` racine. | Toutes les pages vitrine fonctionnent en Next.js. Ancienne vitrine archivée. |
| **4** | **Page profil + email verify + OAuth UI** | `/profile` complète. Email verification flow Supabase activé. Boutons Google/Facebook grisés en UI. | User connecté voit/édite son profil. Email non vérifié = bandeau. Boutons OAuth présents disabled. |
| **5** | **Soumission propriété (form + photos)** | `/properties/new`, `/properties/mine`, `/properties/[id]`. Upload photos via `/api/properties/[id]/photos` avec sharp + file-type. | User soumet propriété + 5 photos. Lead visible en DB avec `prop_xxx`. Photos en bucket. |
| **6** | **Queue admin + transitions** | `/admin/properties` listing avec filtres. `/admin/properties/[id]` détail. API transition. Audit log. | Admin voit queue, accepte un lead → status `accepted`, `kyb_requested_at` rempli, audit log écrit. |
| **7** | **Système KYB** | Page investor `/properties/[id]/kyb` apparaît si `status='accepted'`. Upload 4 docs (passport, title deed, DBD, director nomination) vers `property-kyb` privé. Admin review par doc. | Cycle complet : admin accepte → user upload 4 docs → admin valide → propriété peut passer `active`. |
| **8** | **Liste publique propriétés dynamique** | `/projets` fetch `status='active'` depuis DB. `/projets/[publicId]` détail dynamique avec photos depuis Storage. Vue publique côté SQL. | Page publique liste les propriétés actives sans révéler de données privées. |
| **9** | **Réorg Drive + script migration** | [dashboard/lib/google-drive.ts](dashboard/lib/google-drive.ts) adapté pour naming `usr_xxx`. Script one-shot `scripts/migrate-drive-naming.ts` renomme l'existant. | Drive renommé sans perte, KYC existants pointent vers nouveau path. |
| **10** | **Sécurité globale** | Rate limit middleware. Headers next.config. Zod sur toutes routes. Honeypot signup. Réponses énumération uniformisées. | Tests pentest basiques passent (voir vérification). |
| **11** (cond.) | **File d'attente sharp** | Si métriques sprint 5 montrent CPU saturé : BullMQ + Redis ou Supabase Edge Function pour offload. | Upload de 20 photos en parallèle ne fait pas timeout la function. |

**Total minimal : 11 sessions** (12 si sprint 11 nécessaire).

Chaque session livre un état Git committable et déployable. Pas de session qui dépend d'un travail à moitié fait d'une session précédente.

---

## Fichiers critiques

| Fichier | Action |
|---|---|
| `dashboard/supabase/migrations/` | **À créer** (versionning SQL) |
| `dashboard/supabase/RLS_AUDIT.md` | **À créer** sprint 0 |
| `dashboard/lib/id-generator.ts` | **À créer** — nanoid base32 + préfixes |
| `dashboard/lib/storage.ts` | **À créer** — wrapper upload (file-type + sharp + path) |
| `dashboard/lib/rate-limit.ts` | **À créer** — LRU in-memory |
| `dashboard/lib/validation/` | **À créer** — schémas Zod par domaine |
| [dashboard/proxy.ts](dashboard/proxy.ts) | Étendre : headers sécurité, rate limit hooks |
| [dashboard/next.config.js](dashboard/next.config.js) | Headers sécurité, CSP |
| `dashboard/app/(public)/` | **À créer** — vitrine portée |
| `dashboard/app/(investor)/profile/page.tsx` | **À créer** |
| `dashboard/app/(investor)/properties/` | **À créer** |
| `dashboard/app/(dashboard)/properties/` | **À créer** |
| `dashboard/app/api/profile/route.ts` | **À créer** |
| `dashboard/app/api/properties/` | **À créer** |
| `dashboard/app/api/admin/properties/` | **À créer** |
| `dashboard/app/api/public/properties/route.ts` | **À créer** |
| [dashboard/lib/google-drive.ts](dashboard/lib/google-drive.ts) | Adapter naming `usr_xxx` |
| `dashboard/public/img/` | **À créer** (assets migrés depuis racine `/img`) |
| `/index.html` + autres `.html` racine | **À supprimer** sprint 3b |
| `/img/` (racine) | **À supprimer** sprint 3b après migration |

---

## Dépendances à ajouter

```
sharp                  # re-encodage images
file-type              # validation MIME
nanoid                 # IDs courts
zod                    # validation
@supabase/storage-js   # (probablement déjà via @supabase/supabase-js)
bullmq + ioredis       # OPTIONNEL sprint 11 si queue nécessaire
```

---

## Vérification end-to-end

### Sprint 0-1
- MCP Supabase `execute_sql` : avec user A connecté, `SELECT * FROM kyc_submissions WHERE user_id != 'A_id'` → 0 lignes
- Idem sur `reservations`, `identity_profiles`, `audit_logs`
- Toutes les routes API existantes répondent encore OK (régression zéro)

### Sprint 2
- Insert manuel dans `properties` → `public_id` auto-rempli avec `prop_xxx`
- Insert dans `profiles` → `public_id` auto-rempli avec `usr_xxx`

### Sprint 3a-3b
- Navigation manuelle sur toutes les pages portées : visuel identique à l'ancien HTML
- Aucun lien cassé (404)
- Lighthouse : performance ≥ ancien HTML

### Sprint 4
- Inscription nouvelle → email reçu → click magic link → email vérifié
- Modification profil → persisté
- Click bouton Google/Facebook → no-op visible (curseur not-allowed)

### Sprint 5
- User soumet propriété + 5 photos en un seul flow
- Vérif DB : lead créé, photos en bucket avec re-encoding webp + EXIF stripped
- Tentative upload `.exe` renommé `.jpg` → rejeté
- Tentative upload 50 Mo → rejeté

### Sprint 6
- Admin queue affiche le lead du sprint 5
- Transition `lead → reviewing → accepted` : statuts mis à jour, `kyb_requested_at` rempli, audit log écrit

### Sprint 7
- User connecté voit `/properties/[id]/kyb` apparaître après acceptation
- Upload 4 docs, statuts `pending`
- Admin review : un doc rejeté → statut + raison visibles côté user
- Tous approuvés → admin peut passer `active`

### Sprint 8
- `/projets` affiche propriétés actives en SSR depuis DB
- Pas de données privées exposées (vérifier payload JSON)

### Sprint 9
- Script migration Drive : un dossier test `KYC/test_user` renommé en `KYC/usr_xxx` sans perte de fichiers

### Sprint 10
- `curl -X POST /api/signup` 10 fois en 5s → 5 OK, 5 réponses 429
- `curl -I /` : headers HSTS, CSP, X-Frame-Options présents
- `POST /api/identity` avec email connu vs inconnu → réponses identiques (status + payload)

### MCP utiles
- `mcp__922bc7c5-..__execute_sql` pour tester RLS rapidement
- `mcp__922bc7c5-..__list_tables` pour valider le schéma
- `mcp__922bc7c5-..__get_advisors` pour scan automatique des problèmes
- `mcp__Claude_Preview__preview_*` pour tester les pages

---

## Hors scope explicite

- **Marché secondaire** des parts (transferts NFT) → V2
- **Webhooks Airwallex** paiements → V2
- **Migration Sui testnet → mainnet** → V2
- **OAuth Google/Facebook fonctionnel** → UI préparée sprint 4, branchement plus tard
- **Notifications email** (autres que magic link) → V2
- **OTP SMS** → reporté, archi prête à l'accepter
- **Système ACL granulaire** documenté dans [lowi-dashboard.md](lowi-dashboard.md) → reporté, superadmin suffit pour MVP
- **Refonte du KYC investisseur** → ne pas toucher, fonctionne
