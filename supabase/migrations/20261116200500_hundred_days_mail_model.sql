/*
  Hundred Days final content model
  - prologue: 사전 이야기
  - day: DAY 0 ~ DAY 100
  - special: 총결 / 彩蛋 등
  - voice는 entry type이 아니라 day/special의 속성
*/

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
  add column if not exists is_voice boolean
  not null default false;


alter table public.extra_hundred_days_items
  add column if not exists image_url text;


/* DAY 번호는 0 ~ 100 */
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


/* 같은 시리즈에서 DAY 중복 금지 */
create unique index if not exists
  extra_hundred_days_unique_day_idx
on public.extra_hundred_days_items (
  series_id,
  day_number
)
where entry_type = 'day';


/* 사전 이야기는 시리즈당 하나 */
create unique index if not exists
  extra_hundred_days_unique_prologue_idx
on public.extra_hundred_days_items (
  series_id
)
where entry_type = 'prologue';


create index if not exists
  extra_hundred_days_day_sort_idx
on public.extra_hundred_days_items (
  series_id,
  day_number
)
where entry_type = 'day';
