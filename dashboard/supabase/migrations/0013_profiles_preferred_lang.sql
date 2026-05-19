-- ===========================================================================
-- 0013 — preferred_lang sur profiles (Sprint email i18n)
-- ===========================================================================
-- Stocke la langue préférée du user pour l'envoi d'emails transactionnels.
-- Valeurs : 'fr' | 'en' | 'th'. Default 'fr'.
-- Indépendant du sélecteur UI (localStorage) — celui-ci reste pour la nav.
-- ===========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_lang text NOT NULL DEFAULT 'fr';

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_preferred_lang_check
    CHECK (preferred_lang = ANY (ARRAY['fr','en','th']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
