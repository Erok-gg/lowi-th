# Sprint 2 — Schema properties + IDs Stripe-style

**Modèle recommandé** : Sonnet 4.6 pour exécution (SQL déclaratif + helper TS, peu de décisions). Switcher en Opus 4.7 pour l'audit en fin de sprint (règle projet : voir [memory/feedback_lowi_sprint_workflow.md](../../../../../.claude/projects/C--Users-schoe---FILES---Github-lowi/memory/feedback_lowi_sprint_workflow.md)).

**État entrée sprint** :
- Branch git : `feat/platform-v2`
- Migrations DB existantes : 0001 init, 0002 fix RLS holes, 0003 is_superadmin function, 0004 storage buckets
- RLS active et fonctionnelle. Fonction `public.is_superadmin()` SECURITY DEFINER disponible pour toutes les policies.
- Bucket Storage `property-photos` (public, 10MB) et `property-kyb` (privé, 25MB) créés avec policies superadmin uniquement.
- Project Supabase ID : `ewtykeltwurubmyfrfmo`
- 2 profiles existants : `schoenauer.anthony@gmail.com` (superadmin) + `demo@lowi-invest.com`

**⚠️ Lire avant de coder** : [dashboard/AGENTS.md](../AGENTS.md) — la version Next.js de ce repo a des breaking changes vs training data. Consulter `node_modules/next/dist/docs/` avant tout code Next.js. Pas applicable au Sprint 2 (pas de code Next.js), mais à retenir.

---

## Livrables Sprint 2

### 1. Helper TypeScript `dashboard/lib/id-generator.ts`
Fonction qui génère des IDs Stripe-style : `usr_xxxxxxxx`, `prop_xxxxxxxx` (8 chars base32 lowercase, exclut `0`, `1`, `l`, `o` pour éviter confusion).

```typescript
// Convention : préfixe + '_' + 8 chars [a-z2-9] (32 chars base) sauf 0,1,l,o
// → ~10^12 combinaisons, négligeable de collision pour <1M users
// Si scale >10M plus tard, passer à 12 chars
import { customAlphabet } from 'nanoid'

const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz' // 32 chars, exclut 0,1,l,o
const generate = customAlphabet(ALPHABET, 8)

export function generateUserId(): string {
  return `usr_${generate()}`
}

export function generatePropertyId(): string {
  return `prop_${generate()}`
}
```

Ajouter `nanoid` aux dépendances : `cd dashboard && npm install nanoid`.

### 2. Migration 0005 — public_id sur profiles + tables properties

À appliquer via MCP `apply_migration` avec name `properties_schema`. SQL à mettre AUSSI dans `dashboard/supabase/migrations/0005_properties_schema.sql` (versioning local).

```sql
-- ===========================================================================
-- 0005 — public_id sur profiles + tables properties (Sprint 2)
-- ===========================================================================

-- ── Alphabet base32 sans 0, 1, l, o ──
CREATE OR REPLACE FUNCTION public.generate_short_id(prefix text, len int DEFAULT 8)
  RETURNS text
  LANGUAGE plpgsql
  VOLATILE
AS $$
DECLARE
  alphabet text := '23456789abcdefghijkmnpqrstuvwxyz';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..len LOOP
    result := result || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  END LOOP;
  RETURN prefix || '_' || result;
END;
$$;

-- ── profiles : ajouter public_id usr_xxx ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_id text UNIQUE;

-- Trigger : génère usr_xxx à l'INSERT si null. Retry si collision (unlikely).
CREATE OR REPLACE FUNCTION public.profiles_set_public_id()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.public_id IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    candidate := public.generate_short_id('usr');
    BEGIN
      NEW.public_id := candidate;
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts > 5 THEN RAISE EXCEPTION 'Failed to generate unique public_id'; END IF;
    END;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_public_id ON public.profiles;
CREATE TRIGGER profiles_set_public_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_public_id();

-- Backfill : générer public_id pour les profiles existants
UPDATE public.profiles SET public_id = public.generate_short_id('usr') WHERE public_id IS NULL;

-- ── properties : leads de soumission ──
CREATE TABLE public.properties (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id           text UNIQUE NOT NULL,
  submitted_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'lead'
                        CHECK (status = ANY (ARRAY['lead','reviewing','accepted','rejected','active','closed'])),
  title               text NOT NULL,
  description         text,
  location_city       text,
  location_country    text DEFAULT 'TH',
  property_type       text,
  estimated_value_thb bigint,
  surface_sqm         integer,
  bedrooms            integer,
  contact_email       text,
  admin_notes         text,
  kyb_requested_at    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.properties_set_public_id()
  RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.public_id IS NOT NULL AND NEW.public_id <> '' THEN RETURN NEW; END IF;
  LOOP
    candidate := public.generate_short_id('prop');
    BEGIN
      NEW.public_id := candidate;
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts > 5 THEN RAISE EXCEPTION 'Failed to generate unique public_id'; END IF;
    END;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS properties_set_public_id ON public.properties;
CREATE TRIGGER properties_set_public_id
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.properties_set_public_id();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX properties_submitted_by_idx ON public.properties (submitted_by);
CREATE INDEX properties_status_idx ON public.properties (status);

-- ── property_photos ──
CREATE TABLE public.property_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position     integer DEFAULT 0,
  width        integer,
  height       integer,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX property_photos_property_idx ON public.property_photos (property_id, position);

-- ── property_kyb_documents ──
CREATE TABLE public.property_kyb_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  doc_type          text NOT NULL
                      CHECK (doc_type = ANY (ARRAY['passport','title_deed','company_dbd','director_nomination'])),
  storage_path      text NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status = ANY (ARRAY['pending','approved','rejected'])),
  rejection_reason  text,
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES auth.users(id)
);

CREATE INDEX property_kyb_property_idx ON public.property_kyb_documents (property_id);

-- ── RLS (auto-activée par event trigger ensure_rls, déclarée explicitement) ──
ALTER TABLE public.properties             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_kyb_documents ENABLE ROW LEVEL SECURITY;

-- properties : user lit/écrit ses lignes tant que lead/reviewing
CREATE POLICY "users own properties draft" ON public.properties
  FOR ALL
  USING (submitted_by = auth.uid() AND status IN ('lead','reviewing'))
  WITH CHECK (submitted_by = auth.uid() AND status IN ('lead','reviewing'));

CREATE POLICY "users read own properties any status" ON public.properties
  FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "public read active properties" ON public.properties
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "superadmin all properties" ON public.properties
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- property_photos : via join sur properties.submitted_by
CREATE POLICY "users own property photos" ON public.property_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('lead','reviewing')
    )
  );

CREATE POLICY "public read photos of active properties" ON public.property_photos
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.status = 'active')
  );

CREATE POLICY "superadmin all property_photos" ON public.property_photos
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- property_kyb_documents : user upload après acceptation, admin review
CREATE POLICY "users own kyb docs after acceptance" ON public.property_kyb_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = auth.uid()
        AND p.status = 'accepted'
    )
  );

CREATE POLICY "superadmin all kyb docs" ON public.property_kyb_documents
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
```

