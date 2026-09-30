import { supabase } from "@/lib/supabase/server";
import HomeSectionCarousel from "@/components/home/HomeSectionCarousel";
import MiniMusicPlayer from "@/components/home/MiniMusicPlayer";
import { isAdmin } from "@/lib/utils/admin-auth";
import HomeCalendarWidget from "@/components/home/HomeCalendarWidget";
import { getPhoneItemHref } from "@/lib/utils/getPhoneItemHref";
import HomeGuestbookTabs from "@/components/home/HomeGuestbookTabs";
import { unstable_noStore as noStore } from "next/cache";

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

type GuestbookListRow = {
  id: string;
  nickname: string | null;
  content: string | null;
  is_private: boolean;
  admin_reply: string | null;
  created_at: string;
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

async function getGuestbookList(admin: boolean): Promise<GuestbookListRow[]> {
  const { data, error } = await supabase
    .from("guestbook_entries")
    .select("id, nickname, content, is_private, admin_reply, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[HomeMixedBody] guestbook list fetch error:", error);
    return [];
  }

  const rows =
    (data as {
      id: string;
      nickname: string | null;
      content: string;
      is_private: boolean;
      admin_reply: string | null;
      created_at: string;
    }[] | null) ?? [];

  if (admin) return rows;

  return rows.map((row) =>
    row.is_private
      ? { ...row, content: null, admin_reply: null }
      : row
  );
}

type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  target_area: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
};

type HomeMixedBodyProps = {
  lead?: React.ReactNode;
  updates?: SiteUpdate[];
};

export default async function HomeMixedBody({ lead, updates = [] }: HomeMixedBodyProps) {
  noStore();

  const admin = await isAdmin();

  const [
    mainStory,
    sideStory,
    dateStory,
    eventSection,
    phoneSection,
    calendarEntries,
    guestbookList,
  ] = await Promise.all([
    getLatestStoriesBySubtype("메인스토리", "/stories?tab=main", "main_story"),
    getLatestStoriesBySubtype("외전", "/stories?tab=side", "side_story"),
    getLatestStoriesBySubtype("데이트", "/stories?tab=card", "card_story"),
    getLatestEventSection(),
    getLatestPhoneSection(),
    getCalendarEntries(),
    getGuestbookList(admin),
  ]);

  const sections = [mainStory, sideStory, dateStory, eventSection, phoneSection];

  return (
    <section className="home-game-layout">
      {lead ? <div className="home-game-lead">{lead}</div> : null}

      <section id="archive-stream" className="home-archive-stream">
        <div className="home-archive-stream-head">
          <div>
            <span>LATEST ARCHIVE</span>
            <strong>최근 자료</strong>
          </div>
          <p>게임형 홈 아래에는 기존 아카이브의 최신 자료를 그대로 이어서 보여줍니다.</p>
        </div>

        <div className="home-archive-section-stack">
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
      </section>

      <section id="home-utilities" className="home-utility-zone">
        <div className="home-utility-heading">
          <div>
            <span>ARCHIVE DESK</span>
            <strong>아카이브 데스크</strong>
          </div>
          <p>방명록 · 업데이트 · 음악 · 캘린더</p>
        </div>

        <section className="home-widget-panel home-recent-updates-panel home-recent-updates-strip">
          <p className="home-widget-eyebrow">RECENT UPDATE</p>
          <div className="home-recent-update-list">
            {updates.slice(0, 5).map((item) => (
              <article key={item.id}>
                <span aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.published_at?.slice(0, 10) || item.category || "업데이트"}</small>
                </div>
              </article>
            ))}
            {updates.length === 0 ? (
              <p className="home-recent-update-empty">등록된 업데이트가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <div className="home-utility-grid home-utility-grid-aligned">
          <div className="home-utility-card home-utility-guestbook">
            <HomeGuestbookTabs isAdmin={admin} guestbookItems={guestbookList} />
          </div>

          <section className="home-widget-panel home-utility-music">
            <p className="home-widget-eyebrow">MUSIC</p>
            <MiniMusicPlayer />
          </section>

          <section className="home-widget-panel home-utility-calendar">
            <p className="home-widget-eyebrow">CALENDAR</p>
            <HomeCalendarWidget entries={calendarEntries} isAdmin={admin} />
          </section>
        </div>
      </section>
    </section>
  );
}
