import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import HomeSectionCarousel from "@/components/home/HomeSectionCarousel";

type StoryRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number | null;
  release_date: string | null;
  summary: string | null;
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number | null;
  start_date: string | null;
  end_date: string | null;
  thumbnail_url: string | null;
  summary: string | null;
};

type MediaRow = {
  parent_id: string;
  media_type: string;
  usage_type: string | null;
  url: string | null;
  youtube_video_id: string | null;
  thumbnail_url?: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
};

type PhoneItemRow = {
  id: string;
  title: string | null;
  slug: string | null;
  subtype: string;
  created_at: string;
  is_published?: boolean | null;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;

    authorKey?: string;
    authorName?: string;
    authorAvatarUrl?: string;
    authorHasProfile?: boolean;

    momentImageUrls?: string[];
    coverImageUrl?: string;
    coverUrl?: string;
    thumbnailUrl?: string;
  } | null;
};

type HomeCard = {
  id: string;
  title: string;
  href: string;
  thumb: string;
  meta: string;
};

type HomeSection = {
  title: string;
  href: string;
  items: HomeCard[];
};

function pickMediaThumb(items: MediaRow[]) {
  const coverImage = items.find(
    (media) => media.media_type === "image" && media.usage_type === "cover" && media.url
  );
  if (coverImage?.url) return coverImage.url;

  const normalImage = items.find(
    (media) => media.media_type === "image" && media.url
  );
  if (normalImage?.url) return normalImage.url;

  const youtubeWithThumb = items.find(
    (media) =>
      media.media_type === "youtube" &&
      (media.thumbnail_url || media.youtube_video_id)
  );

  if (youtubeWithThumb?.thumbnail_url) return youtubeWithThumb.thumbnail_url;
  if (youtubeWithThumb?.youtube_video_id) {
    return `https://img.youtube.com/vi/${youtubeWithThumb.youtube_video_id}/hqdefault.jpg`;
  }

  return "";
}

function formatStoryMeta(story: StoryRow) {
  if (story.release_date) return `#${story.release_date}`;
  if (story.release_year) return `#${story.release_year}`;
  return "";
}

function formatEventMeta(event: EventRow) {
  if (event.start_date) return `#${event.start_date}`;
  if (event.release_year) return `#${event.release_year}`;
  return "";
}

function getPhoneThumb(item: PhoneItemRow) {
  const json = item.content_json;

  if (item.subtype === "moment") {
    const momentImages = Array.isArray(json?.momentImageUrls)
      ? json.momentImageUrls.filter(Boolean)
      : [];
    if (momentImages.length > 0) return momentImages[0] || "";
    if (json?.authorAvatarUrl?.trim()) return json.authorAvatarUrl.trim();
  }

  if (item.subtype === "message") {
    if (json?.avatarUrl?.trim()) return json.avatarUrl.trim();
  }

  if (item.subtype === "call" || item.subtype === "video_call") {
    if (json?.coverImageUrl?.trim()) return json.coverImageUrl.trim();
    if (json?.coverUrl?.trim()) return json.coverUrl.trim();
    if (json?.thumbnailUrl?.trim()) return json.thumbnailUrl.trim();
    if (json?.avatarUrl?.trim()) return json.avatarUrl.trim();
  }

  return "";
}

function getPhoneHref(item: PhoneItemRow) {
  const json = item.content_json;

  if (item.subtype === "moment") {
    const characterKey = json?.authorKey?.trim() || "other";
    const slug = String(item.slug || "").trim();
    if (!slug) return "/phone-items/moments";
    return `/phone-items/moments/${characterKey}/${encodeURIComponent(slug)}`;
  }

  if (item.subtype === "message") {
    const characterKey = json?.characterKey?.trim() || "baiqi";
    const slug = String(item.slug || "").trim();
    if (!slug) return "/phone-items/messages";
    return `/phone-items/messages/${characterKey}/${encodeURIComponent(slug)}`;
  }

  if (item.subtype === "call" || item.subtype === "video_call") {
    return "/phone-items/calls";
  }

  return "/phone-items";
}

function getPhoneMeta(subtype: string) {
  if (subtype === "moment") return "#모멘트";
  if (subtype === "message") return "#문자";
  if (subtype === "call") return "#통화";
  if (subtype === "video_call") return "#영상통화";
  return "#휴대폰";
}

async function getLatestStoriesBySubtype(
  title: string,
  href: string,
  subtype: string
): Promise<HomeSection> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year, release_date, summary")
    .eq("is_published", true)
    .eq("subtype", subtype)
    .order("release_date", { ascending: false })
    .order("release_year", { ascending: false })
    .order("title", { ascending: true })
    .limit(10);

  if (error) {
    console.error(`[HomeMixedBody] ${title} fetch error:`, error);
    return { title, href, items: [] };
  }

  const rows = (stories as StoryRow[] | null) ?? [];
  if (rows.length === 0) return { title, href, items: [] };

  const ids = rows.map((row) => row.id);

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select(
      "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
    )
    .eq("parent_type", "story")
    .in("parent_id", ids)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error(`[HomeMixedBody] ${title} media error:`, mediaError);
  }

  const grouped = new Map<string, MediaRow[]>();
  (mediaAssets as MediaRow[] | null)?.forEach((item) => {
    const arr = grouped.get(item.parent_id) ?? [];
    arr.push(item);
    grouped.set(item.parent_id, arr);
  });

  const items: HomeCard[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: `/stories/${encodeURIComponent(row.slug)}`,
    thumb: pickMediaThumb(grouped.get(row.id) ?? []),
    meta: formatStoryMeta(row),
  }));

  return { title, href, items };
}

