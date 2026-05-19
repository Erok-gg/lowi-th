-- ===========================================================================
-- 0015 — Fix suite régression migration 0010 sur fonctions trigger
-- ===========================================================================
-- Migration 0014 a réparé is_superadmin. Mais d'autres fonctions trigger
-- ne sont pas SECURITY DEFINER (profiles_set_public_id, properties_set_public_id,
-- handle_updated_at) et appellent generate_short_id. Quand le trigger fire
-- depuis un INSERT user, Postgres évalue l'EXECUTE permission dans le
-- contexte du user — qui n'a pas EXECUTE depuis migration 0010.
--
-- Reproduit : INSERT properties par user authenticated →
-- "permission denied for function generate_short_id"
-- ===========================================================================

GRANT EXECUTE ON FUNCTION public.generate_short_id(text, integer)   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.profiles_set_public_id()           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.properties_set_public_id()         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_updated_at()                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user()                  TO authenticated, anon;

-- rls_auto_enable reste révoqué (event trigger admin uniquement).
