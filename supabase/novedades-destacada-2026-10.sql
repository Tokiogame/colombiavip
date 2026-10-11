-- Actualización destacada (octubre 2026): la que el staff marca sale en grande arriba
-- del inicio y de /actualizaciones. Solo puede haber una a la vez.
-- Pégalo en Supabase > SQL Editor > Run. Se puede correr más de una vez.

alter table public.novedades add column if not exists destacada boolean not null default false;
create unique index if not exists novedades_una_destacada on public.novedades (destacada) where destacada;
