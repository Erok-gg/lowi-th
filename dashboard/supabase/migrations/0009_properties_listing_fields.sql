-- ===========================================================================
-- 0009 — Champs vitrine sur properties (Sprint 8)
-- ===========================================================================
-- Ajout des données nécessaires au rendu public riche (page /projets/[publicId]) :
-- TRI estimé, distribution, ticket, parts, bail, équipements, situation, juridique.
-- Tous nullables → pas de breaking sur les lignes existantes.
-- Saisie réservée à l'admin (RLS superadmin via UPDATE existant).
-- ===========================================================================

-- ── Financier ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS irr_pct                numeric(5,2),
  ADD COLUMN IF NOT EXISTS distribution_pct       numeric(5,2),
  ADD COLUMN IF NOT EXISTS min_ticket_thb         bigint,
  ADD COLUMN IF NOT EXISTS lease_years            integer,
  ADD COLUMN IF NOT EXISTS lease_remaining_years  integer,
  ADD COLUMN IF NOT EXISTS lease_expiry_year      integer,
  ADD COLUMN IF NOT EXISTS shares_total           integer,
  ADD COLUMN IF NOT EXISTS shares_sold            integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funding_status         text;

-- Contrainte funding_status (open / full / soon)
DO $$ BEGIN
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_funding_status_check
    CHECK (funding_status IS NULL OR funding_status = ANY (ARRAY['open','full','soon']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Contrainte shares cohérence
DO $$ BEGIN
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_shares_check
    CHECK (shares_total IS NULL OR shares_sold IS NULL OR (shares_sold >= 0 AND shares_sold <= shares_total));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Caractéristiques physiques ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS bathrooms        integer,
  ADD COLUMN IF NOT EXISTS pool_type        text,           -- 'private' | 'shared' | 'none'
  ADD COLUMN IF NOT EXISTS amenities        text[],         -- liste libre
  ADD COLUMN IF NOT EXISTS view_description text;

DO $$ BEGIN
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_pool_type_check
    CHECK (pool_type IS NULL OR pool_type = ANY (ARRAY['private','shared','none']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Situation ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS beach_access    text,
  ADD COLUMN IF NOT EXISTS airport_access  text,
  ADD COLUMN IF NOT EXISTS hospital_access text;

-- ── Structure juridique ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lease_type         text,
  ADD COLUMN IF NOT EXISTS trustee_name       text,
  ADD COLUMN IF NOT EXISTS arbitration_clause text,
  ADD COLUMN IF NOT EXISTS legal_note         text;

-- ── Mémo investisseur ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS investor_memo_url text;

-- Pas de RLS additionnelle : les policies existantes couvrent
-- (public read si status='active', superadmin all).
