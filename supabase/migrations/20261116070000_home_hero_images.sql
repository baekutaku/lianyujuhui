create extension if not exists pgcrypto;

create table if not exists public.home_hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null unique,
  source_type text not null default 'external'
    check (source_type in ('external', 'r2')),
  object_key text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_hero_images_sort_idx
  on public.home_hero_images(sort_order, created_at);

alter table public.home_hero_images enable row level security;

drop policy if exists "public read active home hero images"
  on public.home_hero_images;

create policy "public read active home hero images"
  on public.home_hero_images
  for select
  to anon, authenticated
  using (is_active = true);

insert into public.home_hero_images
  (image_url, source_type, object_key, sort_order, is_active)
values
  ('https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg', 'external', null, 0, true),
  ('https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg', 'external', null, 1, true),
  ('https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg', 'external', null, 2, true)
on conflict (image_url) do nothing;
