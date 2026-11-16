create extension if not exists pgcrypto;

create table if not exists public.extra_touch_room_items (
  id uuid primary key default gen_random_uuid(),

  character_key text not null,
  title text not null,
  slug text not null unique,

  release_date date,
  occasion text,

  video_url text not null,
  thumbnail_url text,

  original_text text,
  translation_text text,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  extra_touch_room_release_date_idx
  on public.extra_touch_room_items (
    release_date desc
  );

create index if not exists
  extra_touch_room_character_idx
  on public.extra_touch_room_items (
    character_key,
    release_date desc
  );

create index if not exists
  extra_touch_room_occasion_idx
  on public.extra_touch_room_items (
    occasion
  );

alter table public.extra_touch_room_items
  enable row level security;

drop policy if exists
  "extra touch room public read"
  on public.extra_touch_room_items;

create policy
  "extra touch room public read"
  on public.extra_touch_room_items
  for select
  to anon, authenticated
  using (is_published = true);


create table if not exists public.extra_touch_room_relations (
  id uuid primary key default gen_random_uuid(),

  touch_room_id uuid not null
    references public.extra_touch_room_items(id)
    on delete cascade,

  target_type text not null
    check (
      target_type in (
        'card',
        'illustration',
        'story',
        'event'
      )
    ),

  target_id uuid not null,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  unique (
    touch_room_id,
    target_type,
    target_id
  )
);

create index if not exists
  extra_touch_room_relations_item_idx
  on public.extra_touch_room_relations (
    touch_room_id,
    target_type,
    sort_order
  );

alter table public.extra_touch_room_relations
  enable row level security;

drop policy if exists
  "extra touch room relations public read"
  on public.extra_touch_room_relations;

create policy
  "extra touch room relations public read"
  on public.extra_touch_room_relations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.extra_touch_room_items item
      where item.id = touch_room_id
        and item.is_published = true
    )
  );
