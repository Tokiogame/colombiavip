-- Videos en las novedades (octubre 2026): carpeta pública "videos" en Storage para los clips
-- cortos que el staff sube desde el panel (ya comprimidos por el navegador) y su miniatura.
-- Los videos largos van por link de YouTube y no ocupan espacio aquí.
-- Pégalo en Supabase > SQL Editor > Run. Se puede correr más de una vez.

-- máximo 30 MB por archivo (el panel deja cada clip en ~20 MB o menos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 31457280, array['video/mp4', 'video/webm', 'image/webp', 'image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos: leer" on storage.objects;
create policy "videos: leer" on storage.objects
  for select using (bucket_id = 'videos');

drop policy if exists "videos: subir" on storage.objects;
create policy "videos: subir" on storage.objects
  for insert with check (bucket_id = 'videos' and public.tiene_rol('admin', 'staff'));

drop policy if exists "videos: cambiar" on storage.objects;
create policy "videos: cambiar" on storage.objects
  for update using (bucket_id = 'videos' and public.tiene_rol('admin', 'staff'));

drop policy if exists "videos: borrar" on storage.objects;
create policy "videos: borrar" on storage.objects
  for delete using (bucket_id = 'videos' and public.tiene_rol('admin', 'staff'));
