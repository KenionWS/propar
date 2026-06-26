-- =====================================================================
-- Cotizia — Cache del token de AFIP (WSAA)
-- El token+sign que devuelve WSAA vale 12hs. En serverless no se puede
-- cachear en memoria (cold starts), así que lo guardamos acá.
-- Acceso solo vía service client (RLS sin políticas = solo service role).
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists afip_tokens (
  service text primary key,
  token text not null,
  sign text not null,
  expira_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table afip_tokens enable row level security;
-- Sin políticas: ningún rol público accede; el service role saltea RLS.
