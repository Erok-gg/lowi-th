-- =====================================================================
-- Migration 0001 — Snapshot fidèle de l'état actuel du projet Supabase
-- =====================================================================
-- Project : ewtykeltwurubmyfrfmo (Lowi)
-- Date    : 2026-05-17
--
-- Cette migration reproduit l'état actuel de la DB. Elle n'est PAS
-- destinée à être appliquée sur la prod existante (elle conflicte avec
-- les objets déjà créés). Elle sert de référence et permet de recréer
-- l'environnement à l'identique (staging, tests, etc.).
--
-- Pour les correctifs RLS, voir 0002_fix_rls_holes.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions (déjà présentes sur Supabase par défaut, listées pour ref)
-- ---------------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- pour gen_random_uuid()


-- ---------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL
       AND cmd.schema_name IN ('public')
       AND cmd.schema_name NOT IN ('pg_catalog', 'information_schema')
       AND cmd.schema_name NOT LIKE 'pg_toast%'
       AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    ELSE
      RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)',
                cmd.object_identity, cmd.schema_name;
    END IF;
  END LOOP;
END;
$function$;

-- Event trigger : auto-active RLS sur toute nouvelle table créée
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  EXECUTE FUNCTION public.rls_auto_enable();


-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- profiles : extension de auth.users, 1-1
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  display_name    text,
  is_superadmin   boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- waitlist : signups en attente d'approbation superadmin
CREATE TABLE public.waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  invite_code     text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected'])),
  ip_address      text,
  user_agent      text,
  notes           text,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid REFERENCES public.profiles(id)
);

CREATE INDEX waitlist_expires_at_idx
  ON public.waitlist (expires_at)
  WHERE status = 'pending';

-- permissions : ACL granulaire (folder-based, non utilisée pour MVP)
CREATE TABLE public.permissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id),
  folder_key      text NOT NULL,
  level           text NOT NULL CHECK (level = ANY (ARRAY['read', 'edit'])),
  granted_by      uuid REFERENCES public.profiles(id),
  granted_at      timestamptz NOT NULL DEFAULT now()
);

-- audit_logs : trace des actions sensibles
CREATE TABLE public.audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES public.profiles(id),
  actor_email     text,
  action          text NOT NULL,
  target_type     text,
  target_id       text,
  metadata        jsonb,
  ip_address      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx
  ON public.audit_logs (created_at);

-- signup_attempts : rate limiting signup (compteur par IP)
CREATE TABLE public.signup_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address      text NOT NULL,
  email           text,
  attempted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signup_attempts_ip_idx
  ON public.signup_attempts (ip_address, attempted_at);

-- bin : corbeille avec rétention 30 jours (snapshot JSON)
CREATE TABLE public.bin (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type       text NOT NULL,
  item_id         text NOT NULL,
  item_snapshot   jsonb NOT NULL,
  deleted_by      uuid REFERENCES public.profiles(id),
  deleted_at      timestamptz NOT NULL DEFAULT now(),
  purge_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- kyc_submissions : une soumission par user (UNIQUE user_id)
CREATE TABLE public.kyc_submissions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid UNIQUE NOT NULL REFERENCES public.profiles(id),
  email               text NOT NULL,
  status              text DEFAULT 'incomplete'
                        CHECK (status = ANY (ARRAY['incomplete', 'pending', 'under_review', 'approved', 'rejected'])),
  drive_folder_id     text,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid,
  rejection_reason    text,
  notes               text,
  first_name          text,
  last_name           text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- kyc_documents : fichiers KYC stockés sur Google Drive
CREATE TABLE public.kyc_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id       uuid NOT NULL REFERENCES public.kyc_submissions(id),
  user_id             uuid NOT NULL REFERENCES public.profiles(id),
  document_type       text NOT NULL
                        CHECK (document_type = ANY (ARRAY['id_front', 'id_back', 'address_proof', 'selfie', 'fund_origin', 'tax_form'])),
  drive_file_id       text NOT NULL,
  drive_file_url      text NOT NULL,
  file_name           text,
  uploaded_at         timestamptz DEFAULT now()
);

-- identity_profiles : données d'identité étendues (KYC personne physique)
CREATE TABLE public.identity_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.profiles(id),
  first_name      text,
  last_name       text,
  maiden_name     text,
  sex             text CHECK (sex = ANY (ARRAY['M', 'F', 'autre'])),
  birth_date      date,
  birth_place     text,
  birth_country   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- reservations : réservations d'investissement (parts de propriété)
CREATE TABLE public.reservations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id),
  property_id         text NOT NULL DEFAULT 'chalok-villa',
  parts_count         integer NOT NULL CHECK (parts_count >= 5),
  price_per_part_thb  numeric NOT NULL DEFAULT 100000,
  total_thb           numeric NOT NULL,
  total_usd           numeric,
  total_eur           numeric,
  usd_rate            numeric,
  eur_rate            numeric,
  status              text DEFAULT 'pending'
                        CHECK (status = ANY (ARRAY['pending', 'confirmed', 'cancelled'])),
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);


-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- Création automatique de profiles à l'inscription auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Maintient updated_at sur profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ---------------------------------------------------------------------
-- RLS activée par l'event trigger ensure_rls,
-- mais déclarée explicitement ici pour traçabilité
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations        ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- Policies — état actuel (avec trous, corrigés dans 0002)
-- ---------------------------------------------------------------------

-- profiles
CREATE POLICY "own profile read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "service insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "superadmin all" ON public.profiles
  FOR ALL USING (
    auth.uid() IN (SELECT p.id FROM public.profiles p WHERE p.is_superadmin = true)
  );

-- waitlist (TROUÉE — corrigée dans 0002)
CREATE POLICY "authenticated read" ON public.waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated write" ON public.waitlist
  FOR ALL USING (auth.role() = 'authenticated');

-- permissions (TROUÉE — corrigée dans 0002)
CREATE POLICY "own read" ON public.permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admin write" ON public.permissions
  FOR ALL USING (auth.role() = 'authenticated');

-- audit_logs (TROUÉE — corrigée dans 0002)
CREATE POLICY "authenticated insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated read logs" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- signup_attempts (TROUÉE — corrigée dans 0002)
CREATE POLICY "anon insert" ON public.signup_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "authenticated read" ON public.signup_attempts
  FOR SELECT USING (auth.role() = 'authenticated');

-- bin (TROUÉE — corrigée dans 0002)
CREATE POLICY "authenticated all" ON public.bin
  FOR ALL USING (auth.role() = 'authenticated');

-- identity_profiles
CREATE POLICY "users_own_identity" ON public.identity_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "superadmin_all_identity" ON public.identity_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- kyc_submissions
CREATE POLICY "users_own_kyc_submission" ON public.kyc_submissions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "superadmin_all_kyc_submissions" ON public.kyc_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- kyc_documents
CREATE POLICY "users_own_kyc_documents" ON public.kyc_documents
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "superadmin_all_kyc_documents" ON public.kyc_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- reservations
CREATE POLICY "users_own_reservations" ON public.reservations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "superadmin_all_reservations" ON public.reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = true)
  );
