-- ============================================================
-- ITSM Icetel - Tipo "Proyecto", clasificaciones de Evento/Proyecto,
-- Jornada, Especialidad y Fecha de fin.
-- Ejecutar en: Supabase > SQL Editor > Run
--
-- IMPORTANTE: en PostgreSQL no se puede usar un valor de enum recién
-- agregado dentro de la MISMA transacción en que se creó. Por eso este
-- archivo se ejecuta en DOS PASOS:
--   PASO 1: ejecutar solo el bloque de "ALTER TYPE ... ADD VALUE" y darle Run.
--   PASO 2: ejecutar el resto (columnas y constraint) y darle Run.
-- ============================================================

-- ------------------------------------------------------------
-- PASO 1 — Nuevos valores de enum (ejecutar primero, solo este bloque)
-- ------------------------------------------------------------
alter type tipo_ticket add value if not exists 'proyecto';

-- Clasificaciones de Evento
alter type clasificacion_incidente add value if not exists 'ronda_inspeccion';
alter type clasificacion_incidente add value if not exists 'otros_eventos';

-- Clasificaciones (nivel de riesgo) de Proyecto
alter type clasificacion_incidente add value if not exists 'riesgo_alto';
alter type clasificacion_incidente add value if not exists 'riesgo_medio';
alter type clasificacion_incidente add value if not exists 'riesgo_bajo';

-- ------------------------------------------------------------
-- PASO 2 — Columnas nuevas y ajuste de restricción
-- (ejecutar después del PASO 1)
-- ------------------------------------------------------------

-- Jornada de trabajo: 'diurna' | 'nocturna' (texto libre para no atar a un enum)
alter table public.tickets add column if not exists jornada text;

-- Fecha de fin planificada (Proyecto y Mantenimientos declaran inicio y fin).
-- Es distinta de fecha_cierre, que solo se completa al cerrar el ticket.
alter table public.tickets add column if not exists fecha_fin timestamptz;

-- La especialidad reutiliza la columna existente "area"
-- (energia / clima / servicios_generales). No requiere cambios.

-- La clasificación ya no es exclusiva de incidentes: ahora también la usan
-- Evento y Proyecto. Se elimina la restricción que la limitaba a incidentes.
alter table public.tickets drop constraint if exists chk_clasif_solo_incidente;

-- (Opcional) Index para filtrar por jornada
create index if not exists idx_tickets_jornada on public.tickets (jornada);
