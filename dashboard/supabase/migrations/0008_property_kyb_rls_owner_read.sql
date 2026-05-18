-- ===========================================================================
-- 0008 — property_kyb_documents : split RLS pour permettre au propriétaire
--        de lire ses docs après transition vers active/closed
-- ===========================================================================
-- Contexte : "users own kyb docs after acceptance" (FOR ALL) limitait toute
-- opération à status='accepted'. Quand l'admin passe en 'active' ou 'closed',
-- l'utilisateur ne peut plus voir SES propres docs (compliance/audit).
--
-- Fix similaire à 0007 :
--   - SELECT : owner peut lire ses docs sur accepted/active/closed
--   - INSERT/DELETE : owner restreint à status='accepted' uniquement
--   - UPDATE : admin uniquement (déjà via "superadmin all kyb docs")
-- ===========================================================================

DROP POLICY IF EXISTS "users own kyb docs after acceptance" ON public.property_kyb_documents;

CREATE POLICY "users read own kyb docs"
  ON public.property_kyb_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = auth.uid()
        AND p.status IN ('accepted','active','closed')
    )
  );

CREATE POLICY "users write own kyb docs when accepted"
  ON public.property_kyb_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = auth.uid()
        AND p.status = 'accepted'
    )
  );

CREATE POLICY "users delete own kyb docs when accepted"
  ON public.property_kyb_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_kyb_documents.property_id
        AND p.submitted_by = auth.uid()
        AND p.status = 'accepted'
    )
  );

-- UPDATE non accordé aux users : seul l'admin modifie status/rejection_reason
-- (déjà couvert par "superadmin all kyb docs" FOR ALL).
