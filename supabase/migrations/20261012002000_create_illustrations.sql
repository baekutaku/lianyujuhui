create table if not exists public.illustrations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  summary text,
  release_year integer,
  release_date date,
  source_url text,
  server_id uuid references public.servers(id) on delete set null,
  primary_character_id uuid references public.characters(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists illustrations_created_at_idx
  on public.illustrations (created_at desc);

create index if not exists illustrations_release_year_idx
  on public.illustrations (release_year desc);

create index if not exists illustrations_primary_character_idx
  on public.illustrations (primary_character_id);