---

## Vérification end-to-end Sprint 2

À exécuter via MCP `execute_sql` après la migration.

```sql
-- 1. Trigger usr_xxx fonctionne (les 2 profiles existants ont reçu un public_id)
SELECT email, public_id FROM public.profiles WHERE public_id IS NULL;
-- Attendu : 0 row

SELECT email, public_id FROM public.profiles;
-- Attendu : 2 rows, public_id matche /^usr_[a-z2-9]{8}$/

-- 2. Trigger prop_xxx (créer test property)
INSERT INTO public.properties (title, submitted_by)
  VALUES ('Test villa Sprint 2', (SELECT id FROM public.profiles WHERE is_superadmin = true LIMIT 1))
  RETURNING id, public_id, status;
-- Attendu : public_id matche /^prop_[a-z2-9]{8}$/, status = 'lead'

-- 3. RLS user authenticated non-owner ne voit pas la lead
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"00000000-0000-0000-0000-000000000099","role":"authenticated"}';
SELECT count(*) FROM public.properties; -- attendu : 0
ROLLBACK;

-- 4. RLS user authenticated owner voit ses leads
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"b89d922e-d4b5-4085-b71f-46c4b23f54fb","role":"authenticated"}';
SELECT count(*) FROM public.properties; -- attendu : 1 (superadmin voit aussi via "superadmin all")
ROLLBACK;

-- 5. Cleanup test
DELETE FROM public.properties WHERE title = 'Test villa Sprint 2';
```

Si tous les tests passent, marquer Sprint 2 ✅ dans [lowi-platform-plan.md](../../../lowi-platform-plan.md).

---

## Audit Sprint 2 (à faire en Opus)

Une fois Sprint 2 livré, switcher en Opus et auditer :
1. **Code review** : helper `id-generator.ts` — alphabet correct, pas de leak, exports OK
2. **SQL review** : la migration peut être appliquée 2x sans erreur (idempotence sur les CREATE TABLE → utiliser CREATE TABLE IF NOT EXISTS si pertinent ; ou bien laisser l'erreur si retry)
3. **RLS** : tester chaque policy en injectant des JWT factices (pattern Sprint 1)
4. **Triggers** : insérer un profil et une propriété, vérifier que `public_id` est bien généré
5. **Régression** : `/users`, `/users/waitlist`, `/submissions/kyc` toujours OK
6. **Bugs latents** à chercher : 
   - Triggers `properties_set_public_id` et `properties_updated_at` cohabitent — ordre d'exécution ?
   - Le backfill `UPDATE profiles SET public_id = generate_short_id('usr')` peut générer des doublons (random sans check unique). Si la table avait >1000 rows, possible.
7. **Mettre à jour [lowi-platform-plan.md](../../../lowi-platform-plan.md)** et [RLS_AUDIT.md](RLS_AUDIT.md) avec ce qui a été livré

---

## Démarrage Sonnet — commandes

```bash
# Branche git déjà créée (feat/platform-v2), continuer dessus
# Installer la dépendance
cd dashboard && npm install nanoid

# Ouvrir le brief et exécuter
# Le contexte conversation est conservé entre /model — Sonnet voit tout l'historique
```

Quand Sprint 2 livré → `/model opus` → "audite Sprint 2".
