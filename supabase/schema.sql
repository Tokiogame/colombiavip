-- ============================================
-- Colombia VIP · base de datos del panel
-- Pega todo esto en Supabase > SQL Editor > New query > Run
-- ============================================


-- ---------- staff (usuario y contraseña, sin correo) ----------
create extension if not exists pgcrypto with schema extensions;

-- versión anterior del panel (login con correo), ya no se usa
drop table if exists public.admins;

create table if not exists public.staff (
  usuario text primary key check (usuario = lower(usuario) and char_length(usuario) between 2 and 40),
  clave   text not null  -- contraseña cifrada con bcrypt, nunca en texto plano
);
create table if not exists public.staff_sesiones (
  token   uuid primary key default gen_random_uuid(),
  usuario text not null references public.staff on delete cascade on update cascade,
  expira  timestamptz not null default now() + interval '7 days'
);
-- sin políticas: nadie las lee directo, solo las funciones de abajo
alter table public.staff enable row level security;
alter table public.staff_sesiones enable row level security;

-- token que manda el panel en el encabezado x-staff-token
create or replace function public.token_staff()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.headers', true), '')::json ->> 'x-staff-token';
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_sesiones
    where token::text = public.token_staff() and expira > now()
  );
$$;

create or replace function public.staff_login(p_usuario text, p_clave text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario text;
  v_token   uuid;
begin
  select usuario into v_usuario from public.staff
  where usuario = lower(trim(p_usuario)) and clave = crypt(p_clave, clave);

  if v_usuario is null then
    perform pg_sleep(1);  -- frena a quien intente adivinar contraseñas
    return null;
  end if;

  delete from public.staff_sesiones where expira < now();
  insert into public.staff_sesiones (usuario) values (v_usuario) returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.staff_logout()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.staff_sesiones where token::text = public.token_staff();
$$;

revoke execute on function public.es_admin(), public.staff_login(text, text), public.staff_logout() from public;
grant execute on function public.es_admin(), public.staff_login(text, text), public.staff_logout() to anon, authenticated;

-- ---------- roles: admin, staff, entrevistador ----------
-- admin:          todo, incluido crear usuarios y cambiar roles
-- staff:          solicitudes (incluso eliminar), facciones y videos
-- entrevistador:  ver solicitudes y aprobarlas o rechazarlas
-- Los usuarios que ya existían quedan como admin; los nuevos, como staff.
alter table public.staff add column if not exists rol text not null default 'admin'
  check (rol in ('admin', 'staff', 'entrevistador'));
alter table public.staff alter column rol set default 'staff';

create or replace function public.staff_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select usuario from public.staff_sesiones
  where token::text = public.token_staff() and expira > now();
$$;

create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.rol from public.staff s
  join public.staff_sesiones x on x.usuario = s.usuario
  where x.token::text = public.token_staff() and x.expira > now();
$$;

create or replace function public.tiene_rol(variadic p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.rol_actual() = any (p_roles), false);
$$;

-- quién soy (lo usa el panel para mostrar solo lo que el rol permite)
create or replace function public.staff_yo()
returns table (usuario text, rol text)
language sql
stable
security definer
set search_path = public
as $$
  select s.usuario, s.rol from public.staff s where s.usuario = public.staff_actual();
$$;

-- versiones anteriores sin rol
drop function if exists public.staff_listar();
drop function if exists public.staff_guardar(text, text);

create or replace function public.staff_listar()
returns table (usuario text, rol text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol('admin') then raise exception 'Sin permiso'; end if;
  return query select s.usuario, s.rol from public.staff s order by s.rol, s.usuario;
end;
$$;

-- crea un usuario o edita uno existente (clave vacía = no cambiarla)
create or replace function public.staff_guardar(p_usuario text, p_clave text, p_rol text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario text := lower(trim(p_usuario));
  v_existe  boolean;
  v_rol_ant text;
begin
  if not public.tiene_rol('admin') then raise exception 'Sin permiso'; end if;
  if v_usuario !~ '^[a-z0-9._-]{2,40}$' then
    raise exception 'El usuario solo puede tener letras, números, punto, guion y guion bajo (2 a 40)';
  end if;
  if p_rol not in ('admin', 'staff', 'entrevistador') then raise exception 'Rol no válido'; end if;

  select true, rol into v_existe, v_rol_ant from public.staff where usuario = v_usuario;
  v_existe := coalesce(v_existe, false);

  if (not v_existe or coalesce(p_clave, '') <> '') and char_length(coalesce(p_clave, '')) < 6 then
    raise exception 'La contraseña debe tener mínimo 6 caracteres';
  end if;
  if v_usuario = public.staff_actual() and p_rol <> 'admin' then
    raise exception 'No puedes quitarte el rol de admin a ti mismo';
  end if;

  if not v_existe then
    insert into public.staff (usuario, clave, rol) values (v_usuario, crypt(p_clave, gen_salt('bf')), p_rol);
    return;
  end if;

  update public.staff set
    rol = p_rol,
    clave = case when coalesce(p_clave, '') = '' then clave else crypt(p_clave, gen_salt('bf')) end
  where usuario = v_usuario;

  -- si le cambiaron la contraseña o el rol a otro, se le cierra la sesión
  if v_usuario <> public.staff_actual() and (coalesce(p_clave, '') <> '' or p_rol <> v_rol_ant) then
    delete from public.staff_sesiones where usuario = v_usuario;
  end if;
end;
$$;

-- cualquiera del staff puede cambiar su propia contraseña
create or replace function public.staff_mi_clave(p_clave text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.staff_actual() is null then raise exception 'Sin permiso'; end if;
  if char_length(coalesce(p_clave, '')) < 6 then raise exception 'La contraseña debe tener mínimo 6 caracteres'; end if;
  update public.staff set clave = crypt(p_clave, gen_salt('bf')) where usuario = public.staff_actual();
end;
$$;

create or replace function public.staff_borrar(p_usuario text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol('admin') then raise exception 'Sin permiso'; end if;
  if lower(p_usuario) = public.staff_actual() then raise exception 'No puedes eliminar tu propio usuario'; end if;
  delete from public.staff where usuario = lower(p_usuario);
end;
$$;

revoke execute on function public.staff_actual(), public.rol_actual(), public.tiene_rol(text[]), public.staff_yo(),
  public.staff_listar(), public.staff_guardar(text, text, text), public.staff_mi_clave(text), public.staff_borrar(text) from public;
grant execute on function public.staff_actual(), public.rol_actual(), public.tiene_rol(text[]), public.staff_yo(),
  public.staff_listar(), public.staff_guardar(text, text, text), public.staff_mi_clave(text), public.staff_borrar(text) to anon, authenticated;


-- ---------- videos (guías) ----------
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  yt          text not null,
  titulo      text not null,
  descripcion text not null default '',
  orden       int  not null default 0,
  creado      timestamptz not null default now()
);
alter table public.videos enable row level security;

drop policy if exists "videos: leer todos" on public.videos;
create policy "videos: leer todos" on public.videos
  for select using (true);

drop policy if exists "videos: admin escribe" on public.videos;
create policy "videos: admin escribe" on public.videos
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));


-- ---------- facciones ----------
create table if not exists public.facciones (
  id          text primary key,
  nombre      text not null,
  sigla       text not null default '',
  color       text not null default '#e0b02c',
  icono       text not null default 'escudo',
  abierta     boolean not null default true,
  webhook     text not null default '',
  rol         text not null default '',
  descripcion text not null default '',
  requisitos  jsonb not null default '[]',
  preguntas   jsonb not null default '[]',
  orden       int  not null default 0,
  creado      timestamptz not null default now()
);
alter table public.facciones enable row level security;

drop policy if exists "facciones: leer todos" on public.facciones;
create policy "facciones: leer todos" on public.facciones
  for select using (true);

drop policy if exists "facciones: admin escribe" on public.facciones;
create policy "facciones: admin escribe" on public.facciones
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));


