-- Novedades con varias imágenes (octubre 2026): como los anuncios de Discord, una novedad
-- puede llevar hasta 10 fotos. "imagen" sigue siendo la portada y "galeria" son las demás,
-- que salen en mosaico al final de la página y en el anuncio de Discord.
-- Pégalo en Supabase > SQL Editor > Run (después de novedades-2026-10.sql).

alter table public.novedades
  add column if not exists galeria text[] not null default '{}' check (cardinality(galeria) <= 9);
