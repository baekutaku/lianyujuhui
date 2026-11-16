alter table public.extra_pv_items
  add column if not exists videos jsonb not null default '[]'::jsonb;

-- 기존 CN/KR 1개짜리 데이터를 새 videos 배열로 이관
update public.extra_pv_items
set videos = (
  select coalesce(
    jsonb_agg(v),
    '[]'::jsonb
  )
  from (
    select jsonb_build_object(
      'server', 'CN',
      'url', video_cn_url
    ) as v
    where video_cn_url is not null
      and btrim(video_cn_url) <> ''

    union all

    select jsonb_build_object(
      'server', 'KR',
      'url', video_kr_url
    ) as v
    where video_kr_url is not null
      and btrim(video_kr_url) <> ''
  ) x
)
where jsonb_array_length(videos) = 0
  and (
    coalesce(btrim(video_cn_url), '') <> ''
    or
    coalesce(btrim(video_kr_url), '') <> ''
  );
