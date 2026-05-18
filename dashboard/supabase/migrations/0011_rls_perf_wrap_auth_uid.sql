-- ===========================================================================
-- 0011 — Performance RLS : wrap auth.uid() (Sprint 10 post-audit)
-- ===========================================================================
-- Postgres réévalue auth.uid() à CHAQUE ligne dans une policy. Le wrapper
-- (SELECT auth.uid()) force l'init plan à l'exécuter une seule fois par requête.
-- Sur 10k+ lignes l'écart est massif (cf advisor auth_rls_initplan).
--
-- Stratégie :
--   1) is_superadmin(uid uuid DEFAULT auth.uid()) → DEFAULT (SELECT auth.uid())
--      → toutes les policies "superadmin" passent à init plan unique sans modif
--   2) Réécrire les 16 policies user qui contiennent auth.uid() direct
-- ===========================================================================

-- Note : on a tenté de modifier le DEFAULT de is_superadmin(uid uuid DEFAULT (SELECT auth.uid()))
-- mais Postgres refuse les subqueries dans DEFAULT (ERROR 0A000). On laisse
-- is_superadmin tel quel. La fonction est STABLE SECURITY DEFINER, l'optimiseur
-- la cache naturellement sur une même requête. Pour aller plus loin, on devrait
-- réécrire les 13 policies superadmin pour appeler is_superadmin((SELECT auth.uid()))
-- explicitement — reporté (gain marginal vs effort).

-- ── Policies user : wrap auth.uid() en (SELECT auth.uid()) ──────────────────

-- audit_logs
DROP POLICY IF EXISTS "authenticated self insert logs" ON public.audit_logs;
CREATE POLICY "authenticated self insert logs" ON public.audit_logs
  FOR INSERT TO public
  WITH CHECK (
    (auth.role() = 'authenticated') AND
    (actor_id IS NULL OR actor_id = (SELECT auth.uid()))
  );

-- identity_profiles
DROP POLICY IF EXISTS "users_own_identity" ON public.identity_profiles;
CREATE POLICY "users_own_identity" ON public.identity_profiles
  FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- kyc_documents
DROP POLICY IF EXISTS "users_own_kyc_documents" ON public.kyc_documents;
CREATE POLICY "users_own_kyc_documents" ON public.kyc_documents
  FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- kyc_submissions
DROP POLICY IF EXISTS "users_own_kyc_submission" ON public.kyc_submissions;
CREATE POLICY "users_own_kyc_submission" ON public.kyc_submissions
  FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- permissions
DROP POLICY IF EXISTS "own read" ON public.permissions;
CREATE POLICY "own read" ON public.permissions
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- profiles
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- properties
DROP POLICY IF EXISTS "users own properties draft" ON public.properties;
CREATE POLICY "users own properties draft" ON public.properties
  FOR ALL
  USING (submitted_by = (SELECT auth.uid()) AND status IN ('lead', 'reviewing'))
  WITH CHECK (submitted_by = (SELECT auth.uid()) AND status IN ('lead', 'reviewing'));

DROP POLICY IF EXISTS "users read own properties any status" ON public.properties;
CREATE POLICY "users read own properties any status" ON public.properties
  FOR SELECT
  USING (submitted_by = (SELECT auth.uid()));

-- property_kyb_documents
DROP POLICY IF EXISTS "users delete own kyb docs when accepted" ON public.property_kyb_documents;
CREATE POLICY "users delete own kyb docs when accepted" ON public.property_kyb_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "users read own kyb docs" ON public.property_kyb_documents;
CREATE POLICY "users read own kyb docs" ON public.property_kyb_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status IN ('accepted', 'active', 'closed')
    )
  );

DROP POLICY IF EXISTS "users write own kyb docs when accepted" ON public.property_kyb_documents;
CREATE POLICY "users write own kyb docs when accepted" ON public.property_kyb_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status = 'accepted'
    )
  );

-- property_photos
DROP POLICY IF EXISTS "users delete own property photos when draft" ON public.property_photos;
CREATE POLICY "users delete own property photos when draft" ON public.property_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status IN ('lead', 'reviewing')
    )
  );

DROP POLICY IF EXISTS "users read own property photos any status" ON public.property_photos;
CREATE POLICY "users read own property photos any status" ON public.property_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "users update own property photos when draft" ON public.property_photos;
CREATE POLICY "users update own property photos when draft" ON public.property_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status IN ('lead', 'reviewing')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status IN ('lead', 'reviewing')
    )
  );

DROP POLICY IF EXISTS "users write own property photos when draft" ON public.property_photos;
CREATE POLICY "users write own property photos when draft" ON public.property_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = (SELECT auth.uid())
        AND p.status IN ('lead', 'reviewing')
    )
  );

-- reservations
DROP POLICY IF EXISTS "users_own_reservations" ON public.reservations;
CREATE POLICY "users_own_reservations" ON public.reservations
  FOR ALL
  USING (user_id = (SELECT auth.uid()));
