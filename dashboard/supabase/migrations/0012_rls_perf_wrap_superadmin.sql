-- ===========================================================================
-- 0012 — Performance RLS : wrap is_superadmin() (Sprint 10 post-audit)
-- ===========================================================================
-- Suite migration 0011 : on a wrappé auth.uid() dans les 16 policies user,
-- mais les 13 policies superadmin appellent toujours is_superadmin() (sans
-- argument) — qui résout vers is_superadmin(auth.uid()) via DEFAULT, ce qui
-- réévalue auth.uid() par ligne.
--
-- Fix : appel explicite avec (SELECT auth.uid()) → init plan unique.
-- ===========================================================================

-- audit_logs
DROP POLICY IF EXISTS "superadmin read logs" ON public.audit_logs;
CREATE POLICY "superadmin read logs" ON public.audit_logs
  FOR SELECT USING (public.is_superadmin((SELECT auth.uid())));

-- bin
DROP POLICY IF EXISTS "superadmin all bin" ON public.bin;
CREATE POLICY "superadmin all bin" ON public.bin
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- identity_profiles
DROP POLICY IF EXISTS "superadmin_all_identity" ON public.identity_profiles;
CREATE POLICY "superadmin_all_identity" ON public.identity_profiles
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- kyc_documents
DROP POLICY IF EXISTS "superadmin_all_kyc_documents" ON public.kyc_documents;
CREATE POLICY "superadmin_all_kyc_documents" ON public.kyc_documents
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- kyc_submissions
DROP POLICY IF EXISTS "superadmin_all_kyc_submissions" ON public.kyc_submissions;
CREATE POLICY "superadmin_all_kyc_submissions" ON public.kyc_submissions
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- permissions
DROP POLICY IF EXISTS "superadmin write permissions" ON public.permissions;
CREATE POLICY "superadmin write permissions" ON public.permissions
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- profiles
DROP POLICY IF EXISTS "superadmin all profiles" ON public.profiles;
CREATE POLICY "superadmin all profiles" ON public.profiles
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- properties
DROP POLICY IF EXISTS "superadmin all properties" ON public.properties;
CREATE POLICY "superadmin all properties" ON public.properties
  FOR ALL
  USING (public.is_superadmin((SELECT auth.uid())))
  WITH CHECK (public.is_superadmin((SELECT auth.uid())));

-- property_kyb_documents
DROP POLICY IF EXISTS "superadmin all kyb docs" ON public.property_kyb_documents;
CREATE POLICY "superadmin all kyb docs" ON public.property_kyb_documents
  FOR ALL
  USING (public.is_superadmin((SELECT auth.uid())))
  WITH CHECK (public.is_superadmin((SELECT auth.uid())));

-- property_photos
DROP POLICY IF EXISTS "superadmin all property_photos" ON public.property_photos;
CREATE POLICY "superadmin all property_photos" ON public.property_photos
  FOR ALL
  USING (public.is_superadmin((SELECT auth.uid())))
  WITH CHECK (public.is_superadmin((SELECT auth.uid())));

-- reservations
DROP POLICY IF EXISTS "superadmin_all_reservations" ON public.reservations;
CREATE POLICY "superadmin_all_reservations" ON public.reservations
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));

-- signup_attempts
DROP POLICY IF EXISTS "superadmin read signup_attempts" ON public.signup_attempts;
CREATE POLICY "superadmin read signup_attempts" ON public.signup_attempts
  FOR SELECT USING (public.is_superadmin((SELECT auth.uid())));

-- waitlist
DROP POLICY IF EXISTS "superadmin all waitlist" ON public.waitlist;
CREATE POLICY "superadmin all waitlist" ON public.waitlist
  FOR ALL USING (public.is_superadmin((SELECT auth.uid())));
