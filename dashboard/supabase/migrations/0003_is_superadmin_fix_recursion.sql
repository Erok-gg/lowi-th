-- =====================================================================
-- Migration 0003 — Fix infinite recursion sur policies "superadmin"
-- =====================================================================
-- Bug pré-existant catché en Sprint 1 lors des tests RLS A/B :
--   les policies "superadmin all" font EXISTS (SELECT FROM profiles ...)
--   ce qui re-déclenche les policies sur profiles → récursion infinie
--   quand un user authenticated essaie d'accéder à une table protégée.
--
-- Fix : fonction SECURITY DEFINER is_superadmin() qui bypass RLS pour
-- le lookup sur profiles. Toutes les policies "superadmin all" sont
-- remplacées pour utiliser cette fonction.
--
-- À appliquer après 0002.
-- =====================================================================

-- Fonction utilitaire SECURITY DEFINER (bypasse RLS pour le lookup)
CREATE OR REPLACE FUNCTION public.is_superadmin(uid uuid DEFAULT auth.uid())
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND is_superadmin = true
  );
$$;

-- ── profiles ──
DROP POLICY IF EXISTS "superadmin all" ON public.profiles;
CREATE POLICY "superadmin all profiles" ON public.profiles
  FOR ALL USING (public.is_superadmin());

-- ── identity_profiles ──
DROP POLICY IF EXISTS "superadmin_all_identity" ON public.identity_profiles;
CREATE POLICY "superadmin_all_identity" ON public.identity_profiles
  FOR ALL USING (public.is_superadmin());

-- ── kyc_submissions ──
DROP POLICY IF EXISTS "superadmin_all_kyc_submissions" ON public.kyc_submissions;
CREATE POLICY "superadmin_all_kyc_submissions" ON public.kyc_submissions
  FOR ALL USING (public.is_superadmin());

-- ── kyc_documents ──
DROP POLICY IF EXISTS "superadmin_all_kyc_documents" ON public.kyc_documents;
CREATE POLICY "superadmin_all_kyc_documents" ON public.kyc_documents
  FOR ALL USING (public.is_superadmin());

-- ── reservations ──
DROP POLICY IF EXISTS "superadmin_all_reservations" ON public.reservations;
CREATE POLICY "superadmin_all_reservations" ON public.reservations
  FOR ALL USING (public.is_superadmin());

-- ── waitlist (créée en 0002) ──
DROP POLICY IF EXISTS "superadmin all waitlist" ON public.waitlist;
CREATE POLICY "superadmin all waitlist" ON public.waitlist
  FOR ALL USING (public.is_superadmin());

-- ── audit_logs (créée en 0002) ──
DROP POLICY IF EXISTS "superadmin read logs" ON public.audit_logs;
CREATE POLICY "superadmin read logs" ON public.audit_logs
  FOR SELECT USING (public.is_superadmin());

-- ── bin (créée en 0002) ──
DROP POLICY IF EXISTS "superadmin all bin" ON public.bin;
CREATE POLICY "superadmin all bin" ON public.bin
  FOR ALL USING (public.is_superadmin());

-- ── permissions (créée en 0002) ──
DROP POLICY IF EXISTS "superadmin write permissions" ON public.permissions;
CREATE POLICY "superadmin write permissions" ON public.permissions
  FOR ALL USING (public.is_superadmin());

-- ── signup_attempts (créée en 0002) ──
DROP POLICY IF EXISTS "superadmin read signup_attempts" ON public.signup_attempts;
CREATE POLICY "superadmin read signup_attempts" ON public.signup_attempts
  FOR SELECT USING (public.is_superadmin());
