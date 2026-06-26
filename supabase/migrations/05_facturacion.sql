-- =====================================================================
-- Cotizia — Scaffolding de facturación (AFIP)
-- Estado de factura por cuota, listo para integrar con AFIP/ARCA (WSFEv1)
-- a futuro. Por ahora estas columnas solo registran el estado.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

alter table pagos
  add column if not exists factura_estado text not null default 'pendiente'
    check (factura_estado in ('pendiente', 'facturada', 'enviada', 'error')),
  add column if not exists factura_numero text,
  add column if not exists factura_cae text,
  add column if not exists factura_url text,
  add column if not exists facturado_at timestamptz;
