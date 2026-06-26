-- =====================================================================
-- Cotizia — Documento fiscal del cliente (receptor de la factura)
-- Si está cargado, se factura a ese CUIT/CUIL/DNI; si no, Consumidor Final.
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

alter table propuestas
  add column if not exists cliente_documento text;
