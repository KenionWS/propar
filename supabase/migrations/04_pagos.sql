-- =====================================================================
-- Cotizia — Seguimiento de pagos / cobros
-- Cada fila es una cuota de una propuesta aceptada. El plan (monto
-- mensual + cantidad de cuotas + fecha de inicio) se define al cerrar y
-- genera N filas en esta tabla. El dueño marca cada cuota como pagada.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists pagos (
  id uuid primary key default uuid_generate_v4(),
  propuesta_id uuid references propuestas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  numero int not null,
  monto numeric(12,2) not null default 0,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  vencimiento date not null,
  pagado boolean not null default false,
  pagado_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pagos_propuesta_idx on pagos (propuesta_id);
create index if not exists pagos_user_idx on pagos (user_id);

alter table pagos enable row level security;

create policy "Usuario ve sus pagos"
  on pagos for select using (auth.uid() = user_id);

create policy "Usuario gestiona sus pagos"
  on pagos for all using (auth.uid() = user_id);
