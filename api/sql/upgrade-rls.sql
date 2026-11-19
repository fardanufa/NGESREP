-- Untuk database lama yang sudah berisi data. Aman dijalankan ulang.
begin;
alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.tips enable row level security;
commit;
