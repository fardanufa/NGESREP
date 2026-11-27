-- Untuk database yang sudah ada; uji pada proyek non-produksi terlebih dahulu.
begin;
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index if not exists favorites_recipe_id_idx on public.favorites (recipe_id);
alter table public.favorites enable row level security;
commit;
