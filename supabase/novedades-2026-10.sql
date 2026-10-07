-- Novedades (octubre 2026): actualizaciones, eventos y anuncios que el staff publica desde el panel.
-- Cada una tiene su propia página en la web: /novedades/<slug>.
-- Pégalo en Supabase > SQL Editor > Run. Las imágenes usan el mismo bucket "vip" (carpeta novedades/).

create table if not exists public.novedades (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  titulo    text not null check (char_length(titulo) between 3 and 120),
  tipo      text not null default 'actualizacion' check (tipo in ('actualizacion', 'evento', 'parche', 'anuncio')),
  resumen   text not null default '' check (char_length(resumen) <= 220),
  contenido text not null default '',
  imagen    text not null default '',
  publicado boolean not null default false,
  fecha     timestamptz not null default now(),
  anunciada timestamptz,               -- cuándo se publicó en Discord (para no repetirla)
  creado    timestamptz not null default now()
);
create index if not exists novedades_fecha on public.novedades (fecha desc);
alter table public.novedades enable row level security;

-- la web solo ve las publicadas; el staff ve también los borradores
drop policy if exists "novedades: leer" on public.novedades;
create policy "novedades: leer" on public.novedades
  for select using (publicado or public.tiene_rol('admin', 'staff'));

drop policy if exists "novedades: admin escribe" on public.novedades;
create policy "novedades: admin escribe" on public.novedades
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));

grant select on public.novedades to anon, authenticated;
grant insert, update, delete on public.novedades to anon, authenticated;
