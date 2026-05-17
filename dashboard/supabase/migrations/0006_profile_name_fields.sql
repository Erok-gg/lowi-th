-- Sprint 4 — Champs nom/prénom/nationalité sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS last_name   text,
  ADD COLUMN IF NOT EXISTS nationality text;
