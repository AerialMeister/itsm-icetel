-- ============================================================
-- ITSM Icetel - Adjuntos (informes) de tickets
-- Ejecutar DESPUÉS de schema.sql, en: Supabase > SQL Editor > Run
-- ============================================================

-- ------------------------------------------------------------
-- Tabla de adjuntos
-- ------------------------------------------------------------
create table if not exists public.ticket_adjuntos (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  nombre      text not null,
  path        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_adjuntos_ticket on public.ticket_adjuntos (ticket_id);

alter table public.ticket_adjuntos enable row level security;

drop policy if exists "acceso_total_adjuntos" on public.ticket_adjuntos;
create policy "acceso_total_adjuntos"
  on public.ticket_adjuntos
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- Bucket de Storage para los archivos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('adjuntos', 'adjuntos', true)
on conflict (id) do nothing;

-- Políticas de acceso al bucket (lectura/subida/borrado para el portal interno)
drop policy if exists "adjuntos_select" on storage.objects;
create policy "adjuntos_select" on storage.objects
  for select using (bucket_id = 'adjuntos');

drop policy if exists "adjuntos_insert" on storage.objects;
create policy "adjuntos_insert" on storage.objects
  for insert with check (bucket_id = 'adjuntos');

drop policy if exists "adjuntos_delete" on storage.objects;
create policy "adjuntos_delete" on storage.objects
  for delete using (bucket_id = 'adjuntos');