async function getLatestPhoneSection(): Promise<HomeSection> {
  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, created_at, is_published, content_json")
    .eq("is_published", true)
    .in("subtype", ["moment", "message", "call", "video_call"])
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[HomeMixedBody] phone_items fetch error:", error);
    return { title: "모멘트 / 문자 / 통화", href: "/phone-items", items: [] };
  }

  const rows = (data as PhoneItemRow[] | null) ?? [];

  const items: HomeCard[] = rows.map((row) => ({
    id: row.id,
    title: row.title?.trim() || "제목 없음",
    href: getPhoneHref(row),
    thumb: getPhoneThumb(row),
    meta: getPhoneMeta(row.subtype),
  }));

  return {
    title: "모멘트 / 문자 / 통화",
    href: "/phone-items",
    items,
  };
}

async function getLatestEventSection(): Promise<HomeSection> {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, slug, subtype, release_year, start_date, end_date, thumbnail_url, summary")
    .eq("is_published", true)
    .order("start_date", { ascending: false })
    .order("release_year", { ascending: false })
    .order("title", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[HomeMixedBody] events fetch error:", error);
    return { title: "이벤트", href: "/events", items: [] };
  }

  const rows = (events as EventRow[] | null) ?? [];
  if (rows.length === 0) return { title: "이벤트", href: "/events", items: [] };

  const ids = rows.map((row) => row.id);

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select(
      "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
    )
    .eq("parent_type", "event")
    .in("parent_id", ids)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error("[HomeMixedBody] events media error:", mediaError);
  }

  const grouped = new Map<string, MediaRow[]>();
  (mediaAssets as MediaRow[] | null)?.forEach((item) => {
    const arr = grouped.get(item.parent_id) ?? [];
    arr.push(item);
    grouped.set(item.parent_id, arr);
  });

  const items: HomeCard[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: `/events/${encodeURIComponent(row.slug)}`,
    thumb: row.thumbnail_url?.trim() || pickMediaThumb(grouped.get(row.id) ?? []),
    meta: formatEventMeta(row),
  }));

  return { title: "이벤트", href: "/events", items };
}

export default async function HomeMixedBody() {
  const [mainStory, sideStory, dateStory, phoneSection, eventSection] =
  await Promise.all([
    getLatestStoriesBySubtype("메인스토리", "/stories?subtype=main_story", "main_story"),
    getLatestStoriesBySubtype("외전", "/stories?subtype=side_story", "side_story"),
    getLatestStoriesBySubtype("데이트", "/stories?subtype=card_story", "card_story"),
    getLatestPhoneSection(),
    getLatestEventSection(),
  ]);

  const leftRail = [mainStory, dateStory];
const middleRail = [sideStory, eventSection];
const rightRail = [phoneSection];

  const sections = [mainStory, sideStory, dateStory, phoneSection, eventSection];

  return (
    <section className="home-mixed-layout">
  <div className="home-mixed-main">
    {sections.map((section) => (
      <HomeSectionCarousel
        key={section.title}
        title={section.title}
        href={section.href}
        items={section.items}
      />
    ))}
  </div>

  <aside className="home-mixed-side">
    <section className="home-mixed-panel">
      <p className="home-mixed-eyebrow">NOTICE</p>
      <h3 className="home-mixed-side-title">아카이브 메모</h3>
      <ul className="home-mixed-list">
        <li>KR 콘텐츠는 2023년 1월 종료 시점 기준으로 기록.</li>
        <li>1부는 전반 자료, 2부 이후는 선택적 정리.</li>
        <li>CN은 최신 카드/스토리 비중이 높음.</li>
      </ul>
    </section>

    <section className="home-film-layout">
  <div className="home-film-rail">
    {leftRail.map((section) => (
      <HomeSectionCarousel
        key={section.title}
        title={section.title}
        href={section.href}
        items={section.items}
      />
    ))}
  </div>

  <div className="home-film-rail">
    {middleRail.map((section) => (
      <HomeSectionCarousel
        key={section.title}
        title={section.title}
        href={section.href}
        items={section.items}
      />
    ))}
  </div>

  <div className="home-film-rail home-film-rail-side">
    {rightRail.map((section) => (
      <HomeSectionCarousel
        key={section.title}
        title={section.title}
        href={section.href}
        items={section.items}
      />
    ))}

    <section className="home-mixed-panel">
      <p className="home-mixed-eyebrow">NOTICE</p>
      <h3 className="home-mixed-side-title">아카이브 메모</h3>
      <ul className="home-mixed-list">
        <li>KR 콘텐츠는 2023년 1월 종료 시점 기준으로 기록.</li>
        <li>1부는 전반 자료, 2부 이후는 선택적 정리.</li>
        <li>CN은 최신 카드/스토리 비중이 높음.</li>
      </ul>
    </section>

    <section className="home-mixed-panel">
      <p className="home-mixed-eyebrow">NAVIGATION</p>
      <h3 className="home-mixed-side-title">빠른 이동</h3>

      <div className="home-mixed-linkboxes">
        <Link href="/cards" className="home-mixed-linkbox">
          <strong>카드</strong>
          <span>진화 전후 / 관련 링크</span>
        </Link>

        <Link href="/stories" className="home-mixed-linkbox">
          <strong>스토리</strong>
          <span>메인 / 외전 / 데이트</span>
        </Link>

        <Link href="/phone-items" className="home-mixed-linkbox">
          <strong>휴대폰</strong>
          <span>모멘트 / 문자 / 통화</span>
        </Link>

        <Link href="/events" className="home-mixed-linkbox">
          <strong>이벤트</strong>
          <span>시즌 이벤트</span>
        </Link>
      </div>
    </section>
  </div>
</section>
  </aside>
</section>
  );
}