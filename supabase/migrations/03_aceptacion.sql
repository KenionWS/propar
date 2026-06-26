-- =====================================================================
-- Cotizia — Aceptación parcial por bloques
-- - Nuevo estado 'aceptada_parcial'
-- - modo_aceptacion por propuesta ('completa' | 'por_bloques')
-- - motivo_rechazo en la propuesta
-- - aceptado por item (qué bloques eligió el cliente)
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

-- Ampliar el check de estado para incluir 'aceptada_parcial'
alter table propuestas drop constraint if exists propuestas_estado_check;
alter table propuestas add constraint propuestas_estado_check
  check (estado in (
    'borrador', 'enviada', 'vista',
    'aceptada', 'aceptada_parcial', 'rechazada'
  ));

alter table propuestas
  add column if not exists modo_aceptacion text not null default 'completa'
    check (modo_aceptacion in ('completa', 'por_bloques')),
  add column if not exists motivo_rechazo text;

alter table items
  add column if not exists aceptado boolean not null default true;
