-- ===========================================================================
-- 0007 — property_photos : permettre au propriétaire de lire ses photos
--        quelle que soit la statut de la propriété
-- ===========================================================================
-- Contexte : la policy "users own property photos" (FOR ALL) limitait toute
-- opération aux statuts 'lead' et 'reviewing'. Quand l'admin transitionne
-- en 'accepted' / 'rejected' / 'active' / 'closed', le propriétaire ne pouvait
-- plus voir SES photos dans /properties/[id] (la jointure RLS filtrait tout).
--
-- Fix : split la policy en deux :
--   - SELECT : owner peut lire ses photos en permanence (tous statuts)
--   - INSERT/UPDATE/DELETE : owner restreint à lead/reviewing (inchangé)
-- ===========================================================================

DROP POLICY IF EXISTS "users own property photos" ON public.property_photos;

-- Lecture : propriétaire peut TOUJOURS lire ses photos (audit, archive, KYB)
CREATE POLICY "users read own property photos any status"
  ON public.property_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
    )
  );

-- Écriture : propriétaire peut INSERT/UPDATE/DELETE uniquement si lead/reviewing
CREATE POLICY "users write own property photos when draft"
  ON public.property_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('lead','reviewing')
    )
  );

CREATE POLICY "users update own property photos when draft"
  ON public.property_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('lead','reviewing')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('lead','reviewing')
    )
  );

CREATE POLICY "users delete own property photos when draft"
  ON public.property_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('lead','reviewing')
    )
  );
