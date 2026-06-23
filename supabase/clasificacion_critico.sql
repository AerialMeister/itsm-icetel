-- ============================================================
-- ITSM Icetel - Agregar clasificación "Crítico" a incidentes
-- Ejecutar en: Supabase > SQL Editor > Run
-- ============================================================

-- Añade el valor 'critico' al enum (no afecta los datos existentes)
alter type clasificacion_incidente add value if not exists 'critico';
