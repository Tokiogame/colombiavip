-- Postulaciones sincronizadas con Discord (septiembre 2026).
-- Pégalo en Supabase > SQL Editor > Run. Se puede correr más de una vez.
--
-- discord_msg:  id del mensaje que llegó al canal de Discord; el panel lo edita
--               al aprobar o rechazar (color, estado y quién lo hizo).
-- revisado_por: usuario del panel que aprobó o rechazó.

alter table public.solicitudes add column if not exists discord_msg text not null default '';
alter table public.solicitudes add column if not exists revisado_por text not null default '';

alter table public.solicitudes drop constraint if exists solicitudes_discord_msg_check;
alter table public.solicitudes add constraint solicitudes_discord_msg_check check (discord_msg ~ '^[0-9]{0,25}$');

-- quien envía desde la web no puede marcarse como revisado
drop policy if exists "solicitudes: enviar" on public.solicitudes;
create policy "solicitudes: enviar" on public.solicitudes
  for insert to anon, authenticated
  with check (estado = 'pendiente' and nota = '' and revisado_por = '');

create index if not exists solicitudes_estado_idx on public.solicitudes (estado, creado desc);
