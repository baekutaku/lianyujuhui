create table if not exists public.extra_pv_items (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  slug text not null unique,

  release_date date,
  release_year integer,

  character_keys text[] not null default '{}'::text[],

  video_cn_url text,
  video_kr_url text,

  original_text text,
  translation_text text,

  image_urls text[] not null default '{}'::text[],

  related_event_slug text,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.extra_pv_items
  enable row level security;

drop policy if exists
  "extra pv public read"
  on public.extra_pv_items;

create policy
  "extra pv public read"
  on public.extra_pv_items
  for select
  to anon, authenticated
  using (is_published = true);

create index if not exists
  extra_pv_items_release_date_idx
  on public.extra_pv_items (release_date desc);
