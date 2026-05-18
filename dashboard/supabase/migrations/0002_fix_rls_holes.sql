-- =====================================================================
-- Migration 0002 — Correctifs des trous RLS identifiés dans 0001
-- =====================================================================
-- À appliquer en Sprint 1 (NE PAS appliquer pendant le Sprint 0).
-- Voir RLS_AUDIT.md pour le détail des trous corrigés.
--
-- ⚠️ PRÉALABLE BLOQUANT (catché en audit Sprint 0) :
--   Avant d'appliquer cette migration, REFACTOR `app/api/signup/route.ts`
--   pour utiliser `createAdminClient()` au lieu de `createClient()`
--   pour ces 3 opérations :
--     - SELECT count FROM signup_attempts (ligne ~32)
--     - SELECT id, status FROM waitlist (ligne ~49)
--     - UPSERT waitlist (ligne ~67)
--   Sinon : rate limit cassé silencieusement, doublons waitlist, 500 sur réinscription.
--   Voir RLS_AUDIT.md section 5 pour le détail.
--
-- Avant d'appliquer :
--   1. Refactor /api/signup (voir ci-dessus)
--   2. Tester en staging avec 2 users de test
--   3. Vérifier qu'aucune route API existante ne casse
--      (toutes les autres utilisent déjà `admin` ou des tables où les policies user_id sont OK)
-- =====================================================================


-- ---------------------------------------------------------------------
-- waitlist : retirer accès authenticated, garder superadmin + anon signup
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated read" ON public.waitlist;
DROP POLICY IF EXISTS "authenticated write" ON public.waitlist;

CREATE POLICY "superadmin all waitlist" ON public.waitlist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- Insert public (route /api/signup non authentifiée)
CREATE POLICY "anon insert waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);


-- ---------------------------------------------------------------------
-- audit_logs : lecture superadmin uniquement, insert restreint à actor=self
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated read logs" ON public.audit_logs;
DROP POLICY IF EXISTS "authenticated insert" ON public.audit_logs;

CREATE POLICY "superadmin read logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- Insert : authenticated peut logger, mais uniquement avec actor_id = soi-même
-- (empêche un user de forger des logs au nom d'un autre)
CREATE POLICY "authenticated self insert logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );

-- Insert anon autorisé pour route /api/signup (qui logge le signup public)
CREATE POLICY "anon insert logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'anon'
    AND actor_id IS NULL
  );


-- ---------------------------------------------------------------------
-- bin : superadmin uniquement
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated all" ON public.bin;

CREATE POLICY "superadmin all bin" ON public.bin
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );


-- ---------------------------------------------------------------------
-- permissions : superadmin écrit, user lit ses propres permissions
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "admin write" ON public.permissions;
-- "own read" est correcte, on la garde

CREATE POLICY "superadmin write permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );


-- ---------------------------------------------------------------------
-- signup_attempts : lecture superadmin uniquement, insert anon (signup)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated read" ON public.signup_attempts;
-- "anon insert" est correcte, on la garde

CREATE POLICY "superadmin read signup_attempts" ON public.signup_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- Authenticated insert nécessaire si /api/signup est appelé par un user déjà loggé
-- (peu probable mais inoffensif)
CREATE POLICY "authenticated insert signup_attempts" ON public.signup_attempts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
