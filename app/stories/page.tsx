import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";


type SearchParamValue = string | string[] | undefined;

type StoryCard = {
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

type StoryThumb = {
  parent_id: string;
  media_type: string;
  usage_type: string | null;
  url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
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

type PageProps = {
  searchParams?: Promise<{
    q?: SearchParamValue;
    year?: SearchParamValue;
    tab?: SearchParamValue;
    character?: SearchParamValue;
    scope?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};


const STORY_TAB_OPTIONS = [
  {
    key: "main",
    label: "메인스토리",
    subtypes: ["main_story", "behind_story"],
    desc: "시작 / 막후의 장 중심으로 보는 메인스토리 묶음",
  },
  {
    key: "card",
    label: "데이트",
    subtypes: ["card_story"],
    desc: "카드 연계 데이트 스토리",
  },
  {
    key: "asmr",
    label: "너의 곁에",
    subtypes: ["asmr"],
    desc: "ASMR / 오디오형 스토리, 데이트와도 연결되는 서사",
  },
  {
    key: "event",
    label: "이벤트 / 기념일",
    subtypes: ["event_story"],
    desc: "생일, 기념일, 시즌, 이벤트 서사",
  },
  {
    key: "side",
    label: "외전",
    subtypes: ["side_story"],
    desc: "메인과 연결되지만 별도 분류가 필요한 외전 스토리",
  },
  {
    key: "xiyue",
    label: "서월국",
    subtypes: ["xiyue_story"],
    desc: "다른 세계관 / 서월국 관련 스토리",
  },
  {
    key: "myhome",
    label: "마이홈",
    subtypes: ["myhome_story"],
    desc: "마이홈 / 개인 루트 성격의 스토리",
  },
  {
    key: "company",
    label: "회사 프로젝트",
    subtypes: ["company_project"],
    desc: "촬영장 / 시티뉴스 등 회사 프로젝트 계열",
  },
  {
    key: "all",
    label: "전체",
    subtypes: [],
    desc: "등록된 전체 스토리",
  },
] as const;

const SUBTYPE_LABELS: Record<string, string> = {
  card_story: "데이트",
  main_story: "메인스토리",
  event_story: "이벤트 스토리",
  side_story: "외전",
  asmr: "너의 곁에",
  behind_story: "막후의 장",
  xiyue_story: "서월국",
  myhome_story: "마이홈",
  company_project: "회사 프로젝트",
};

const NOTICE_ITEMS = [
  "KR 서버 종료 기준으로 개인 백업 및 번역 정리 중",
  "메인스토리 / 데이트 중심으로 우선 정리",
  "일부 스토리는 미번역 / 미백업 상태일 수 있음",
  "태그 검색 / 연결 검색은 다음 단계에서 추가 예정",
];

const SCOPE_OPTIONS = [
  { key: "", label: "등장 범위 전체" },
  { key: "route", label: "루트 중심" },
  { key: "contains", label: "선택 캐릭터 포함" },
  { key: "multi", label: "2인 이상 등장" },
  { key: "all_cast", label: "전체 등장" },
] as const;

const SORT_OPTIONS = [
  { key: "latest", label: "최신순" },
  { key: "oldest", label: "오래된순" },
  { key: "title_asc", label: "제목순" },
] as const;

const STORIES_PER_PAGE = 12;



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

function getSubtypeLabel(subtype: string | null) {
  if (!subtype) return "미분류";
  return SUBTYPE_LABELS[subtype] ?? subtype;
}

function getVisibilityLabel(visibility: string | null | undefined, admin: boolean) {
  if (visibility === "protected") return "비밀번호 필요";
  if (visibility === "private" && admin) return "비공개";
  return null;
}

function formatStoryDate(story: StoryCard) {
  if (story.release_date) return story.release_date;
  if (story.release_year) return `${story.release_year}`;
  return "날짜 미정";
}

function buildStoriesHref({
  tab,
  q,
  years,
  characters,
  scope,
  sort,
  page,
}: {
  tab: string;
  q: string;
  years: string[];
  characters: string[];
  scope: string;
  sort: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (tab) params.set("tab", tab);
  if (q) params.set("q", q);
  years.forEach((year) => params.append("year", year));
  characters.forEach((characterKey) => params.append("character", characterKey));
  if (scope) params.set("scope", scope);
  if (sort && sort !== "latest") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/stories?${query}` : "/stories";
}

function getVisiblePages(totalPages: number, currentPage: number) {
  const raw = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const filtered = Array.from(raw).filter((page) => page >= 1 && page <= totalPages);
  filtered.sort((a, b) => a - b);
  return filtered;
}

function compareStories(a: StoryCard, b: StoryCard, sort: string) {
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

export default async function StoriesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const q = toSingleString(resolvedSearchParams?.q);
  const tab = toSingleString(resolvedSearchParams?.tab);
  const scope = toSingleString(resolvedSearchParams?.scope);
  const sort = toSingleString(resolvedSearchParams?.sort) || "latest";
  const pageRaw = Number(toSingleString(resolvedSearchParams?.page) || "1");

  const selectedYears = Array.from(
    new Set(
      toStringArray(resolvedSearchParams?.year).filter((value) => /^\d{4}$/.test(value))
    )
  ).sort((a, b) => Number(b) - Number(a));

  const selectedCharacterKeys = Array.from(
    new Set(toStringArray(resolvedSearchParams?.character))
  );

  const activeTab = getActiveTab(tab);
  const admin = await isAdmin();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .order("sort_order", { ascending: true });

  const characterRows = (characters ?? []) as CharacterRow[];
  const selectedCharacters = characterRows.filter((item) =>
    selectedCharacterKeys.includes(item.key)
  );
  const selectedCharacterIdSet = new Set(selectedCharacters.map((item) => item.id));

  let allPublishedStoriesQuery = supabase
    .from("stories")
    .select("id, subtype, release_year, visibility")
    .eq("is_published", true);

  if (!admin) {
    allPublishedStoriesQuery = allPublishedStoriesQuery.neq("visibility", "private");
  }

  const { data: allPublishedStories } = await allPublishedStoriesQuery;

  const yearOptions = Array.from(
    new Set(
      ((allPublishedStories ?? []) as { release_year: number | null }[])
        .map((item) => item.release_year)
        .filter((item): item is number => typeof item === "number")
    )
  ).sort((a, b) => b - a);

  const tabCountMap = new Map<string, number>();

  STORY_TAB_OPTIONS.forEach((tabItem) => {
    if (!allPublishedStories) {
      tabCountMap.set(tabItem.key, 0);
      return;
    }

    if (tabItem.subtypes.length === 0) {
      tabCountMap.set(tabItem.key, allPublishedStories.length);
      return;
    }

    const count = allPublishedStories.filter((story) =>
      tabItem.subtypes.includes((story.subtype ?? "") as never)
    ).length;

    tabCountMap.set(tabItem.key, count);
  });

 let query = supabase
    .from("stories")
    .select(
      "id, title, slug, subtype, release_year, release_date, summary, primary_character_id, part_no, chapter_no, visibility"
    )
    .eq("is_published", true);

  if (!admin) {
    query = query.neq("visibility", "private");
  }

  if (activeTab.subtypes.length > 0) {
    query = query.in("subtype", [...activeTab.subtypes]);
  }

  if (selectedYears.length > 0) {
    query = query.in(
      "release_year",
      selectedYears.map((value) => Number(value))
    );
  }

  const { data: rawStories, error } = await query;
  let stories = (rawStories ?? []) as StoryCard[];

  const storyIds = stories.map((story) => story.id);
  const itemCharacterMap = new Map<string, string[]>();

  if (storyIds.length > 0) {
    const { data: itemCharacters } = await supabase
      .from("item_characters")
      .select("item_id, character_id")
      .eq("item_type", "story")
      .in("item_id", storyIds);

    (itemCharacters as ItemCharacterRow[] | null)?.forEach((row) => {
      const prev = itemCharacterMap.get(row.item_id) ?? [];
      prev.push(row.character_id);
      itemCharacterMap.set(row.item_id, prev);
    });
  }

  const totalCharacterCount = characterRows.length;

  const getStoryCharacterIds = (story: StoryCard) => {
    const set = new Set<string>();

    if (story.primary_character_id) {
      set.add(story.primary_character_id);
    }

    const linkedIds = itemCharacterMap.get(story.id) ?? [];
    linkedIds.forEach((id) => set.add(id));

    return set;
  };

  if (q && storyIds.length > 0) {
    const { data: translationMatches } = await supabase
      .from("translations")
      .select("parent_id")
      .eq("parent_type", "story")
      .in("parent_id", storyIds)
      .or(`title.ilike.%${q}%,body.ilike.%${q}%,source_text.ilike.%${q}%`);

    const translationMatchIds = new Set(
      ((translationMatches ?? []) as TranslationMatchRow[]).map((row) => row.parent_id)
    );

    const loweredQ = q.toLowerCase();

    stories = stories.filter((story) => {
      const titleMatch = story.title.toLowerCase().includes(loweredQ);
      const summaryMatch = (story.summary ?? "").toLowerCase().includes(loweredQ);
      return titleMatch || summaryMatch || translationMatchIds.has(story.id);
    });
  }

  stories = stories.filter((story) => {
    const characterIds = getStoryCharacterIds(story);

    if (selectedCharacterIdSet.size > 0) {
      if (scope === "route") {
        if (!story.primary_character_id || !selectedCharacterIdSet.has(story.primary_character_id)) {
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
      return !!story.primary_character_id;
    }

    if (scope === "multi") {
      return characterIds.size >= 2;
    }

    if (scope === "all_cast") {
      return totalCharacterCount > 0 ? characterIds.size >= totalCharacterCount : false;
    }

    return true;
  });

  stories.sort((a, b) => compareStories(a, b, sort));

  const totalCount = stories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / STORIES_PER_PAGE));
  const currentPage = Math.min(Math.max(pageRaw || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * STORIES_PER_PAGE;
  const pagedStories = stories.slice(startIndex, startIndex + STORIES_PER_PAGE);

  const filteredStoryIds = pagedStories.map((story) => story.id);
  const mediaMap = new Map<string, string>();

  if (filteredStoryIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from("media_assets")
      .select(
        "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
      )
      .eq("parent_type", "story")
      .in("parent_id", filteredStoryIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    const grouped = new Map<string, StoryThumb[]>();

    (mediaAssets as StoryThumb[] | null)?.forEach((media) => {
      const arr = grouped.get(media.parent_id) ?? [];
      arr.push(media);
      grouped.set(media.parent_id, arr);
    });

    grouped.forEach((items, storyId) => {
      const coverImage = items.find(
        (media) => media.media_type === "image" && media.usage_type === "cover"
      );
      const normalImage = items.find((media) => media.media_type === "image");
      const youtubeMedia = items.find((media) => media.media_type === "youtube");

      let thumb = "";

      if (coverImage?.url) {
        thumb = coverImage.url;
      } else if (normalImage?.url) {
        thumb = normalImage.url;
      } else if (youtubeMedia) {
        thumb =
          youtubeMedia.thumbnail_url ||
          (youtubeMedia.youtube_video_id
            ? `https://img.youtube.com/vi/${youtubeMedia.youtube_video_id}/hqdefault.jpg`
            : "");
      }

      if (thumb) {
        mediaMap.set(storyId, thumb);
      }
    });
  }
