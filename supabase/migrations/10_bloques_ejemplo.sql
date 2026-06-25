-- =====================================================================
-- PropAR — Bloques de ejemplo (catálogo curado por la plataforma)
-- Bloques que carga el admin, categorizados por servicio. Todos los
-- usuarios los ven (lectura) y los insertan en sus propuestas. Solo el
-- admin los gestiona.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists bloques_ejemplo (
  id uuid primary key default uuid_generate_v4(),
  servicio_id uuid references servicios(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  precio numeric(12,2) not null default 0,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  caracteristicas jsonb not null default '[]'::jsonb,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists bloques_ejemplo_servicio_idx
  on bloques_ejemplo (servicio_id);

alter table bloques_ejemplo enable row level security;

create policy "Ejemplos lectura autenticada"
  on bloques_ejemplo for select using (auth.uid() is not null);

create policy "Ejemplos gestiona admin"
  on bloques_ejemplo for all using (es_admin()) with check (es_admin());