-- ---------- solicitudes (whitelist y postulaciones) ----------
create table if not exists public.solicitudes (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('whitelist', 'faccion')),
  faccion_id     text,
  faccion_nombre text,
  discord        text not null check (char_length(discord) between 1 and 100),
  personaje      text not null check (char_length(personaje) between 1 and 100),
  datos          jsonb not null default '[]' check (pg_column_size(datos) < 60000),
  estado         text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota           text not null default '',
  discord_msg    text not null default '' check (discord_msg ~ '^[0-9]{0,25}$'),   -- mensaje en Discord que el panel edita
  revisado_por   text not null default '',
  creado         timestamptz not null default now()
);
create index if not exists solicitudes_creado_idx on public.solicitudes (creado desc);
alter table public.solicitudes enable row level security;

-- cualquiera puede enviar una solicitud, pero siempre entra como pendiente
drop policy if exists "solicitudes: enviar" on public.solicitudes;
create policy "solicitudes: enviar" on public.solicitudes
  for insert to anon, authenticated
  with check (estado = 'pendiente' and nota = '' and revisado_por = '');

-- solo el staff las ve y las gestiona
drop policy if exists "solicitudes: admin lee" on public.solicitudes;
create policy "solicitudes: admin lee" on public.solicitudes
  for select using (public.es_admin());

