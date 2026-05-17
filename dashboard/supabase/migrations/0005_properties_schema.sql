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
