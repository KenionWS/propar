-- =====================================================================
-- Cotizia — Rol admin + taxonomía (rubros / servicios)
-- Base del catálogo curado y del futuro benchmark de precios.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

-- Rol admin en el perfil
alter table profiles
  add column if not exists es_admin boolean not null default false;

-- Helper: ¿el usuario actual es admin?
create or replace function es_admin()
returns boolean as $$
  select coalesce(
    (select es_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- =====================================================================
-- Rubros (ej. "Desarrollo web", "Diseño", "Marketing")
-- =====================================================================
create table if not exists rubros (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  slug text unique not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

alter table rubros enable row level security;

create policy "Rubros lectura autenticada"
  on rubros for select using (auth.uid() is not null);

create policy "Rubros gestiona admin"
  on rubros for all using (es_admin()) with check (es_admin());

-- =====================================================================
-- Servicios dentro de un rubro (ej. "E-commerce", "Landing")
-- =====================================================================
create table if not exists servicios (
  id uuid primary key default uuid_generate_v4(),
  rubro_id uuid references rubros(id) on delete cascade not null,
  nombre text not null,
  slug text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists servicios_rubro_idx on servicios (rubro_id);

alter table servicios enable row level security;

create policy "Servicios lectura autenticada"
  on servicios for select using (auth.uid() is not null);

create policy "Servicios gestiona admin"
  on servicios for all using (es_admin()) with check (es_admin());

-- =====================================================================
-- Activá tu usuario como admin (cambiá el email si corresponde):
-- update profiles set es_admin = true
--   where id = (select id from auth.users where email = 'gastonlevyg@gmail.com');
-- =====================================================================
