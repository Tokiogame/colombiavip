-- Tienda VIP: marca «Recién llegado al server» (octubre 2026).
-- Pégalo en Supabase > SQL Editor > Run. Se puede correr más de una vez.

alter table public.vip add column if not exists nuevo boolean not null default false;
