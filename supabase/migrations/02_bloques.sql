-- =====================================================================
-- PropAR — Biblioteca de bloques reutilizables
-- Bloques (servicios/items) que el usuario guarda para reutilizar en
-- distintas propuestas. Se copian a la propuesta (snapshot), así editar
-- la biblioteca no altera cotizaciones ya creadas.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists bloques (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  precio numeric(12,2) not null default 0,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  veces_usado int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bloques enable row level security;

create policy "Usuario ve sus bloques"
  on bloques for select using (auth.uid() = user_id);

create policy "Usuario gestiona sus bloques"
  on bloques for all using (auth.uid() = user_id);
