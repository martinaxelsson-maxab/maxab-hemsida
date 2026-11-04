-- Kör en gång i Supabase: SQL Editor → New query → Run.
-- Skapar texter till det interna området. Innehållet läses bara av inloggade.
-- Skriv inga riktiga interna texter i den här filen. Den ligger i ett publikt repo.

create table if not exists public.internal_pages (
  slug text primary key,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.internal_pages enable row level security;

drop policy if exists "Inloggad personal får läsa interna sidor" on public.internal_pages;
create policy "Inloggad personal får läsa interna sidor"
  on public.internal_pages
  for select
  to authenticated
  using (true);

revoke all on table public.internal_pages from anon;
grant select on table public.internal_pages to authenticated;

-- Ny textsida läggs enklast i Table Editor → internal_pages → Insert row.
-- Eller med SQL, utanför git:
-- insert into public.internal_pages (slug, title, body, sort_order)
-- values ('anteckningar', 'Anteckningar', 'Text som bara inloggade ser.', 10);
