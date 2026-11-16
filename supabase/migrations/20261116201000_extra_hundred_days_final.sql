create extension if not exists pgcrypto;

create table if not exists public.extra_hundred_days_series (
  id uuid primary key default gen_random_uuid(),

  character_key text not null default 'baiqi',

  year integer not null,
  title_ko text,
  title_cn text not null,
  slug text not null unique,

  series_type text not null default 'custom',

  start_date date,
  end_date date,

  description text,
  thumbnail_url text,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  extra_hundred_days_series_character_year_idx
on public.extra_hundred_days_series (
  character_key,
  year desc
);


create table if not exists public.extra_hundred_days_items (
  id uuid primary key default gen_random_uuid(),

  series_id uuid not null
    references public.extra_hundred_days_series(id)
    on delete cascade,

  entry_type text not null default 'day',

  day_number integer,
  release_date date,

  time_text text,
  title text,

  original_text text,
  translation_text text,

  is_voice boolean not null default false,

  media_type text not null default 'none',
  media_url text,

  image_url text,
  thumbnail_url text,

  meta_json jsonb not null default '{}'::jsonb,

  sort_order integer not null default 0,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


alter table public.extra_hundred_days_items
  drop constraint if exists extra_hundred_days_items_entry_type_check;

alter table public.extra_hundred_days_items
  add constraint extra_hundred_days_items_entry_type_check
  check (
    entry_type in (
      'prologue',
      'day',
      'special'
    )
  );


alter table public.extra_hundred_days_items
  drop constraint if exists extra_hundred_days_items_media_type_check;

alter table public.extra_hundred_days_items
  add constraint extra_hundred_days_items_media_type_check
  check (
    media_type in (
      'none',
      'youtube',
      'audio',
      'image'
    )
  );


alter table public.extra_hundred_days_items
  drop constraint if exists extra_hundred_days_items_day_number_check;

alter table public.extra_hundred_days_items
  add constraint extra_hundred_days_items_day_number_check
  check (
    (
      entry_type = 'day'
      and day_number between 0 and 100
    )
    or
    (
      entry_type <> 'day'
      and day_number is null
    )
  );


create unique index if not exists
  extra_hundred_days_unique_day_idx
on public.extra_hundred_days_items (
  series_id,
  day_number
)
where entry_type = 'day';


create unique index if not exists
  extra_hundred_days_unique_prologue_idx
on public.extra_hundred_days_items (
  series_id
)
where entry_type = 'prologue';


create index if not exists
  extra_hundred_days_items_series_sort_idx
on public.extra_hundred_days_items (
  series_id,
  sort_order,
  day_number
);


create table if not exists public.extra_hundred_days_relations (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null
    references public.extra_hundred_days_items(id)
    on delete cascade,

  target_type text not null
    check (
      target_type in (
        'phone_item',
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
    item_id,
    target_type,
    target_id
  )
);


alter table public.extra_hundred_days_series
  enable row level security;

alter table public.extra_hundred_days_items
  enable row level security;

alter table public.extra_hundred_days_relations
  enable row level security;


drop policy if exists
  "hundred days public series"
on public.extra_hundred_days_series;

create policy
  "hundred days public series"
on public.extra_hundred_days_series
for select
to anon, authenticated
using (is_published = true);


drop policy if exists
  "hundred days public items"
on public.extra_hundred_days_items;

create policy
  "hundred days public items"
on public.extra_hundred_days_items
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.extra_hundred_days_series s
    where s.id = series_id
      and s.is_published = true
  )
);


drop policy if exists
  "hundred days public relations"
on public.extra_hundred_days_relations;

create policy
  "hundred days public relations"
on public.extra_hundred_days_relations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.extra_hundred_days_items i
    join public.extra_hundred_days_series s
      on s.id = i.series_id
    where i.id = item_id
      and i.is_published = true
      and s.is_published = true
  )
);
