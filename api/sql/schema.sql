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

alter table categories enable row level security;
alter table recipes enable row level security;
alter table tips enable row level security;