const storyTagMap = new Map<string, string[]>();

  if (filteredStoryIds.length > 0) {
    const { data: itemTagRows } = await supabase
      .from("item_tags")
      .select("item_id, tag_id, sort_order")
      .eq("item_type", "story")
      .in("item_id", filteredStoryIds)
      .order("sort_order", { ascending: true });

    const tagIds = Array.from(
      new Set((itemTagRows ?? []).map((row) => row.tag_id))
    );

    if (tagIds.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);

      const tagNameMap = new Map(
        (tagRows ?? []).map((row) => [row.id, row.name])
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


  const scopeLabel =
    SCOPE_OPTIONS.find((item) => item.key === scope)?.label ?? "";

  const sortLabel =
    SORT_OPTIONS.find((item) => item.key === sort)?.label ?? "";

  const activeFilterChips = [
    ...(q ? [`검색: ${q}`] : []),
    ...selectedYears.map((yearValue) => `${yearValue}년`),
    ...selectedCharacters.map((item) => item.name_ko),
    ...(scopeLabel ? [scopeLabel] : []),
    ...(sortLabel && sort !== "latest" ? [sortLabel] : []),
  ];

  const visiblePages = getVisiblePages(totalPages, currentPage);
  const formStateKey = JSON.stringify({
    tab: activeTab.key,
    q,
    years: selectedYears,
    characters: selectedCharacterKeys,
    scope,
    sort,
  });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Stories</div>
        <h1 className="page-title">스토리 아카이브</h1>
        <p className="page-desc">
          메인스토리와 데이트를 우선으로 정리하는 연결형 스토리 목록입니다.
        </p>

        <div className="story-archive-tabs">
          {STORY_TAB_OPTIONS.map((item) => {
            const href = buildStoriesHref({
              tab: item.key,
              q,
              years: selectedYears,
              characters: selectedCharacterKeys,
              scope,
              sort,
              page: 1,
            });

            const active = item.key === activeTab.key;
            const count = tabCountMap.get(item.key) ?? 0;

            return (
              <Link
                key={item.key}
                href={href}
                className={`story-archive-tab ${active ? "active" : ""}`}
              >
                {item.label}
                <span className="story-archive-tab-count">({count})</span>
              </Link>
            );
          })}
        </div>

        <form
          key={formStateKey}
          method="get"
          action="/stories"
          className="story-toolbar-form"
        >
          <input type="hidden" name="tab" value={activeTab.key} />
          <input type="hidden" name="page" value="1" />

          <div className="story-toolbar-top">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="제목 / 번역 내용 검색"
              className="story-toolbar-search"
            />

            <details className="story-filter-details">
              <summary className="story-filter-trigger">필터</summary>

              <div className="story-filter-panel">
                <div className="story-filter-panel-head">
                  <div>
                    <p className="story-filter-panel-eyebrow">FILTER</p>
                    <h2 className="story-filter-panel-title">스토리 필터</h2>
                  </div>

                  <Link
                    href={buildStoriesHref({
                      tab: activeTab.key,
                      q: "",
                      years: [],
                      characters: [],
                      scope: "",
                      sort: "latest",
                      page: 1,
                    })}
                    className="story-filter-reset-btn"
                  >
                    재설정
                  </Link>
                </div>

                <div className="story-filter-sections">
                  <section className="story-filter-section">
                    <h3 className="story-filter-section-title">캐릭터</h3>
                    <div className="story-filter-chip-grid">
                      {characterRows.map((item) => (
                        <label key={item.id} className="story-filter-chip-option">
                          <input
                            type="checkbox"
                            name="character"
                            value={item.key}
                            defaultChecked={selectedCharacterKeys.includes(item.key)}
                            className="story-filter-chip-input"
                          />
                          <span className="story-filter-chip-label">{item.name_ko}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="story-filter-section">
                    <h3 className="story-filter-section-title">등장 범위</h3>
                    <div className="story-filter-chip-grid">
                      {SCOPE_OPTIONS.map((item) => (
                        <label key={item.key || "all"} className="story-filter-chip-option">
                          <input
                            type="radio"
                            name="scope"
                            value={item.key}
                            defaultChecked={scope === item.key}
                            className="story-filter-chip-input"
                          />
                          <span className="story-filter-chip-label">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="story-filter-section">
                    <h3 className="story-filter-section-title">연도</h3>
                    <div className="story-filter-chip-grid is-year-grid">
                      {yearOptions.map((yearValue) => (
                        <label key={yearValue} className="story-filter-chip-option">
                          <input
                            type="checkbox"
                            name="year"
                            value={String(yearValue)}
                            defaultChecked={selectedYears.includes(String(yearValue))}
                            className="story-filter-chip-input"
                          />
                          <span className="story-filter-chip-label">{yearValue}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="story-filter-section">
                    <h3 className="story-filter-section-title">정렬</h3>
                    <div className="story-filter-chip-grid">
                      {SORT_OPTIONS.map((item) => (
                        <label key={item.key} className="story-filter-chip-option">
                          <input
                            type="radio"
                            name="sort"
                            value={item.key}
                            defaultChecked={sort === item.key}
                            className="story-filter-chip-input"
                          />
                          <span className="story-filter-chip-label">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="story-filter-actions">
                  <button type="submit" className="story-filter-apply-btn">
                    적용
                  </button>
                </div>
              </div>
            </details>

            <button type="submit" className="primary-button story-toolbar-submit">
              검색
            </button>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="story-active-filters">
              {activeFilterChips.map((chip) => (
                <span key={chip} className="story-active-filter-chip">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </form>

        {admin ? (
          <div className="story-list-adminbar">
            <Link href="/admin/stories/new" className="primary-button">
              새 스토리 등록
            </Link>

            <Link href="/admin/stories" className="nav-link">
              스토리 관리
            </Link>
          </div>
        ) : null}
      </header>

      <section className="story-archive-shell">
        <div className="story-archive-main">
          <section className="detail-panel story-archive-intro">
            <div className="story-archive-intro-top">
              <div>
                <p className="story-archive-intro-label">현재 카테고리</p>
                <h2 className="story-archive-intro-title">{activeTab.label}</h2>
              </div>

              <span className="meta-pill">{totalCount}개</span>
            </div>

            <p className="story-archive-intro-desc">{activeTab.desc}</p>
          </section>

          {error ? (
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          ) : null}

          {pagedStories.length === 0 ? (
            <div className="empty-box">등록된 스토리가 없습니다.</div>
          ) : (
            <>
              <ul className="story-archive-list">
                {pagedStories.map((story) => {
                  const thumb = mediaMap.get(story.id);
                  const tags = storyTagMap.get(story.id) ?? [];
                  const visibilityLabel = getVisibilityLabel(story.visibility, admin);

                  return (
                    <li key={story.id} className="story-archive-item">
                      <Link href={`/stories/${story.slug}`} className="story-archive-link">
                        <div className="story-archive-media">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={story.title}
                              className="story-archive-image"
                            />
                          ) : (
                            <div className="story-archive-empty">NO IMAGE</div>
                          )}
                        </div>

                        <div className="story-archive-body">
                          <div className="story-archive-meta-row">
                            <span className="story-archive-badge">
                              {getSubtypeLabel(story.subtype)}
                            </span>

                            {visibilityLabel ? (
                              <span className="story-archive-badge">
                                {visibilityLabel}
                              </span>
                            ) : null}

                            <span className="story-archive-date">
                              {formatStoryDate(story)}
                            </span>
                          </div>

                          <h2 className="story-archive-title">{story.title}</h2>

                          {story.summary ? (
                            <p className="story-archive-summary">{story.summary}</p>
                          ) : (
                            <p className="story-archive-summary is-empty">요약 없음</p>
                          )}

                          {tags.length > 0 ? (
                            <div className="story-card-tags">
                              {tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="story-card-tag">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 ? (
                <nav className="story-pagination" aria-label="스토리 페이지 이동">
                  <Link
                    href={buildStoriesHref({
                      tab: activeTab.key,
                      q,
                      years: selectedYears,
                      characters: selectedCharacterKeys,
                      scope,
                      sort,
                      page: Math.max(1, currentPage - 1),
                    })}
                    className={`story-page-btn ${currentPage <= 1 ? "is-disabled" : ""}`}
                    aria-disabled={currentPage <= 1}
                  >
                    이전
                  </Link>

                  <div className="story-page-numbers">
                    {visiblePages.map((pageNumber, index) => {
                      const prevPage = visiblePages[index - 1];
                      const showGap = prevPage && pageNumber - prevPage > 1;

                      return (
                        <span key={pageNumber} className="story-page-number-wrap">
                          {showGap ? <span className="story-page-gap">…</span> : null}

                          <Link
                            href={buildStoriesHref({
                              tab: activeTab.key,
                              q,
                              years: selectedYears,
                              characters: selectedCharacterKeys,
                              scope,
                              sort,
                              page: pageNumber,
                            })}
                            className={`story-page-btn ${
                              currentPage === pageNumber ? "is-active" : ""
                            }`}
                          >
                            {pageNumber}
                          </Link>
                        </span>
                      );
                    })}
                  </div>

                  <Link
                    href={buildStoriesHref({
                      tab: activeTab.key,
                      q,
                      years: selectedYears,
                      characters: selectedCharacterKeys,
                      scope,
                      sort,
                      page: Math.min(totalPages, currentPage + 1),
                    })}
                    className={`story-page-btn ${
                      currentPage >= totalPages ? "is-disabled" : ""
                    }`}
                    aria-disabled={currentPage >= totalPages}
                  >
                    다음
                  </Link>
                </nav>
              ) : null}
            </>
          )}
        </div>

        <aside className="story-archive-sidebar">
          <section className="detail-panel story-archive-notice">
            <p className="story-archive-notice-eyebrow">NOTICE</p>
            <h2 className="story-archive-notice-title">스토리 안내</h2>

            <ul className="story-archive-notice-list">
              {NOTICE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}