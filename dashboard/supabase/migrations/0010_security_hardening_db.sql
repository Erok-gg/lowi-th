-- ===========================================================================
-- 0010 — Hardening sécurité DB (Sprint 10 post-audit)
-- ===========================================================================
-- Findings advisors Supabase :
--   1) 5 fonctions SECURITY DEFINER avec search_path mutable
--      → faille classique : un user peut créer un schema malicieux et tromper
--        la résolution de noms d'objets
--   2) handle_new_user / rls_auto_enable exposées via /rest/v1/rpc/* à anon
--      → REVOKE EXECUTE FROM anon, authenticated (réservées au trigger / admin)
--   3) is_superadmin(uuid) exposée RPC à authenticated → REVOKE (usage policies only)
--   4) audit_logs.actor_id manque un index (FK non indexée)
--   5) public_bucket_allows_listing sur property-photos : policy SELECT inutile
--      (URLs publiques marchent sans listing)
-- ===========================================================================

-- ── 1) search_path explicite sur toutes les fonctions SECURITY DEFINER ──────
ALTER FUNCTION public.generate_short_id(text, integer)         SET search_path = public, pg_temp;
ALTER FUNCTION public.profiles_set_public_id()        SET search_path = public, pg_temp;
ALTER FUNCTION public.properties_set_public_id()      SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at()             SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()               SET search_path = public, pg_temp;
ALTER FUNCTION public.is_superadmin(uuid)                 SET search_path = public, pg_temp;
ALTER FUNCTION public.rls_auto_enable()               SET search_path = public, pg_temp;

-- ── 2) REVOKE RPC public sur fonctions internes ─────────────────────────────
-- handle_new_user : trigger uniquement, jamais appelé en RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user()             FROM anon, authenticated, public;
-- rls_auto_enable : event trigger utilitaire admin
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()             FROM anon, authenticated, public;
-- is_superadmin : usage uniquement dans les policies RLS (SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid)               FROM anon, authenticated, public;
-- generate_short_id : générateur interne (triggers)
REVOKE EXECUTE ON FUNCTION public.generate_short_id(text, integer)       FROM anon, authenticated, public;
-- profiles_set_public_id / properties_set_public_id : triggers
REVOKE EXECUTE ON FUNCTION public.profiles_set_public_id()      FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.properties_set_public_id()    FROM anon, authenticated, public;
-- handle_updated_at : trigger
REVOKE EXECUTE ON FUNCTION public.handle_updated_at()           FROM anon, authenticated, public;

-- ── 3) Property_type CHECK constraint (cohérence enum) ─────────────────────
-- Avant Sprint 8 : POST acceptait 5 types, PATCH admin acceptait 9. DB sans
-- contrainte → values arbitraires possibles. On aligne sur 9 types (super-set).
DO $$ BEGIN
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_property_type_check
    CHECK (property_type IS NULL OR property_type = ANY (ARRAY[
      'villa','condo','hotel','land','bungalow','eco-resort','co-living','boutique-hotel','other'
    ]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4) Index manquant sur audit_logs.actor_id ──────────────────────────────
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx
  ON public.audit_logs (actor_id);

-- ── 5) Storage : property-photos bucket public → URLs publiques fonctionnent
-- sans policy SELECT. La policy SELECT permet le LISTING qui n'est pas voulu.
DROP POLICY IF EXISTS "public read property-photos" ON storage.objects;
-- Note : les URLs https://<host>/storage/v1/object/public/property-photos/<path>
-- restent accessibles via le flag bucket.public=true. Seul le listing est bloqué.
