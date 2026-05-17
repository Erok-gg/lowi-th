# RLS Audit — état actuel + correctifs requis

**Date** : 2026-05-17
**Project Supabase** : `ewtykeltwurubmyfrfmo` (Lowi)
**Audité avant** : Sprint 1 (correctifs RLS)

---

## TL;DR

Contrairement à mon hypothèse initiale, **RLS est déjà activée sur toutes les tables `public.*` et la plupart des policies sont correctes**. Un event trigger `ensure_rls` (fonction `rls_auto_enable`) active RLS automatiquement sur toute nouvelle table créée dans `public`.

**5 trous de sécurité majeurs sont identifiés** sur les tables `waitlist`, `audit_logs`, `bin`, `permissions`, `signup_attempts`. Ils sont corrigés dans la migration `0002_fix_rls_holes.sql`.

---

## 1. Mapping routes API → clients Supabase → tables

| Route | Méthode(s) | Client(s) | Tables touchées | Risque si RLS mal configurée |
|---|---|---|---|---|
| `/api/identity` | GET, POST | `server` (cookies) + import `admin` (inutilisé sur GET) | `identity_profiles` | Lecture/écriture d'identités d'autres users |
| `/api/setup` | POST | `admin` only | `profiles` | One-time, secret-protégé — RAS |
| `/api/signup` | POST | `server` | `signup_attempts`, `waitlist`, `audit_logs` | Lire les signups d'autres IPs |
| `/api/invest/reserve` | POST | `server` + import `admin` (inutilisé) | `reservations` | Lecture/écriture de réservations d'autres users |
| `/api/invest/availability` | GET | `admin` only (bypass RLS) | `reservations` | RAS (admin client) |
| `/api/invest/exchange-rate` | GET | aucun Supabase | — | RAS |
| `/api/admin/waitlist` | GET | `server` (check superadmin via `profiles`) | `waitlist` | **TROU : tout authenticated peut lire** |
| `/api/admin/waitlist/approve/[id]` | POST | `server` + `admin` | `profiles`, `waitlist`, `audit_logs` | TROU waitlist/audit_logs |
| `/api/admin/waitlist/reject/[id]` | POST | `server` | `profiles`, `waitlist`, `audit_logs` | TROU waitlist/audit_logs |
| `/api/kyc/upload` | POST | `server` + `admin` | `identity_profiles`, `kyc_submissions`, `kyc_documents` | OK (policies user_id) |
| `/api/kyc/submit` | POST | `server` + `admin` | `identity_profiles`, `kyc_submissions` | OK |
| `/api/kyc/status` | GET | `server` + `admin` | `kyc_submissions` | OK |
| `/api/admin/kyc` | GET | `server` + `admin` | `profiles`, `kyc_submissions` | OK |
| `/api/admin/kyc/[id]` | GET | `server` + `admin` | `profiles`, `kyc_submissions` | OK |
| `/api/admin/kyc/[id]/approve` | POST | `server` + `admin` | `profiles`, `kyc_submissions`, `audit_logs` | TROU audit_logs |
| `/api/admin/kyc/[id]/reject` | POST | `server` + `admin` | `profiles`, `kyc_submissions`, `audit_logs` | TROU audit_logs |
| `/api/admin/identity/[userId]` | GET | `server` + `admin` | `profiles`, `identity_profiles` | OK |

**Observation** : plusieurs routes importent `admin` sans l'utiliser. Cleanup à faire en sprint séparé.

---

## 2. État RLS par table

Pour chaque table : policies existantes, verdict, action.

### `profiles` ✅ OK (après migration 0003)
- `own profile read` : `SELECT WHERE auth.uid() = id`
- `service insert` : `INSERT WITH CHECK true` (utilisé par trigger `handle_new_user`)
- ~~`superadmin all`~~ → remplacée par `superadmin all profiles` qui utilise `public.is_superadmin()` (migration 0003)

**Bug critique catché en Sprint 1** : la policy initiale `superadmin all` faisait un sub-select sur `profiles` lui-même → **infinite recursion** quand un user authenticated accède à une table protégée (la policy de la table fait `EXISTS (SELECT FROM profiles)` → policy `superadmin all` sur profiles → boucle).

