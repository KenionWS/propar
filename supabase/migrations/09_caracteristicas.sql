-- =====================================================================
-- Cotizia — Características de los bloques (sub-items con ícono)
-- Cada item/bloque puede tener una lista de características "incluidas",
-- cada una con ícono + título + descripción. Se guarda como JSONB para
-- que sobreviva al reemplazo en bloque de los items al guardar.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

alter table items
  add column if not exists caracteristicas jsonb not null default '[]'::jsonb;

alter table bloques
  add column if not exists caracteristicas jsonb not null default '[]'::jsonb;
