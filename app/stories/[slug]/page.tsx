import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { deleteStoryBundle } from "@/app/admin/actions";
import ConfirmSubmitButton from "@/components/admin/common/ConfirmSubmitButton";
import StoryDetailHeightSync from "@/components/story/StoryDetailHeightSync";
import { unlockProtectedStory } from "@/app/stories/[slug]/actions";
import { hasStoryAccess } from "@/lib/utils/story-access";
import StoryTranslationSwitcher from "@/components/story/StoryTranslationSwitcher";
import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";
import { getPhoneItemHref } from "@/lib/utils/getPhoneItemHref";

type SearchParamValue = string | string[] | undefined;

type StoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    passwordError?: SearchParamValue;
    q?: SearchParamValue;
    year?: SearchParamValue;
    tab?: SearchParamValue;
    sub?: SearchParamValue;
    tag?: SearchParamValue;
    character?: SearchParamValue;
    scope?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

type RelatedCard = {
  id: string;
  title: string;
  slug: string;
};



type RelatedPhoneItem = {
  id: string;
  title: string;
  slug: string;
  subtype?: string | null;
  content_json?: any;
};

type RelatedEvent = {
  id: string;
  title: string;
  slug: string;
};

type StoryNavCard = {
  id: string;
  title: string;
  slug: string;
  subtype: string | null;
  release_year: number | null;
  release_date: string | null;
  summary?: string | null;
  primary_character_id?: string | null;
  part_no?: number | null;
  chapter_no?: number | null;
  visibility?: string | null;
};

type CharacterRow = {
  id: string;
  key: string;
  name_ko: string;
};

type ItemCharacterRow = {
  item_id: string;
  character_id: string;
};

type TranslationMatchRow = {
  parent_id: string;
};

const STORY_TAB_OPTIONS = [
  {
    key: "main",
    label: "메인스토리",
    subtypes: ["main_story", "behind_story"],
  },
  {
    key: "card",
    label: "데이트",
    subtypes: ["card_story"],
  },
  {
    key: "asmr",
    label: "너의 곁에",
    subtypes: ["asmr"],
  },
  {
    key: "event",
    label: "이벤트 / 기념일",
    subtypes: [],
  },
  {
    key: "side",
    label: "외전",
    subtypes: ["side_story"],
  },
  {
    key: "xiyue",
    label: "서월국",
    subtypes: ["xiyue_story"],
  },
  {
    key: "myhome",
    label: "마이홈",
    subtypes: ["myhome_story"],
  },
  {
    key: "company",
    label: "촬영장 / 회사 프로젝트",
    subtypes: ["company_project"],
  },
  {
    key: "all",
    label: "전체",
    subtypes: [],
  },
] as const;

const SORT_LABEL_MAP: Record<string, string> = {
  latest: "최신순",
  oldest: "오래된순",
  title_asc: "제목순",
};

function toSingleString(value: SearchParamValue) {
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return String(value ?? "").trim();
}

function toStringArray(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const single = String(value ?? "").trim();
  return single ? [single] : [];
}

function getActiveTab(tab: string | undefined) {
  return STORY_TAB_OPTIONS.find((item) => item.key === tab) ?? STORY_TAB_OPTIONS[0];
}

