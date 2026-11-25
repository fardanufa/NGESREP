-- Untuk database lama yang sudah berisi data. Aman dijalankan ulang.
-- Akses aplikasi lewat API dengan service role, jadi tabel tidak butuh policy.
begin;
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('categories', 'recipes', 'tips')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.tips enable row level security;
commit;
