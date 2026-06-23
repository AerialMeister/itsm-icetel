-- ============================================================
-- ITSM Icetel - Vínculo con la CMDB (activo_id)
-- Ejecutar en: Supabase > SQL Editor (mismo proyecto que la CMDB)
-- Requiere haber ejecutado antes el schema.sql de la CMDB.
-- ============================================================

-- UUID estable del activo en la CMDB. La columna de texto 'activo' se
-- conserva como respaldo/historial y para tickets antiguos sin vínculo.
alter table public.tickets add column if not exists activo_id uuid;

create index if not exists idx_tickets_activo_id on public.tickets (activo_id);

-- Nota: no se define FOREIGN KEY a cmdb_assets a propósito, para que el ITSM
-- siga siendo independiente y un ticket no bloquee el borrado de un activo.
-- El nombre actual se resuelve en tiempo de lectura con cmdb_asset_names().