function buildStoriesHref({
  tab,
  sub,
  tag,
  q,
  years,
  characters,
  scope,
  sort,
  page,
}: {
  tab: string;
  sub?: string;
  tag?: string;
  q: string;
  years: string[];
  characters: string[];
  scope: string;
  sort: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (tab) params.set("tab", tab);
  if (sub && sub !== "all") params.set("sub", sub);
  if (tag) params.set("tag", tag);
  if (q) params.set("q", q);
  years.forEach((year) => params.append("year", year));
  characters.forEach((characterKey) => params.append("character", characterKey));
  if (scope) params.set("scope", scope);
  if (sort && sort !== "latest") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/stories?${query}` : "/stories";
}

function compareStories(a: StoryNavCard, b: StoryNavCard, sort: string) {
  const titleCompare = a.title.localeCompare(b.title, "ko");
  const aYear = a.release_year ?? 0;
  const bYear = b.release_year ?? 0;
  const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
  const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
  const aPart = a.part_no ?? 0;
  const bPart = b.part_no ?? 0;
  const aChapter = a.chapter_no ?? 0;
  const bChapter = b.chapter_no ?? 0;

  if (sort === "title_asc") {
    return titleCompare;
  }

  if (sort === "oldest") {
    if (aYear !== bYear) return aYear - bYear;
    if (aDate !== bDate) return aDate - bDate;
    if (aPart !== bPart) return aPart - bPart;
    if (aChapter !== bChapter) return aChapter - bChapter;
    return titleCompare;
  }

  if (aYear !== bYear) return bYear - aYear;
  if (aDate !== bDate) return bDate - aDate;
  if (aPart !== bPart) return bPart - aPart;
  if (aChapter !== bChapter) return bChapter - aChapter;
  return titleCompare;
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function normalizeStoryHtml(html = "") {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

function ProtectedStoryGate({
  slug,
  title,
  hint,
  showError,
  listHref,
}: {
  slug: string;
  title: string;
  hint?: string | null;
  showError?: boolean;
  listHref: string;
}) {
  return (
    <main>
      <section className="page-header">
        <div className="page-eyebrow">Protected Story</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">이 스토리는 비밀번호가 있어야 열람할 수 있습니다.</p>
      </section>

      <section className="detail-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {showError ? (
            <div className="error-box">비밀번호가 올바르지 않습니다.</div>
          ) : null}

          {hint ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                background: "rgba(248, 245, 251, 0.96)",
                border: "1px solid rgba(222, 213, 228, 0.72)",
                color: "var(--text-sub)",
              }}
            >
              힌트: {hint}
            </div>
          ) : null}

          <form action={unlockProtectedStory} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="slug" value={slug} />

            <input
              type="password"
              name="password"
              placeholder="비밀번호 입력"
              autoComplete="off"
              className="story-toolbar-search"
            />

            <button type="submit" className="primary-button">
              열람하기
            </button>
          </form>

          <Link href={listHref} className="nav-link">
  목록으로
</Link>
        </div>
      </section>
    </main>
  );
}

export default async function StoryDetailPage({
  params,
  searchParams,
}: StoryPageProps) {
const { slug: rawSlug } = await params;
const slug = safeDecodeSlug(rawSlug).trim();
const resolvedSearchParams = searchParams ? await searchParams : {};
const admin = await isAdmin();

const passwordError = toSingleString(resolvedSearchParams?.passwordError);
const selectedTag = toSingleString(resolvedSearchParams?.tag);
const q = toSingleString(resolvedSearchParams?.q).toLowerCase();
const tab = toSingleString(resolvedSearchParams?.tab);
const sub = toSingleString(resolvedSearchParams?.sub) || "all";
const scope = toSingleString(resolvedSearchParams?.scope);
const sort = toSingleString(resolvedSearchParams?.sort) || "latest";
const currentPage = Number(toSingleString(resolvedSearchParams?.page) || "1");

const selectedYears = Array.from(
  new Set(
    toStringArray(resolvedSearchParams?.year).filter((value) => /^\d{4}$/.test(value))
  )
).sort((a, b) => Number(b) - Number(a));

const rawSelectedCharacterKeys = Array.from(
  new Set(toStringArray(resolvedSearchParams?.character))
);

const selectedCharacterKeys = Array.from(
  new Set(
    [
      ...rawSelectedCharacterKeys,
      ["card", "asmr", "side", "xiyue", "myhome", "company"].includes(tab) &&
      ["baiqi", "lizeyan", "xumo", "zhouqiluo", "lingxiao"].includes(sub)
        ? sub
        : "",
    ].filter(Boolean)
  )
);

const activeTab = getActiveTab(tab);

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select(
      "id, title, slug, subtype, release_year, is_published, visibility, access_password_hash, access_hint"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (storyError) {
    console.error("[stories/[slug]] story fetch error:", storyError);
  }
  const storiesListHref = buildStoriesHref({
  tab: activeTab.key,
  sub: sub !== "all" ? sub : undefined,
  tag: selectedTag || undefined,
  q,
  years: selectedYears,
  characters: rawSelectedCharacterKeys,
  scope,
  sort,
  page: currentPage,
});

  if (!story) {
    notFound();
  }

   if (story.visibility === "private" && !admin) {
    notFound();
  }

  if (story.visibility === "protected" && !admin) {
    const allowed = await hasStoryAccess(story.id, story.access_password_hash);

    if (!allowed) {
      return (
  <ProtectedStoryGate
    slug={story.slug}
    title={story.title}
    hint={story.access_hint}
    showError={passwordError === "1"}
    listHref={storiesListHref}
  />
);
    }
  }


const { data: characters } = await supabase
  .from("characters")
  .select("id, key, name_ko")
  .order("sort_order", { ascending: true });

const characterRows = (characters ?? []) as CharacterRow[];
const selectedCharacters = characterRows.filter((item) =>
  selectedCharacterKeys.includes(item.key)
);
const selectedCharacterIdSet = new Set(selectedCharacters.map((item) => item.id));

let navQuery = supabase
  .from("stories")
  .select(
    "id, title, slug, subtype, release_year, release_date, summary, primary_character_id, part_no, chapter_no, visibility"
  )
  .eq("is_published", true);

if (!admin) {
  navQuery = navQuery.neq("visibility", "private");
}

if (activeTab.subtypes.length > 0) {
  navQuery = navQuery.in("subtype", [...activeTab.subtypes]);
}

if (selectedYears.length > 0) {
  navQuery = navQuery.in(
    "release_year",
    selectedYears.map((value) => Number(value))
  );
}

const { data: rawStoriesForNav } = await navQuery;
let navStories = (rawStoriesForNav ?? []) as StoryNavCard[];

if (activeTab.key === "main") {
  if (sub === "part1") {
    navStories = navStories.filter(
      (item) => item.subtype === "main_story" && item.part_no === 1
    );
  } else if (sub === "part2") {
    navStories = navStories.filter(
      (item) => item.subtype === "main_story" && item.part_no === 2
    );
  } else if (sub === "part3") {
    navStories = navStories.filter(
      (item) => item.subtype === "main_story" && item.part_no === 3
    );
  } else if (sub === "behind_story") {
    navStories = navStories.filter((item) => item.subtype === "behind_story");
  }
}

const navStoryIds = navStories.map((item) => item.id);
const itemCharacterMap = new Map<string, string[]>();
const storyTagMap = new Map<string, string[]>();

if (navStoryIds.length > 0) {
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("item_id, tag_id, sort_order")
    .eq("item_type", "story")
    .in("item_id", navStoryIds)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((itemTagRows ?? []).map((row) => row.tag_id)));

  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagNameMap = new Map(
      (tagRows ?? []).map((row) => [
        row.id,
        row.label ?? row.name ?? row.slug,
      ])
    );

    (itemTagRows ?? []).forEach((row) => {
      const name = tagNameMap.get(row.tag_id);
      if (!name) return;

      const prev = storyTagMap.get(row.item_id) ?? [];
      prev.push(name);
      storyTagMap.set(row.item_id, prev);
    });
  }
}

if (navStoryIds.length > 0) {
  const { data: itemCharacters } = await supabase
    .from("item_characters")
    .select("item_id, character_id")
    .eq("item_type", "story")
    .in("item_id", navStoryIds);

  (itemCharacters as ItemCharacterRow[] | null)?.forEach((row) => {
    const prev = itemCharacterMap.get(row.item_id) ?? [];
    prev.push(row.character_id);
    itemCharacterMap.set(row.item_id, prev);
  });
}

const totalCharacterCount = characterRows.length;

const getStoryCharacterIds = (item: StoryNavCard) => {
  const set = new Set<string>();

  if (item.primary_character_id) {
    set.add(item.primary_character_id);
  }

  const linkedIds = itemCharacterMap.get(item.id) ?? [];
  linkedIds.forEach((id) => set.add(id));

  return set;
};

if (q && navStoryIds.length > 0) {
  const { data: translationMatches } = await supabase
    .from("translations")
    .select("parent_id")
    .eq("parent_type", "story")
    .in("parent_id", navStoryIds)
    .or(`title.ilike.%${q}%,body.ilike.%${q}%,source_text.ilike.%${q}%`);

  const translationMatchIds = new Set(
    ((translationMatches ?? []) as TranslationMatchRow[]).map((row) => row.parent_id)
  );

  navStories = navStories.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(q);
    const summaryMatch = (item.summary ?? "").toLowerCase().includes(q);
    return titleMatch || summaryMatch || translationMatchIds.has(item.id);
  });
}

navStories = navStories.filter((item) => {
  const characterIds = getStoryCharacterIds(item);

  if (selectedCharacterIdSet.size > 0) {
    if (scope === "route") {
      if (!item.primary_character_id || !selectedCharacterIdSet.has(item.primary_character_id)) {
        return false;
      }
    } else {
      const hasAnySelected = Array.from(selectedCharacterIdSet).some((id) =>
        characterIds.has(id)
      );

      if (!hasAnySelected) {
        return false;
      }
    }
  }

  if (scope === "route" && selectedCharacterIdSet.size === 0) {
    return !!item.primary_character_id;
  }

  if (scope === "multi") {
    return characterIds.size >= 2;
  }

  if (scope === "all_cast") {
    return totalCharacterCount > 0 ? characterIds.size >= totalCharacterCount : false;
  }

  return true;
});

if (selectedTag) {
  navStories = navStories.filter((item) => {
    const tags = storyTagMap.get(item.id) ?? [];
    return tags.includes(selectedTag);
  });
}

navStories.sort((a, b) => compareStories(a, b, sort));

const currentIndex = navStories.findIndex((item) => item.id === story.id);
const prevStory = currentIndex > 0 ? navStories[currentIndex - 1] : null;
const nextStory =
  currentIndex >= 0 && currentIndex < navStories.length - 1
    ? navStories[currentIndex + 1]
    : null;

const buildStoryNavHref = (targetSlug: string) => {
  const params = new URLSearchParams();

  if (tab) params.set("tab", tab);
  if (sub && sub !== "all") params.set("sub", sub);
  if (selectedTag) params.set("tag", selectedTag);
  if (q) params.set("q", q);
  selectedYears.forEach((yearValue) => params.append("year", yearValue));
  rawSelectedCharacterKeys.forEach((characterKey) =>
    params.append("character", characterKey)
  );
  if (scope) params.set("scope", scope);
  if (sort && sort !== "latest") params.set("sort", sort);
  if (currentPage > 1) params.set("page", String(currentPage));

  const query = params.toString();
  return query ? `/stories/${targetSlug}?${query}` : `/stories/${targetSlug}`;
};

const prevStoryHref = prevStory ? buildStoryNavHref(prevStory.slug) : null;
const nextStoryHref = nextStory ? buildStoryNavHref(nextStory.slug) : null;


  const { data: translations, error: translationError } = await supabase
    .from("translations")
    .select(
  "id, title, body, language_code, translation_type, is_primary, is_published, created_at"
)
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (translationError) {
    console.error("[stories/[slug]] translations fetch error:", translationError);
  }

  const visibleTranslations = admin
    ? (translations ?? [])
    : (translations ?? []).filter((translation) => translation.is_published);

  const { data: media, error: mediaError } = await supabase
    .from("media_assets")
    .select(
      "id, media_type, usage_type, url, youtube_video_id, title, is_primary, sort_order"
    )
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error("[stories/[slug]] media fetch error:", mediaError);
  }



  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type")
    .eq("child_type", "story")
    .eq("child_id", story.id);

  if (relationsError) {
    console.error("[stories/[slug]] relations fetch error:", relationsError);
  }

let relatedCards: RelatedCard[] = [];
let relatedPhoneItems: RelatedPhoneItem[] = [];
let relatedEvents: RelatedEvent[] = [];

if (relations && relations.length > 0) {
  const cardRelationIds = relations
    .filter((rel) => rel.parent_type === "card")
    .map((rel) => rel.parent_id);

  const phoneRelationIds = relations
    .filter((rel) => rel.parent_type === "phone_item")
    .map((rel) => rel.parent_id);

  const eventRelationIds = relations
    .filter((rel) => rel.parent_type === "event")
    .map((rel) => rel.parent_id);

  if (cardRelationIds.length > 0) {
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("id, title, slug")
      .in("id", cardRelationIds);

    if (cardsError) {
      console.error("[stories/[slug]] related cards fetch error:", cardsError);
    }

    relatedCards = cards ?? [];
  }

  if (phoneRelationIds.length > 0) {
    const { data: phoneItems, error: phoneError } = await supabase
  .from("phone_items")
  .select("id, title, slug, subtype, content_json")
  .in("id", phoneRelationIds);

    if (phoneError) {
      console.error("[stories/[slug]] related phone items fetch error:", phoneError);
    }

    relatedPhoneItems = phoneItems ?? [];
  }

  if (eventRelationIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, slug")
      .in("id", eventRelationIds);

    if (eventsError) {
      console.error("[stories/[slug]] related events fetch error:", eventsError);
    }

    relatedEvents = events ?? [];
  }
}

const hasConnections =
  relatedCards.length > 0 ||
  relatedPhoneItems.length > 0 ||
  relatedEvents.length > 0;

  return (
    <main>
<section className="story-topbar-layout">
  <section className="detail-panel story-topbar-main-panel">
    <div className="story-topbar-main">
      <p className="page-eyebrow">Archive / Stories</p>

      <h1 className="story-page-title">{story.title}</h1>

      <div className="meta-row story-top-meta">
        <span className="meta-pill">유형: {story.subtype ?? "미분류"}</span>
        <span className="meta-pill">연도: {story.release_year ?? "미정"}</span>
        <span className="meta-pill">
          정렬: {SORT_LABEL_MAP[sort] ?? "최신순"}
        </span>
        {!story.is_published && admin ? (
          <span className="meta-pill">비공개 초안</span>
        ) : null}
      </div>

      <div className="story-top-actions">
        <Link
          href={storiesListHref}
          className="story-action-button story-action-muted"
        >
          목록으로
        </Link>

        {prevStoryHref ? (
          <Link
            href={prevStoryHref}
            className="story-action-button story-action-muted"
          >
            ← 이전 스토리
          </Link>
        ) : (
          <span
            className="story-action-button story-action-muted"
            style={{ opacity: 0.45 }}
          >
            ← 이전 스토리
          </span>
        )}

        {nextStoryHref ? (
          <Link
            href={nextStoryHref}
            className="story-action-button story-action-muted"
          >
            다음 스토리 →
          </Link>
        ) : (
          <span
            className="story-action-button story-action-muted"
            style={{ opacity: 0.45 }}
          >
            다음 스토리 →
          </span>
        )}

        {admin ? (
          <>
            <Link
              href={`/admin/stories/${encodeURIComponent(story.slug)}/edit`}
              className="story-action-button"
            >
              관리자 수정
            </Link>

            <Link
              href="/admin/stories/new"
              className="story-action-button story-action-muted"
            >
              새 스토리 등록
            </Link>

            <form action={deleteStoryBundle} style={{ display: "inline-flex" }}>
              <input type="hidden" name="storyId" value={story.id} />
              <ConfirmSubmitButton
                label="삭제"
                confirmMessage={`정말 삭제할까요?\n\n${story.title}`}
                className="story-action-button story-action-danger"
              />
            </form>
          </>
        ) : null}
      </div>
    </div>
  </section>

 {hasConnections ? (
  <aside className="story-topbar-side">
    {relatedCards.length > 0 ? (
      <details className="story-side-block story-side-disclosure">
        <summary className="story-side-summary">
          <div className="story-side-title-row">
            <h2 className="story-side-title">연결된 카드</h2>
            <span className="story-side-count">{relatedCards.length}</span>
          </div>
          <span className="story-side-toggle" aria-hidden="true">
            ▾
          </span>
        </summary>

        <div className="story-side-content">
          <div className="story-side-links">
            {relatedCards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.slug}`}
                className="story-side-chip"
                title={card.title}
              >
                {card.title}
              </Link>
            ))}
          </div>
        </div>
      </details>
    ) : null}

    {relatedPhoneItems.length > 0 ? (
      <details className="story-side-block story-side-disclosure">
        <summary className="story-side-summary">
          <div className="story-side-title-row">
            <h2 className="story-side-title">연결된 휴대폰</h2>
            <span className="story-side-count">{relatedPhoneItems.length}</span>
          </div>
          <span className="story-side-toggle" aria-hidden="true">
            ▾
          </span>
        </summary>

        <div className="story-side-content">
          <div className="story-side-links">
            {relatedPhoneItems.map((item) => (
  <Link
    key={item.id}
    href={getPhoneItemHref(item)}
    className="story-side-chip"
    title={item.title}
  >
    {item.title}
  </Link>
))}
          </div>
        </div>
      </details>
    ) : null}

    {relatedEvents.length > 0 ? (
      <details className="story-side-block story-side-disclosure">
        <summary className="story-side-summary">
          <div className="story-side-title-row">
            <h2 className="story-side-title">연결된 이벤트</h2>
            <span className="story-side-count">{relatedEvents.length}</span>
          </div>
          <span className="story-side-toggle" aria-hidden="true">
            ▾
          </span>
        </summary>

        <div className="story-side-content">
          <div className="story-side-links">
            {relatedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="story-side-chip"
                title={event.title}
              >
                {event.title}
              </Link>
            ))}
          </div>
        </div>
      </details>
    ) : null}
  </aside>
) : null}
</section>
      <StoryDetailHeightSync />

      <section className="story-main-grid">
        <div className="detail-panel story-media-panel">
  <StoryMediaSwitcher storyTitle={story.title} media={media ?? []} />
</div>

        <div className="detail-panel story-translation-panel">
  {translationError ? (
    <pre className="error-box">
      {JSON.stringify(translationError, null, 2)}
    </pre>
  ) : null}

  {!visibleTranslations || visibleTranslations.length === 0 ? (
    <div className="empty-box">등록된 번역이 없습니다.</div>
  ) : (
    <StoryTranslationSwitcher translations={visibleTranslations} />
  )}
</div>
      </section>

      
    </main>
  );
}