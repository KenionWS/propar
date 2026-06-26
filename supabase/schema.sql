-- =====================================================================
-- Cotizia — Esquema de base de datos
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- =====================================================================
-- Perfil del usuario (configuración de la agencia)
-- =====================================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  empresa_nombre text not null default '',
  empresa_logo_url text,
  empresa_web text,
  empresa_telefono text,
  empresa_email text,
  empresa_direccion text,
  color_primario text not null default '#111827',
  instagram text,
  linkedin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Usuario ve su propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Usuario edita su propio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Usuario inserta su propio perfil"
  on profiles for insert with check (auth.uid() = id);

-- Trigger para crear perfil al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =====================================================================
-- Propuestas
-- =====================================================================
create table propuestas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  slug text unique not null,
  titulo text not null,
  cliente_nombre text not null,
  cliente_empresa text,
  cliente_email text,
  cliente_telefono text,
  introduccion text,
  terminos text,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  tipo_cambio numeric(10,2),
  vigencia_dias int not null default 15,
  estado text not null default 'borrador' check (estado in ('borrador', 'enviada', 'vista', 'aceptada', 'rechazada')),
  enviada_at timestamptz,
  vista_primera_vez_at timestamptz,
  aceptada_at timestamptz,
  rechazada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table propuestas enable row level security;

create policy "Usuario ve sus propuestas"
  on propuestas for select using (auth.uid() = user_id);

create policy "Usuario gestiona sus propuestas"
  on propuestas for all using (auth.uid() = user_id);

-- Acceso público para páginas de propuesta (lectura por slug)
create policy "Lectura pública por slug"
  on propuestas for select using (true);

-- =====================================================================
-- Items de cada propuesta
-- =====================================================================
create table items (
  id uuid primary key default uuid_generate_v4(),
  propuesta_id uuid references propuestas(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  precio numeric(12,2) not null default 0,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

alter table items enable row level security;

create policy "Usuario ve items de sus propuestas"
  on items for select using (
    auth.uid() = (select user_id from propuestas where id = propuesta_id)
  );

create policy "Usuario gestiona items de sus propuestas"
  on items for all using (
    auth.uid() = (select user_id from propuestas where id = propuesta_id)
  );

-- Acceso público a items para la vista de propuesta
create policy "Lectura pública de items"
  on items for select using (true);

-- =====================================================================
-- Registro de visitas (tracking)
-- =====================================================================
create table visitas (
  id uuid primary key default uuid_generate_v4(),
  propuesta_id uuid references propuestas(id) on delete cascade not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table visitas enable row level security;

create policy "Usuario ve visitas de sus propuestas"
  on visitas for select using (
    auth.uid() = (select user_id from propuestas where id = propuesta_id)
  );

-- Inserción pública para tracking (sin auth)
create policy "Inserción pública de visitas"
  on visitas for insert with check (true);

-- =====================================================================
-- Storage: bucket público para logos de las agencias
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Logos lectura pública"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Usuario sube su logo"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Usuario actualiza su logo"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Usuario borra su logo"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.role() = 'authenticated');