drop policy if exists "solicitudes: admin edita" on public.solicitudes;
create policy "solicitudes: admin edita" on public.solicitudes
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "solicitudes: admin borra" on public.solicitudes;
create policy "solicitudes: admin borra" on public.solicitudes
  for delete using (public.tiene_rol('admin', 'staff'));


-- ---------- tienda VIP ----------
-- categoria: el id de una fila de vip_categorias (carros, motos…)
create table if not exists public.vip (
  id          uuid primary key default gen_random_uuid(),
  categoria   text not null default 'carros',
  nombre      text not null check (char_length(nombre) between 1 and 80),
  precio      int  not null default 0 check (precio >= 0),
  descripcion text not null default '',
  incluye     jsonb not null default '[]',
  imagen      text not null default '',
  destacado   boolean not null default false,
  agotado     boolean not null default false,
  orden       int  not null default 0,
  creado      timestamptz not null default now()
);
alter table public.vip enable row level security;

drop policy if exists "vip: leer todos" on public.vip;
create policy "vip: leer todos" on public.vip
  for select using (true);

drop policy if exists "vip: admin escribe" on public.vip;
create policy "vip: admin escribe" on public.vip
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));

grant select on public.vip to anon, authenticated;
grant insert, update, delete on public.vip to anon, authenticated;


-- ---------- categorías de la tienda VIP (las pestañas) ----------
create table if not exists public.vip_categorias (
  id     text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  nombre text not null check (char_length(nombre) between 1 and 40),
  icono  text not null default 'estrella',
  orden  int  not null default 0
);
alter table public.vip_categorias enable row level security;

drop policy if exists "vip_categorias: leer todos" on public.vip_categorias;
create policy "vip_categorias: leer todos" on public.vip_categorias
  for select using (true);

drop policy if exists "vip_categorias: admin escribe" on public.vip_categorias;
create policy "vip_categorias: admin escribe" on public.vip_categorias
  for all using (public.tiene_rol('admin', 'staff')) with check (public.tiene_rol('admin', 'staff'));

grant select on public.vip_categorias to anon, authenticated;
grant insert, update, delete on public.vip_categorias to anon, authenticated;

insert into public.vip_categorias (id, nombre, icono, orden) values
  ('carros', 'Carros', 'carro', 1),
  ('motos', 'Motos', 'moto', 2),
  ('casas', 'Casas', 'casa', 3),
  ('otros', 'Otros', 'estrella', 4)
on conflict (id) do nothing;


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


-- ---------- imágenes de la tienda VIP (Storage) ----------
-- carpeta pública "vip": cualquiera ve las fotos, solo admin y staff suben o borran
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vip', 'vip', true, 5242880, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "vip fotos: leer" on storage.objects;
create policy "vip fotos: leer" on storage.objects
  for select using (bucket_id = 'vip');

drop policy if exists "vip fotos: subir" on storage.objects;
create policy "vip fotos: subir" on storage.objects
  for insert with check (bucket_id = 'vip' and public.tiene_rol('admin', 'staff'));

