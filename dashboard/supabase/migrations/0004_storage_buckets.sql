-- =====================================================================
-- Migration 0004 — Buckets Storage pour properties
-- =====================================================================
-- 2 buckets créés avec config :
--   - property-photos : public, 10 MB, images (jpeg, png, webp)
--   - property-kyb    : privé,  25 MB, images + PDF
--
-- Policies minimales pour ce sprint : superadmin tout + public read sur photos.
-- Les policies user (owner-based via JOIN sur properties) seront ajoutées
-- au Sprint 5 quand la table properties existera.
-- =====================================================================

-- Bucket : property-photos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket : property-kyb (privé, signed URLs uniquement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-kyb',
  'property-kyb',
  false,
  26214400,  -- 25 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies Storage : superadmin tout sur les 2 buckets ──

DROP POLICY IF EXISTS "superadmin all property-photos" ON storage.objects;
CREATE POLICY "superadmin all property-photos" ON storage.objects
  FOR ALL
  USING (bucket_id = 'property-photos' AND public.is_superadmin())
  WITH CHECK (bucket_id = 'property-photos' AND public.is_superadmin());

DROP POLICY IF EXISTS "superadmin all property-kyb" ON storage.objects;
CREATE POLICY "superadmin all property-kyb" ON storage.objects
  FOR ALL
  USING (bucket_id = 'property-kyb' AND public.is_superadmin())
  WITH CHECK (bucket_id = 'property-kyb' AND public.is_superadmin());

-- Lecture publique du bucket property-photos
DROP POLICY IF EXISTS "public read property-photos" ON storage.objects;
CREATE POLICY "public read property-photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-photos');
