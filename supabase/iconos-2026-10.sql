-- Íconos propios (octubre 2026): el panel deja subir íconos para facciones y categorías VIP.
-- Pégalo en Supabase > SQL Editor > Run. Usa el mismo bucket "vip" que ya existe.

-- ---------- íconos subidos desde el panel ----------
-- las imágenes van al bucket "vip" (carpeta iconos/); facciones y categorías guardan el link
create table if not exists public.iconos (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 40),
  imagen text not null check (imagen ~ '^https://'),
  creado timestamptz not null default now()
);
alter table public.iconos enable row level security;

drop policy if exists "iconos: leer todos" on public.iconos;
create policy "iconos: leer todos" on public.iconos
  for select using (true);

drop policy if exists "iconos: admin escribe" on public.iconos;
create policy "iconos: admin escribe" on public.iconos
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));

grant select on public.iconos to anon, authenticated;
grant insert, update, delete on public.iconos to anon, authenticated;