**Fix appliqué** (migration 0003) : fonction `SECURITY DEFINER public.is_superadmin(uid uuid)` qui bypasse RLS pour le lookup. Toutes les policies "superadmin" remplacées pour utiliser cette fonction.

### `identity_profiles` ✅ OK
- `users_own_identity` : `ALL WHERE user_id = auth.uid()`
- `superadmin_all_identity` : `ALL WHERE EXISTS (... is_superadmin)`

### `kyc_submissions` ✅ OK
- `users_own_kyc_submission` : `ALL WHERE user_id = auth.uid()`
- `superadmin_all_kyc_submissions` : idem

### `kyc_documents` ✅ OK
- `users_own_kyc_documents` : `ALL WHERE user_id = auth.uid()`
- `superadmin_all_kyc_documents` : idem

### `reservations` ✅ OK
- `users_own_reservations` : `ALL WHERE user_id = auth.uid()`
- `superadmin_all_reservations` : idem

### `waitlist` ❌ TROU MAJEUR
- `authenticated read` : `SELECT WHERE auth.role() = 'authenticated'`
- `authenticated write` : `ALL WHERE auth.role() = 'authenticated'`

**Problème** : n'importe quel user connecté peut **lire et modifier** toute la waitlist (codes d'invitation, IPs, emails de tous les futurs invités).

**Correctif** (migration 0002) :
- DROP les 2 policies
- Garder uniquement : superadmin tout + insert anonyme pour `/api/signup` (route non authentifiée)
- Ajouter policy `anon insert` : `INSERT WITH CHECK true` (signup public)

### `audit_logs` ❌ TROU MAJEUR
- `authenticated insert` : `INSERT WITH CHECK auth.role() = 'authenticated'`
- `authenticated read` : `SELECT WHERE auth.role() = 'authenticated'`

**Problème** : tout user connecté peut lire **tous** les audit logs (actions admin, IPs, métadonnées). Fuite massive d'information opérationnelle.

**Correctif** (migration 0002) :
- DROP `authenticated read`
- Ajouter `superadmin read` : `SELECT WHERE EXISTS (... is_superadmin)`
- Garder `authenticated insert` (les routes user doivent pouvoir logger leurs propres actions, mais idéalement avec une `WITH CHECK (actor_id = auth.uid())`)

### `bin` ❌ TROU
- `authenticated all` : `ALL WHERE auth.role() = 'authenticated'`

