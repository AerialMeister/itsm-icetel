-- ============================================================
-- ITSM Icetel - Código único por ticket
-- Ejecutar en: Supabase > SQL Editor > Run
-- ============================================================

-- Columna para el código (DCSM-INC2606-001, DCSM-D2606-001, etc.)
alter table public.tickets add column if not exists codigo text;

-- Garantiza unicidad (permite NULL en tickets antiguos sin código)
create unique index if not exists uq_tickets_codigo on public.tickets (codigo);
