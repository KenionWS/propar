-- =====================================================================
-- PropAR — Branding por agencia
-- Agrega opciones de personalización al perfil.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

alter table profiles
  add column if not exists color_acento text not null default '#16a34a',
  add column if not exists fuente text not null default 'Inter',
  add column if not exists logo_tamano text not null default 'mediano'
    check (logo_tamano in ('chico', 'mediano', 'grande')),
  add column if not exists densidad text not null default 'normal'
    check (densidad in ('compacto', 'normal', 'amplio'));