**Problème** : tout user connecté peut lire/écrire/supprimer dans la corbeille (qui contient des snapshots d'éléments supprimés par admin).

**Correctif** (migration 0002) :
- DROP `authenticated all`
- Ajouter `superadmin all` uniquement

### `permissions` ❌ TROU
- `own read` : `SELECT WHERE user_id = auth.uid()` ✅
- `admin write` : `ALL WHERE auth.role() = 'authenticated'` ❌ (mal nommée, en fait c'est `authenticated all`)

**Problème** : tout user connecté peut s'auto-accorder des permissions (`INSERT (user_id = my_id, level = 'edit', folder_key = 'projects')`).

**Correctif** (migration 0002) :
- DROP `admin write`
- Ajouter `superadmin write` : `ALL WHERE EXISTS (... is_superadmin)`
- Garder `own read`

### `signup_attempts` ❌ TROU
- `anon insert` : `INSERT WITH CHECK true` ✅ (signup public)
- `authenticated read` : `SELECT WHERE auth.role() = 'authenticated'` ❌

**Problème** : tout user connecté peut lire les IPs/emails des tentatives de signup (info opérationnelle sensible).

**Correctif** (migration 0002) :
- DROP `authenticated read`
- Ajouter `superadmin read`

---

## 3. Plan d'action

### Sprint 0 ✅
- `RLS_AUDIT.md` (ce fichier)
- `migrations/0001_init_existing.sql` : snapshot fidèle de l'existant
- `migrations/0002_fix_rls_holes.sql` : correctifs préparés

### Sprint 1 ✅
- ✅ Refactor `dashboard/app/api/signup/route.ts` (3 opérations sur admin client)
- ✅ Migration 0002 appliquée (correctifs trous RLS)
- ✅ **Migration 0003 appliquée** (`is_superadmin()` SECURITY DEFINER — fix infinite recursion catché pendant les tests)
- ✅ Tests A/B passés :
  - User authenticated non-superadmin : 0 lignes visibles sur toutes les tables protégées
  - Superadmin : voit tout
  - Anon : ne peut PAS lire waitlist/audit_logs/signup_attempts
  - User authenticated : NE PEUT PAS insérer dans permissions (escalation bloquée)
  - `/api/signup` post-fix : OK signup, OK dédup 409, OK rate limit 429
- ✅ Migration 0004 appliquée (buckets `property-photos`, `property-kyb` + policies superadmin minimales)

### Sprint 2 ✅
- ✅ `dashboard/lib/id-generator.ts` créé (nanoid 5.x, `customAlphabet`, base32 sans 0/1/l/o)
- ✅ Migration 0005 appliquée (`properties_schema`) :
  - Fonction `public.generate_short_id(prefix, len)` VOLATILE plpgsql
  - `profiles.public_id` (text UNIQUE) + trigger `profiles_set_public_id` + backfill existants
  - Table `properties` (12 colonnes + triggers `properties_set_public_id` + `properties_updated_at`)
  - Table `property_photos` (position, dimensions, storage_path)
  - Table `property_kyb_documents` (4 doc_types, status pending/approved/rejected, reviewed_by)
  - RLS activée sur les 3 nouvelles tables, policies complètes
- ✅ Tests passés :
  - Backfill : 0 profiles sans public_id — `usr_bwpp3nqm`, `usr_yc4csddz`
  - Trigger prop_xxx : insert → `prop_ymx8xhrm`, status=`lead`
  - RLS non-owner (uuid random) → 0 lignes
  - RLS owner (superadmin) → 1 ligne
  - Cleanup : test property supprimée

---

## 5. Dépendances code → migration 0002 (catché en audit Sprint 0)

L'application de `0002_fix_rls_holes.sql` ne doit PAS être faite avant d'avoir refactor `/api/signup`.

**Fichier** : `dashboard/app/api/signup/route.ts`

**Problème** : la route utilise `createClient()` (cookies, anon ou authenticated) pour des opérations qui après correctif RLS deviennent bloquées pour `anon` :

| Ligne | Opération | Status après 0002 | Conséquence |
|---|---|---|---|
| 32-37 | `SELECT count FROM signup_attempts WHERE ip_address=...` | Bloqué pour anon | **Rate limit cassé silencieusement** (count toujours 0, on continue à insérer) |
| 49-53 | `SELECT id, status FROM waitlist WHERE email=...` | Bloqué pour anon | Check "email déjà inscrit" toujours faux → doublons possibles via upsert |
| 67-74 | `UPSERT waitlist ON CONFLICT(email)` | INSERT OK, UPDATE bloqué | 500 silencieux si email existe déjà en waitlist |
| 79-85 | `INSERT audit_logs` (actor_id null) | OK via policy "anon insert logs" | RAS |

**Fix attendu en Sprint 1** :
```typescript
// dashboard/app/api/signup/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
// ...
const admin = createAdminClient()
// Remplacer les 3 opérations bloquées :
//  - admin.from('signup_attempts').select(...)
//  - admin.from('waitlist').select(...)
//  - admin.from('waitlist').upsert(...)
// Conserver `supabase` (client server) pour audit_logs insert
```

C'est sémantiquement correct : `/api/signup` est une route publique non-authentifiée qui doit pouvoir opérer sur des tables sensibles. L'usage de `admin` (service_role) est légitime ici, car la logique est strictement contrôlée côté serveur (validation email, rate limit IP, etc.).

---

## 4. Notes opérationnelles

- L'event trigger `ensure_rls` est fiable : il activera RLS sur les futures tables `properties`, `property_photos`, `property_kyb_documents` du Sprint 2 sans intervention manuelle. **Penser à écrire les policies explicitement** car RLS activée sans policy = tout bloqué.
- `handle_new_user()` (SECURITY DEFINER) crée automatiquement un `profiles` row à chaque insert dans `auth.users` — pas besoin d'insert manuel côté Next.js.
- Aucun bucket Storage n'existe à ce jour (`storage.buckets` vide).
- `dashboard/AGENTS.md` indique que la version de Next.js installée a des breaking changes par rapport au training data. **Toujours consulter `node_modules/next/dist/docs/` avant d'écrire du code Next.js dans ce repo.**
