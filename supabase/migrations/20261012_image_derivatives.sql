-- Image derivative registry
-- Source URLs remain canonical content data.
-- Optimized/mirrored files are cache artifacts registered separately.

create extension if not exists pgcrypto;

create table if not exists public.image_derivatives (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  source_kind text not null default 'external'
    check (source_kind in ('r2_upload', 'legacy_r2', 'external')),
  mirrored_original_url text,
  display_url text,
  thumb_url text,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed')),
  content_type text,
  width integer,
  height integer,
  original_bytes bigint,
  display_bytes bigint,
  thumb_bytes bigint,
  source_etag text,
  last_error text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists image_derivatives_status_idx
  on public.image_derivatives(status);

create index if not exists image_derivatives_source_kind_idx
  on public.image_derivatives(source_kind);

alter table public.image_derivatives enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'image_derivatives'
      and policyname = 'public read image derivatives'
  ) then
    create policy "public read image derivatives"
      on public.image_derivatives
      for select
      using (true);
  end if;
end $$;

comment on table public.image_derivatives is
  'Derived image registry. Content tables keep clean source URLs; mirrors and resized files live here.';
