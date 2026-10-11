alter table public.calendar_entries
  add column if not exists end_date date;
