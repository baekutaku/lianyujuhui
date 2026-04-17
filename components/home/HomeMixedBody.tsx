import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import HomeSectionCarousel from "@/components/home/HomeSectionCarousel";
import MiniMusicPlayer from "@/components/home/MiniMusicPlayer";
import { isAdmin } from "@/lib/utils/admin-auth";
import HomeCalendarWidget from "@/components/home/HomeCalendarWidget";
import { getPhoneItemHref } from "@/lib/utils/getPhoneItemHref";

type StoryRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number | null;
  release_date: string | null;
  created_at: string | null;
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number | null;
  start_date: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
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
  created_at: string | null;
  content_json?: {
    characterKey?: string;
    avatarUrl?: string;
    authorKey?: string;
    authorAvatarUrl?: string;
    momentImageUrls?: string[];
    coverImageUrl?: string;
    coverUrl?: string;
    thumbnailUrl?: string;
    previewText?: string;
    latestMessage?: string;
    text?: string;
    body?: string;
    content?: string;
    description?: string;
    summary?: string;
  } | null;
};

type HomeCard = {
  id: string;
  title: string;
  href: string;
  thumb: string;
  meta: string;
  excerpt?: string;
};

type HomeSection = {
  title: string;
  href: string;
  items: HomeCard[];
};

type CalendarEntryRow = {
  id: string;
  title: string;
  schedule_date: string;
  note: string | null;
  kind: string;
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

function cleanPreviewText(value?: string | null) {
  const text = String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  return text.length > 56 ? `${text.slice(0, 56)}…` : text;
}

function getPhoneThumb(item: PhoneItemRow) {
  const json = item.content_json;

  if (item.subtype === "moment") {
    const images = Array.isArray(json?.momentImageUrls)
      ? json.momentImageUrls.filter(Boolean)
      : [];
    if (images.length > 0) return images[0] || "";
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

  if (item.subtype === "article") {
    if (json?.thumbnailUrl?.trim()) return json.thumbnailUrl.trim();
    if (json?.coverImageUrl?.trim()) return json.coverImageUrl.trim();
    if (json?.coverUrl?.trim()) return json.coverUrl.trim();
  }

  return "";
}

function getPhoneExcerpt(item: PhoneItemRow) {
  const json = item.content_json ?? {};

  if (item.subtype === "message") {
    return (
      cleanPreviewText(json.latestMessage) ||
      cleanPreviewText(json.previewText) ||
      cleanPreviewText(json.text) ||
      cleanPreviewText(json.body) ||
      cleanPreviewText(json.content) ||
      "문자 미리보기"
    );
  }

  if (item.subtype === "moment") {
    return (
      cleanPreviewText(json.previewText) ||
      cleanPreviewText(json.text) ||
      cleanPreviewText(json.body) ||
      cleanPreviewText(json.content) ||
      cleanPreviewText(json.description) ||
      "모멘트 미리보기"
    );
  }

  if (item.subtype === "call" || item.subtype === "video_call") {
    return (
      cleanPreviewText(json.summary) ||
      cleanPreviewText(json.description) ||
      cleanPreviewText(json.previewText) ||
      "통화 콘텐츠"
    );
  }

  if (item.subtype === "article") {
    return (
      cleanPreviewText(json.summary) ||
      cleanPreviewText(json.description) ||
      cleanPreviewText(json.body) ||
      cleanPreviewText(json.content) ||
      "기사 콘텐츠"
    );
  }

  return "휴대폰 콘텐츠";
}

function getPhoneMeta(subtype: string) {
  if (subtype === "moment") return "#모멘트";
  if (subtype === "message") return "#문자";
  if (subtype === "call") return "#통화";
  if (subtype === "video_call") return "#영상통화";
  if (subtype === "article") return "#기사";
  return "#휴대폰";
}

async function getLatestStoriesBySubtype(
  title: string,
  href: string,
  subtype: string
): Promise<HomeSection> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year, release_date, created_at")
    .eq("is_published", true)
    .eq("subtype", subtype)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(`[HomeMixedBody] ${title} fetch error:`, error);
    return { title, href, items: [] };
  }

  const rows = (stories ?? []) as StoryRow[];
  if (rows.length === 0) {
    return { title, href, items: [] };
  }

  const ids = rows.map((row) => row.id);

  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select(
      "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
    )
    .eq("parent_type", "story")
    .in("parent_id", ids)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const grouped = new Map<string, MediaRow[]>();
  (mediaAssets as MediaRow[] | null)?.forEach((item) => {
    const arr = grouped.get(item.parent_id) ?? [];
    arr.push(item);
    grouped.set(item.parent_id, arr);
  });

  return {
    title,
    href,
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      href: `/stories/${encodeURIComponent(row.slug)}`,
      thumb: pickMediaThumb(grouped.get(row.id) ?? []),
      meta: formatStoryMeta(row) || (row.created_at?.slice(0, 10) ?? ""),
    })),
  };
}

