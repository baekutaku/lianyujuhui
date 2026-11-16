alter table public.extra_pv_relations
  drop constraint if exists extra_pv_relations_target_type_check;

alter table public.extra_pv_relations
  add constraint extra_pv_relations_target_type_check
  check (
    target_type in (
      'card',
      'illustration',
      'story',
      'phone_item',
      'event'
    )
  );
