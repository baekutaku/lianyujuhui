create table if not exists public.extra_hundred_days_series (
  id uuid primary key default gen_random_uuid(),

  character_key text not null default 'baiqi',

  year integer not null,
  title_ko text,
  title_cn text not null,
  slug text not null unique,

  series_type text not null default 'custom'
    check (
      series_type in (
        'letters',
        'daily_message',
        'mixed_voice',
        'checkin',
        'diary',
        'trajectory',
        'challenge',
        'custom'
      )
    ),

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

  entry_type text not null default 'day'
    check (
      entry_type in (
        'prologue',
        'day',
        'story',
        'voice',
        'summary',
        'moment',
        'message',
        'easter_egg',
        'special'
      )
    ),

  day_number integer,
  release_date date,

  time_text text,
  title text,

  original_text text,
  translation_text text,

  media_type text not null default 'none'
    check (
      media_type in (
        'none',
        'youtube',
        'audio',
        'image'
      )
    ),

  media_url text,
  thumbnail_url text,

  meta_json jsonb not null default '{}'::jsonb,

  sort_order integer not null default 0,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index if not exists
  extra_hundred_days_items_series_sort_idx
on public.extra_hundred_days_items (
  series_id,
  sort_order,
  day_number
);


/*
  기존 휴대폰 / 카드 / 스토리 등을
  백일동반 항목에 연결할 수 있도록 여지를 둠.
*/
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


/* ------------------------------
   RLS
------------------------------ */

alter table public.extra_hundred_days_series
  enable row level security;

alter table public.extra_hundred_days_items
  enable row level security;

alter table public.extra_hundred_days_relations
  enable row level security;


drop policy if exists
  "public read published hundred days series"
on public.extra_hundred_days_series;

create policy
  "public read published hundred days series"
on public.extra_hundred_days_series
for select
using (is_published = true);


drop policy if exists
  "public read published hundred days items"
on public.extra_hundred_days_items;

create policy
  "public read published hundred days items"
on public.extra_hundred_days_items
for select
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
  "public read published hundred days relations"
on public.extra_hundred_days_relations;

create policy
  "public read published hundred days relations"
on public.extra_hundred_days_relations
for select
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
