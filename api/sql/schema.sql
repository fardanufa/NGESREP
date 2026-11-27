-- Skema database NGESREP (jalankan di Supabase SQL Editor).

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  ingredients text,            -- satu bahan per baris (dipisah \n)
  steps text,                  -- satu langkah per baris (dipisah \n)
  image_url text,              -- path relatif, mis. images/tahu-gimbal.jpg
  cost_estimate integer default 0,   -- rupiah per porsi
  cook_time integer default 0,       -- menit
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz default now()
);

create table tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,                -- paragraf dipisah baris kosong (\n\n)
  highlight text,              -- opsional: isi kotak "Catatan Hemat Anak Kos"
  image_url text,
  created_at timestamptz default now()
);

create table favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index favorites_recipe_id_idx on favorites (recipe_id);
alter table favorites enable row level security;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  nim text check (nim ~ '^[0-9]{1,30}$'),
  avatar text check (char_length(avatar) <= 64000)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to service_role;

alter table categories enable row level security;
alter table recipes enable row level security;
alter table tips enable row level security;
