create table if not exists public.extra_pv_relations (
  id uuid primary key default gen_random_uuid(),

  pv_id uuid not null
    references public.extra_pv_items(id)
    on delete cascade,

  target_type text not null
    check (
      target_type in (
        'card',
        'story',
        'phone_item',
        'event'
      )
    ),

  target_id uuid not null,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  unique (
    pv_id,
    target_type,
    target_id
  )
);

create index if not exists
  extra_pv_relations_pv_idx
  on public.extra_pv_relations (
    pv_id,
    target_type,
    sort_order
  );

alter table public.extra_pv_relations
  enable row level security;

drop policy if exists
  "extra pv relations public read"
  on public.extra_pv_relations;

create policy
  "extra pv relations public read"
  on public.extra_pv_relations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.extra_pv_items pv
      where pv.id = pv_id
        and pv.is_published = true
    )
  );