drop policy if exists "vip fotos: cambiar" on storage.objects;
create policy "vip fotos: cambiar" on storage.objects
  for update using (bucket_id = 'vip' and public.tiene_rol('admin', 'staff'));

drop policy if exists "vip fotos: borrar" on storage.objects;
create policy "vip fotos: borrar" on storage.objects
  for delete using (bucket_id = 'vip' and public.tiene_rol('admin', 'staff'));


-- ---------- permisos de las tablas (las políticas de arriba deciden qué filas) ----------
grant select on public.videos, public.facciones to anon, authenticated;
grant insert on public.solicitudes to anon, authenticated;
grant select, insert, update, delete on public.videos, public.facciones, public.solicitudes to anon, authenticated;


-- ---------- facciones iniciales (las mismas que tenía la web) ----------
insert into public.facciones (id, nombre, sigla, color, icono, descripcion, requisitos, preguntas, orden) values
(
  'ems', 'EMS Zura', 'Servicio médico de emergencias', '#e5484d', 'cruz',
  'Atiende heridos, maneja la ambulancia y salva vidas en cada rincón de la ciudad.',
  '["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Sin sanciones graves recientes"]',
  '[{"texto": "¿Por qué quieres pertenecer a EMS Zura?", "min": 150},
    {"texto": "Llegas a un tiroteo con varios heridos y la policía aún no controla la zona. ¿Qué haces?", "min": 120},
    {"texto": "¿Qué harías si un compañero EMS está ayudando a una banda?", "min": 80}]',
  1
),
(
  'policia', 'Policía Nacional', 'PONAL', '#2fa865', 'escudo',
  'Patrulla las calles, responde a los robos y mantiene el orden dentro de la ciudad.',
  '["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Conocer la normativa de robos"]',
  '[{"texto": "¿Por qué quieres entrar a la Policía Nacional?", "min": 150},
    {"texto": "Durante un atraco con rehenes, los atracadores piden un carro. ¿Cómo manejas la negociación?", "min": 120},
    {"texto": "¿Qué es el abuso de poder y cómo lo evitarías con tu personaje?", "min": 80}]',
  2
),
(
  'ejercito', 'Ejército Nacional', 'Fuerzas militares', '#a3a84a', 'estrella',
  'Protege zonas estratégicas, apoya operativos de alto riesgo y responde ante amenazas mayores.',
  '["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Disponibilidad para entrenamientos"]',
  '[{"texto": "¿Por qué quieres entrar al Ejército Nacional?", "min": 150},
    {"texto": "¿Cuál crees que es la diferencia entre el rol del Ejército y el de la Policía?", "min": 100},
    {"texto": "Tu superior te da una orden que va contra la normativa del servidor. ¿Qué haces?", "min": 80}]',
  3
),
(
  'fiscalia', 'Fiscalía General', 'Fiscalía General de la Nación', '#4b82e8', 'balanza',
  'Investiga delitos, arma los casos y lleva a los criminales ante la justicia.',
  '["Whitelist aprobada", "Mínimo 3 semanas en la ciudad", "Buena redacción y rol de investigación"]',
  '[{"texto": "¿Por qué quieres pertenecer a la Fiscalía General?", "min": 150},
    {"texto": "La policía te trae a un sospechoso de homicidio sin pruebas claras. ¿Cómo procedes?", "min": 120},
    {"texto": "¿Cómo manejarías un caso donde está involucrado un miembro de tu propia facción?", "min": 80}]',
  4
)
on conflict (id) do nothing;


-- ---------- usuario del panel ----------
-- Usuario: admin   Contraseña: admin123
insert into public.staff (usuario, clave, rol)
values ('admin', extensions.crypt('admin123', extensions.gen_salt('bf')), 'admin')
on conflict (usuario) do nothing;

-- Los demás usuarios se crean desde el panel (pestaña Staff). También por SQL:
-- insert into public.staff (usuario, clave, rol) values ('juan', extensions.crypt('SU-CLAVE', extensions.gen_salt('bf')), 'entrevistador');
-- Cambiar una contraseña:
-- update public.staff set clave = extensions.crypt('NUEVA-CLAVE', extensions.gen_salt('bf')) where usuario = 'admin';
