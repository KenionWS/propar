-- =====================================================================
-- Cotizia — Plantillas de propuesta (catálogo curado)
-- Cotizaciones completas de ejemplo por rubro que el usuario clona como
-- punto de partida. Los items se guardan como JSONB (snapshot que se
-- copia a la nueva propuesta al clonar). Solo el admin las gestiona.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists plantillas (
  id uuid primary key default uuid_generate_v4(),
  rubro_id uuid references rubros(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  introduccion text,
  terminos text,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  vigencia_dias int not null default 15,
  modo_aceptacion text not null default 'completa'
    check (modo_aceptacion in ('completa', 'por_bloques')),
  items jsonb not null default '[]'::jsonb,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists plantillas_rubro_idx on plantillas (rubro_id);

alter table plantillas enable row level security;

create policy "Plantillas lectura autenticada"
  on plantillas for select using (auth.uid() is not null);

create policy "Plantillas gestiona admin"
  on plantillas for all using (es_admin()) with check (es_admin());
