-- Tienda VIP: categorías «Próximamente» (octubre 2026).
-- La pestaña se ve en la web pero muestra un aviso de que viene pronto en vez de los artículos.
-- Pégalo en Supabase > SQL Editor > Run. Se puede correr más de una vez.

alter table public.vip_categorias add column if not exists proximamente boolean not null default false;
