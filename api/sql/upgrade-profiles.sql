-- Untuk database yang sudah ada; uji pada proyek non-produksi terlebih dahulu.
begin;
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  nim text check (nim ~ '^[0-9]{1,30}$'),
  avatar text check (char_length(avatar) <= 64000)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to service_role;
commit;