async function getLatestPhoneSection(): Promise<HomeSection> {
  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, created_at, content_json")
    .eq("is_published", true)
    .in("subtype", ["moment", "message", "call", "video_call", "article"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[HomeMixedBody] phone_items fetch error:", error);
    return { title: "휴대폰", href: "/phone-items", items: [] };
  }

  const rows = (data as PhoneItemRow[] | null) ?? [];

  return {
    title: "휴대폰",
    href: "/phone-items",
    items: rows.map((row) => ({
      id: row.id,
      title: row.title?.trim() || "제목 없음",
      href: getPhoneItemHref(row),
      thumb: getPhoneThumb(row),
      meta: getPhoneMeta(row.subtype),
      excerpt: getPhoneExcerpt(row),
    })),
  };
}

async function getLatestEventSection(): Promise<HomeSection> {
  const { data: rows, error } = await supabase
    .from("events")
    .select("id, title, slug, subtype, release_year, start_date, thumbnail_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[HomeMixedBody] event fetch error:", error);
    return { title: "이벤트", href: "/stories?tab=event", items: [] };
  }

  const eventRows = (rows ?? []) as EventRow[];
  if (eventRows.length === 0) {
    return { title: "이벤트", href: "/stories?tab=event", items: [] };
  }

  const ids = eventRows.map((row) => row.id);

  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select(
      "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
    )
    .eq("parent_type", "event")
    .in("parent_id", ids)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const grouped = new Map<string, MediaRow[]>();
  (mediaAssets as MediaRow[] | null)?.forEach((item) => {
    const arr = grouped.get(item.parent_id) ?? [];
    arr.push(item);
    grouped.set(item.parent_id, arr);
  });

  return {
    title: "이벤트",
    href: "/stories?tab=event",
    items: eventRows.map((row) => ({
      id: row.id,
      title: row.title,
      href: `/events/${encodeURIComponent(row.slug)}`,
      thumb: row.thumbnail_url?.trim() || pickMediaThumb(grouped.get(row.id) ?? []),
      meta: row.created_at?.slice(0, 10) ?? "",
    })),
  };
}

async function getCalendarEntries(): Promise<CalendarEntryRow[]> {
  const { data, error } = await supabase
    .from("calendar_entries")
    .select("id, title, schedule_date, note, kind")
    .eq("is_published", true)
    .order("schedule_date", { ascending: true })
    .limit(120);

  if (error) {
    console.error("[HomeMixedBody] calendar_entries fetch error:", error);
    return [];
  }

  return (data as CalendarEntryRow[] | null) ?? [];
}

export default async function HomeMixedBody() {
  const [
    mainStory,
    sideStory,
    dateStory,
    eventSection,
    phoneSection,
    calendarEntries,
    admin,
  ] = await Promise.all([
    getLatestStoriesBySubtype("메인스토리", "/stories?tab=main", "main_story"),
    getLatestStoriesBySubtype("외전", "/stories?tab=side", "side_story"),
    getLatestStoriesBySubtype("데이트", "/stories?tab=card", "card_story"),
    getLatestEventSection(),
    getLatestPhoneSection(),
    getCalendarEntries(),
    isAdmin(),
  ]);

  const sections = [mainStory, sideStory, dateStory, eventSection, phoneSection];

  return (
    <section className="home-classic-layout">
      <div className="home-classic-main">
        {sections.map((section) => (
          <HomeSectionCarousel
            key={section.title}
            title={section.title}
            href={section.href}
            items={section.items}
            autoMs={10000}
          />
        ))}
      </div>

      <aside className="home-classic-side">
        <section className="home-widget-panel">
          <p className="home-widget-eyebrow">NOTICE</p>

          <ul className="home-mixed-list">
            <li>1부는 전반 자료, 2부 이후로는 백기 위주 정리. </li>
                <li>비전문가 AI 때려서 만든 공간이기 때문에 오류가 다분합니다. </li><li>문제가 있을 경우 트위터나 익명함으로 남겨주세요.</li>
          </ul>
        </section>

        <section className="home-widget-panel">
          <p className="home-widget-eyebrow">RECENT 임시</p>

          <div className="home-widget-list">
            <Link href="/stories">최신 스토리 업데이트</Link>
            <Link href="/stories?tab=event">최근 이벤트 정리</Link>
            <Link href="/phone-items">휴대폰 콘텐츠 보강</Link>
            <Link href="/stories">외전 백업 추가</Link>
            <Link href="/cards">카드 연동 보완</Link>
            <Link href="/cards">휴대폰 UI 익명커스텀 제작</Link>
          </div>
        </section>

        <section className="home-widget-panel">
          <p className="home-widget-eyebrow">MUSIC</p>
          <MiniMusicPlayer />
        </section>

        <section className="home-widget-panel">
          <p className="home-widget-eyebrow">CALENDAR</p>
          <HomeCalendarWidget entries={calendarEntries} isAdmin={admin} />
        </section>

        <section className="home-widget-panel">
          <p className="home-widget-eyebrow">BANNER</p>

          <Link href="/stories?tab=event" className="home-widget-banner">
            <img src="/images/home/banner-01.jpg" alt="이벤트 배너" />
          </Link>
          <Link href="/stories?tab=event" className="home-widget-banner">
            <img src="/images/home/banner-02.jpg" alt="이벤트 배너" />
          </Link>
          <Link href="/stories?tab=event" className="home-widget-banner">
            <img src="/images/home/banner-03.jpg" alt="이벤트 배너" />
          </Link>
          <Link href="/stories?tab=event" className="home-widget-banner">
            <img src="/images/home/banner-04.jpg" alt="이벤트 배너" />
          </Link>
          <Link href="/stories?tab=event" className="home-widget-banner">
            <img src="/images/home/banner-05.jpg" alt="이벤트 배너" />
          </Link>
        </section>
      </aside>
    </section>
  );
}