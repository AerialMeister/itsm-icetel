-- ============================================================
-- ITSM Icetel - Esquema de base de datos para Supabase
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Extensión para generar UUIDs (suele venir activada en Supabase)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tipos (enums)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_ticket') then
    create type tipo_ticket as enum (
      'evento',
      'mantenimiento_preventivo',
      'mantenimiento_correctivo',
      'incidente'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'clasificacion_incidente') then
    create type clasificacion_incidente as enum (
      'urgente',
      'no_urgente',
      'averia'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'area_ticket') then
    create type area_ticket as enum (
      'energia',
      'clima',
      'servicios_generales'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_ticket') then
    create type estado_ticket as enum (
      'abierto',
      'cerrado'
    );
  end if;
end$$;

-- ------------------------------------------------------------
-- Tabla principal: tickets
-- ------------------------------------------------------------
create table if not exists public.tickets (
  id                       uuid primary key default gen_random_uuid(),
  tipo_ticket              tipo_ticket not null,
  -- Solo se completa cuando tipo_ticket = 'incidente'
  clasificacion_incidente  clasificacion_incidente,
  titulo                   text not null,
  descripcion              text,
  sala                     text,
  activo                   text,
  area                     area_ticket,
  fecha_inicio             timestamptz not null,
  fecha_cierre             timestamptz,
  estado                   estado_ticket not null default 'abierto',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Reglas de integridad
  constraint chk_clasif_solo_incidente check (
    (tipo_ticket = 'incidente') or (clasificacion_incidente is null)
  ),
  -- Un ticket cerrado debe tener fecha de cierre, y posterior al inicio
  constraint chk_cierre_obligatorio check (
    (estado = 'abierto'  and fecha_cierre is null) or
    (estado = 'cerrado' and fecha_cierre is not null and fecha_cierre >= fecha_inicio)
  )
);

-- ------------------------------------------------------------
-- Comentarios / observaciones del ticket
-- ------------------------------------------------------------
create table if not exists public.ticket_comentarios (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  comentario  text not null,
  autor       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Índices para acelerar el panel y las estadísticas
-- ------------------------------------------------------------
create index if not exists idx_tickets_fecha_inicio on public.tickets (fecha_inicio);
create index if not exists idx_tickets_tipo          on public.tickets (tipo_ticket);
create index if not exists idx_tickets_estado        on public.tickets (estado);
create index if not exists idx_tickets_activo        on public.tickets (activo);
create index if not exists idx_tickets_sala          on public.tickets (sala);
create index if not exists idx_comentarios_ticket    on public.ticket_comentarios (ticket_id);

-- ------------------------------------------------------------
-- Trigger para mantener updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- Portal interno: permitimos lectura/escritura con la anon key.
-- (Para producción real se recomienda usar Supabase Auth y
--  restringir por usuario autenticado.)
-- ------------------------------------------------------------
alter table public.tickets            enable row level security;
alter table public.ticket_comentarios enable row level security;

drop policy if exists "acceso_total_tickets" on public.tickets;
create policy "acceso_total_tickets"
  on public.tickets
  for all
  using (true)
  with check (true);

drop policy if exists "acceso_total_comentarios" on public.ticket_comentarios;
create policy "acceso_total_comentarios"
  on public.ticket_comentarios
  for all
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- (Opcional) Datos de ejemplo para probar el portal
-- Descomenta para insertar tickets de muestra.
-- ------------------------------------------------------------
-- insert into public.tickets (tipo_ticket, clasificacion_incidente, titulo, descripcion, sala, activo, area, fecha_inicio, fecha_cierre, estado)
-- values
--   ('incidente', 'urgente', 'Falla UPS sala 1', 'UPS principal sin respuesta', 'Sala 1', 'Activo 1', 'energia', now() - interval '5 days', now() - interval '4 days 20 hours', 'cerrado'),
--   ('evento', null, 'Corte programado de energia', 'Corte avisado por proveedor', 'Sala 2', 'Activo 2', 'energia', now() - interval '3 days', null, 'abierto'),
--   ('mantenimiento_preventivo', null, 'Limpieza de filtros CRAC', 'Mantencion mensual', 'Sala 1', 'Activo 3', 'clima', now() - interval '2 days', now() - interval '1 day', 'cerrado');
