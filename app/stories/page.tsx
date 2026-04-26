import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import StoriesFilterModal from "@/components/story/StoriesFilterModal";
import StoryCategoryCompactTabs from "@/components/story/StoryCategoryCompactTabs";


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
    sub?: SearchParamValue;
    tag?: SearchParamValue;
    character?: SearchParamValue;
    scope?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

type EventCard = {
  id: string;
  title: string;
  slug: string;
  subtype: string | null;
  release_year: number | null;
  start_date: string | null;
  summary?: string | null;
  primary_character_id?: string | null;
  visibility?: string | null;
};

const STORY_TAB_OPTIONS = [
  {
    key: "main",
    label: "메인스토리",
    subtypes: ["main_story", "behind_story"],
    desc: "1부 / 2부 / 3부와 막후의 장 중심의 메인스토리 묶음",
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
    desc: "ASMR / 오디오형 스토리",
  },
  {
    key: "event",
    label: "이벤트 / 기념일",
    subtypes: [],
    desc: "생일, 기념일, 시즌, 복귀, N주년 이벤트",
  },
  {
    key: "side",
    label: "외전",
    subtypes: ["side_story"],
    desc: "개인서사 외전 중심",
  },
  {
    key: "xiyue",
    label: "서월국",
    subtypes: ["xiyue_story"],
    desc: "서월국 관련 스토리",
  },
  {
    key: "myhome",
    label: "마이홈",
    subtypes: ["myhome_story"],
    desc: "마이홈 계열 스토리",
  },
  {
    key: "company",
    label: "촬영장 / 회사 프로젝트",
    subtypes: ["company_project"],
    desc: "회사 프로젝트 / 촬영장 계열 스토리",
  },
  {
    key: "all",
    label: "전체",
    subtypes: [],
    desc: "등록된 전체 스토리와 이벤트",
  },
] as const;

const SUBTYPE_LABELS: Record<string, string> = {
  card_story: "데이트",
  main_story: "메인스토리",
  side_story: "외전",
  asmr: "너의 곁에",
  behind_story: "막후의 장",
  xiyue_story: "서월국",
  myhome_story: "마이홈",
  company_project: "회사 프로젝트",
};

const NOTICE_ITEMS = [
"메인스토리 / 데이트 중심으로 우선 정리",
  "일부 스토리는 미번역 / 미백업 상태",
  "KR / CN 미디어 및 번역 스위치",
];


const CHARACTER_SUBFILTERS = [
  { key: "all", label: "전체" },
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "xumo", label: "허묵" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "lingxiao", label: "연시호" },
] as const;

const STORY_SUBFILTERS = {
  all: [],

  main: [
    { key: "all", label: "전체" },
    { key: "part1", label: "1부" },
    { key: "part2", label: "2부" },
    { key: "part3", label: "3부" },
    { key: "behind_story", label: "막후의 장" },
  ],

  card: CHARACTER_SUBFILTERS,
  asmr: CHARACTER_SUBFILTERS,
  side: CHARACTER_SUBFILTERS,
  xiyue: CHARACTER_SUBFILTERS,
  myhome: CHARACTER_SUBFILTERS,
  company: CHARACTER_SUBFILTERS,

  event: [
    { key: "all", label: "전체" },
    { key: "birthday_character", label: "캐릭터 생일" },
    { key: "birthday_mc", label: "유저 생일" },
    { key: "anniversary", label: "N주년" },
    { key: "festival", label: "명절 / 기념일" },
    { key: "seasonal", label: "시즌 이벤트" },
    { key: "collab", label: "콜라보" },
    { key: "return", label: "복귀 이벤트" },
  ],
} as const;

function getSubLabel(tab: string, sub: string) {
  const items = STORY_SUBFILTERS[tab as keyof typeof STORY_SUBFILTERS] ?? [];
  return items.find((item) => item.key === sub)?.label ?? "전체";
}

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
  { key: "title_asc", label: "제목 오름차순" },
  { key: "title_desc", label: "제목 내림차순" },
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
const CHARACTER_SUBFILTER_TABS = new Set([
  "card",
  "asmr",
  "side",
  "xiyue",
  "myhome",
  "company",
]);

const CHARACTER_SUBFILTER_KEYS = new Set([
  "baiqi",
  "lizeyan",
  "xumo",
  "zhouqiluo",
  "lingxiao",
]);

function resolveSelectedCharacterKeys(
  tab: string,
  sub: string,
  rawSelectedCharacterKeys: string[]
) {
  const merged = new Set(rawSelectedCharacterKeys);

  if (CHARACTER_SUBFILTER_TABS.has(tab) && CHARACTER_SUBFILTER_KEYS.has(sub)) {
    merged.add(sub);
  }

  return Array.from(merged);
}

function getCharactersForSubfilterLink(
  tab: string,
  rawSelectedCharacterKeys: string[]
) {
  if (CHARACTER_SUBFILTER_TABS.has(tab)) {
    return [];
  }

  return rawSelectedCharacterKeys;
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

function formatEventDate(event: EventCard) {
  if (event.start_date) return event.start_date;
  if (event.release_year) return `${event.release_year}`;
  return "날짜 미정";
}

function getEventSubtypeLabel(subtype: string | null) {
  if (!subtype) return "이벤트";

  const map: Record<string, string> = {
    birthday_baiqi: "캐릭터 생일",
    birthday_mc: "유저 생일",
    anniversary_event: "N주년",
    seasonal_event: "시즌 이벤트",
    return_event: "복귀 이벤트",
    game_event: "게임 이벤트",
  };

  return map[subtype] ?? subtype;
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
function buildStoryDetailHref({
  slug,
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
  slug: string;
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
  return query ? `/stories/${slug}?${query}` : `/stories/${slug}`;
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
    if (titleCompare !== 0) return titleCompare;
    if (aYear !== bYear) return bYear - aYear;
    if (aDate !== bDate) return bDate - aDate;
    if (aPart !== bPart) return bPart - aPart;
    if (aChapter !== bChapter) return bChapter - aChapter;
    return 0;
  }

  if (sort === "title_desc") {
    if (titleCompare !== 0) return -titleCompare;
    if (aYear !== bYear) return bYear - aYear;
    if (aDate !== bDate) return bDate - aDate;
    if (aPart !== bPart) return bPart - aPart;
    if (aChapter !== bChapter) return bChapter - aChapter;
    return 0;
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
const selectedTag = toSingleString(resolvedSearchParams?.tag);
  const q = toSingleString(resolvedSearchParams?.q);
  const tab = toSingleString(resolvedSearchParams?.tab);
  const sub = toSingleString(resolvedSearchParams?.sub) || "all";
  const scope = toSingleString(resolvedSearchParams?.scope);
  const sort = toSingleString(resolvedSearchParams?.sort) || "latest";
  const pageRaw = Number(toSingleString(resolvedSearchParams?.page) || "1");

  const selectedYears = Array.from(
    new Set(
      toStringArray(resolvedSearchParams?.year).filter((value) => /^\d{4}$/.test(value))
    )
  ).sort((a, b) => Number(b) - Number(a));

 const rawSelectedCharacterKeys = Array.from(
  new Set(toStringArray(resolvedSearchParams?.character))
);

const selectedCharacterKeys = resolveSelectedCharacterKeys(
  tab,
  sub,
  rawSelectedCharacterKeys
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

if (activeTab.key === "main") {
  if (sub === "part1") {
    stories = stories.filter(
      (story) => story.subtype === "main_story" && story.part_no === 1
    );
  } else if (sub === "part2") {
    stories = stories.filter(
      (story) => story.subtype === "main_story" && story.part_no === 2
    );
  } else if (sub === "part3") {
    stories = stories.filter(
      (story) => story.subtype === "main_story" && story.part_no === 3
    );
  } else if (sub === "behind_story") {
    stories = stories.filter((story) => story.subtype === "behind_story");
  }
}




  const storyIds = stories.map((story) => story.id);
  const itemCharacterMap = new Map<string, string[]>();
  const storyTagMap = new Map<string, string[]>();

if (storyIds.length > 0) {
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("item_id, tag_id, sort_order")
    .eq("item_type", "story")
    .in("item_id", storyIds)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(
    new Set((itemTagRows ?? []).map((row) => row.tag_id))
  );

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

if (selectedTag) {
  stories = stories.filter((story) => {
    const tags = storyTagMap.get(story.id) ?? [];
    return tags.includes(selectedTag);
  });
}

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

  



  const scopeLabel =
    SCOPE_OPTIONS.find((item) => item.key === scope)?.label ?? "";

  const sortLabel =
    SORT_OPTIONS.find((item) => item.key === sort)?.label ?? "";

const activeFilterChips = [
  ...(q ? [`검색: ${q}`] : []),
  ...(selectedTag ? [`태그: #${selectedTag}`] : []),
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
    characters: rawSelectedCharacterKeys,
    scope,
    sort,
  });

  


if (activeTab.key === "event") {
  let eventQuery = supabase
    .from("events")
    .select("id, title, slug, subtype, release_year, start_date, summary, primary_character_id, visibility")
    .eq("is_published", true);

  if (!admin) {
    eventQuery = eventQuery.neq("visibility", "private");
  }

  const { data: rawEvents, error } = await eventQuery;
  let events = (rawEvents ?? []) as EventCard[];

  

  if (sub === "birthday_character") {
  events = events.filter((item) => item.subtype === "birthday_baiqi");
} else if (sub === "birthday_mc") {
  events = events.filter((item) => item.subtype === "birthday_mc");
} else if (sub === "anniversary") {
  events = events.filter((item) => item.subtype === "anniversary_event");
} else if (sub === "seasonal") {
  events = events.filter((item) => item.subtype === "seasonal_event");
} else if (sub === "return") {
  events = events.filter((item) => item.subtype === "return_event");
} else if (sub === "festival") {
  events = events.filter((item) => item.subtype === "game_event");
} else if (sub === "collab") {
  events = events.filter((item) => item.subtype === "game_event");
}

if (selectedYears.length > 0) {
  const yearSet = new Set(selectedYears.map((value) => Number(value)));
  events = events.filter((item) => {
    if (item.release_year && yearSet.has(item.release_year)) return true;
    if (item.start_date) {
      const eventYear = new Date(item.start_date).getFullYear();
      return yearSet.has(eventYear);
    }
    return false;
  });
}

if (q) {
  const loweredQ = q.toLowerCase();
  events = events.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(loweredQ);
    const summaryMatch = (item.summary ?? "").toLowerCase().includes(loweredQ);
    return titleMatch || summaryMatch;
  });
}

if (selectedCharacterIdSet.size > 0) {
  events = events.filter(
    (item) =>
      !!item.primary_character_id &&
      selectedCharacterIdSet.has(item.primary_character_id)
  );
}

events.sort((a, b) => {
  const titleCompare = a.title.localeCompare(b.title, "ko");
  const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
  const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;


  if (sort === "title_asc") return titleCompare;
  if (sort === "title_desc") return -titleCompare;
  if (sort === "oldest") return aDate - bDate;
  return bDate - aDate;
});


const eventTotalCount = events.length;
const eventIds = events.map((event) => event.id);
  const eventMediaMap = new Map<string, string>();
  const eventTagMap = new Map<string, string[]>();

  if (eventIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from("media_assets")
      .select(
        "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
      )
      .eq("parent_type", "event")
      .in("parent_id", eventIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    const grouped = new Map<string, StoryThumb[]>();

    (mediaAssets as StoryThumb[] | null)?.forEach((media) => {
      const arr = grouped.get(media.parent_id) ?? [];
      arr.push(media);
      grouped.set(media.parent_id, arr);
    });

    grouped.forEach((items, eventId) => {
      const coverImage = items.find(
        (media) => media.media_type === "image" && media.usage_type === "cover"
      );
      const bannerImage = items.find(
        (media) => media.media_type === "image" && media.usage_type === "banner"
      );
      const normalImage = items.find((media) => media.media_type === "image");
      const youtubeMedia = items.find((media) => media.media_type === "youtube");

      let thumb = "";

      if (coverImage?.url) {
        thumb = coverImage.url;
      } else if (bannerImage?.url) {
        thumb = bannerImage.url;
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
        eventMediaMap.set(eventId, thumb);
      }
    });

    const { data: itemTagRows } = await supabase
      .from("item_tags")
      .select("item_id, tag_id")
      .eq("item_type", "event")
      .in("item_id", eventIds);

    const tagIds = Array.from(new Set((itemTagRows ?? []).map((row) => row.tag_id)));

    if (tagIds.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, label")
        .in("id", tagIds);

      const tagNameMap = new Map(
  (tagRows ?? []).map((row) => [row.id, row.label])
);

      (itemTagRows ?? []).forEach((row) => {
        const name = tagNameMap.get(row.tag_id);
        if (!name) return;

        const prev = eventTagMap.get(row.item_id) ?? [];
        prev.push(name);
        eventTagMap.set(row.item_id, prev);
      });
    }
  }

  return (
    <main>
      <header className="page-header">

        
        <div className="page-eyebrow">Archive / Stories</div>
        
        <h1 className="page-title">스토리 아카이브</h1>
        <p className="page-desc">
          메인스토리와 데이트를 우선으로 정리하는 연결형 스토리 목록입니다.
        </p>


      <StoryCategoryCompactTabs
  activeKey={activeTab.key}
  primaryKeys={["all", "main", "card"]}
  storageKey="stories-main-tabs"
  items={[
    {
      key: "all",
      label: "전체",
      href: buildStoriesHref({
        tab: "all",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "main",
      label: "메인스토리",
      href: buildStoriesHref({
        tab: "main",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "card",
      label: "데이트",
      href: buildStoriesHref({
        tab: "card",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "event",
      label: "이벤트 / 기념일",
      href: buildStoriesHref({
        tab: "event",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "asmr",
      label: "너의 곁에",
      href: buildStoriesHref({
        tab: "asmr",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "side",
      label: "외전",
      href: buildStoriesHref({
        tab: "side",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "xiyue",
      label: "서월국",
      href: buildStoriesHref({
        tab: "xiyue",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "myhome",
      label: "마이홈",
      href: buildStoriesHref({
        tab: "myhome",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "company",
      label: "촬영장 / 회사 프로젝트",
      href: buildStoriesHref({
        tab: "company",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
  ]}
/>
       
</header>

    <form
  key={formStateKey}
  method="get"
  action="/stories"
  className="story-toolbar-form"
>
  <input type="hidden" name="tab" value={activeTab.key} />
  <input type="hidden" name="page" value="1" />
  {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
  {sub !== "all" ? <input type="hidden" name="sub" value={sub} /> : null}

  <div className="story-toolbar-top">
    <input
      type="text"
      name="q"
      defaultValue={q}
      placeholder="제목 / 이벤트 내용 검색"
      className="story-toolbar-search"
    />

    <StoriesFilterModal
      defaultValues={{
        tab: activeTab.key,
        sub,
        q,
        scope: "",
        sort,
        tag: selectedTag,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
      }}
      yearOptions={yearOptions.map(String)}
      characterOptions={characterRows.map((item) => ({
        value: item.key,
        label: item.name_ko,
      }))}
      scopeOptions={[]}
      sortOptions={SORT_OPTIONS.map((item) => ({
        value: item.key,
        label: item.label,
      }))}
    />

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


      <section className="story-archive-shell">
        <div className="story-archive-main">
          <section className="detail-panel story-archive-intro">
            {(STORY_SUBFILTERS.event ?? []).length > 0 ? (
              <div className="archive-subchip-row" style={{ marginTop: "12px" }}>
                {(STORY_SUBFILTERS.event ?? []).map((item) => {
                  const href =
                    item.key === "all"
                      ? `/stories?tab=event`
                      : `/stories?tab=event&sub=${item.key}`;

                  const active = sub === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={href}
                      className={`archive-subchip ${active ? "is-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              
            ) : null}

           <div className="story-archive-intro-top">
  <div>
    <p className="story-archive-intro-label">현재 카테고리</p>
    <h2 className="story-archive-intro-title">{activeTab.label}</h2>
  </div>

  <div className="story-archive-intro-right">
    {admin ? (
      <div className="story-archive-admin-mini">
        <Link
          href="/admin/events/new"
          className="story-archive-mini-btn story-archive-mini-btn-primary"
        >
          + 새 이벤트
        </Link>

        <Link
          href="/admin/events"
          className="story-archive-mini-btn"
        >
          관리
        </Link>
      </div>
    ) : null}

    <span className="meta-pill">{eventTotalCount}개</span>
  </div>
</div>

            <p className="story-archive-intro-desc">{activeTab.desc}</p>
          </section>

          {error ? (
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          ) : null}

          {events.length === 0 ? (
            <div className="empty-box">등록된 이벤트가 없습니다.</div>
          ) : (
            <ul className="story-archive-list">
              {events.map((event) => {
                const thumb = eventMediaMap.get(event.id);
                const tags = eventTagMap.get(event.id) ?? [];
                const visibilityLabel = getVisibilityLabel(event.visibility, admin);

                return (
             <li key={event.id} className="story-archive-item">
  <div className="story-archive-card-shell">
    <Link href={`/events/${event.slug}${sub && sub !== "all" ? `?sub=${sub}` : ""}`} className="story-archive-link">
      <div className="story-archive-media">
        {thumb ? (
          <img
            src={thumb}
            alt={event.title}
            className="story-archive-image"
          />
        ) : (
          <div className="story-archive-empty">NO IMAGE</div>
        )}
      </div>

      <div className="story-archive-body">
        <div className="story-archive-meta-row">
          <span className="story-archive-badge">
            {getEventSubtypeLabel(event.subtype)}
          </span>

          {visibilityLabel ? (
            <span className="story-archive-badge">{visibilityLabel}</span>
          ) : null}

          <span className="story-archive-date">
            {formatEventDate(event)}
          </span>
        </div>

        <h2 className="story-archive-title">{event.title}</h2>

        {event.summary ? (
          <p className="story-archive-summary">{event.summary}</p>
        ) : null}
      </div>
    </Link>

    {tags.length > 0 ? (
      <div className="story-archive-tags-inline">
        {tags.slice(0, 4).map((tag) => (
          <Link
            key={tag}
            href={buildStoriesHref({
              tab: activeTab.key,
              sub: sub !== "all" ? sub : undefined,
              tag,
              q: "",
              years: selectedYears,
              characters: rawSelectedCharacterKeys,
              scope,
              sort,
              page: 1,
            })}
            className="story-card-tag"
          >
            #{tag}
          </Link>
        ))}
      </div>
    ) : null}
  </div>
</li>
                );
              })}
            </ul>
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
  


  return (
    <main>
  <header className="page-header">
    <div className="page-eyebrow">Archive / Stories</div>
    <h1 className="page-title">스토리 아카이브</h1>
    <p className="page-desc">
      메인스토리와 데이트를 우선으로 정리하는 연결형 스토리 목록입니다.
    </p>

 <StoryCategoryCompactTabs
  activeKey={activeTab.key}
  primaryKeys={["all", "main", "card"]}
  storageKey="stories-main-tabs"
  items={[
    {
      key: "all",
      label: "전체",
      href: buildStoriesHref({
        tab: "all",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "main",
      label: "메인스토리",
      href: buildStoriesHref({
        tab: "main",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "card",
      label: "데이트",
      href: buildStoriesHref({
        tab: "card",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "event",
      label: "이벤트 / 기념일",
      href: buildStoriesHref({
        tab: "event",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "asmr",
      label: "너의 곁에",
      href: buildStoriesHref({
        tab: "asmr",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "side",
      label: "외전",
      href: buildStoriesHref({
        tab: "side",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "xiyue",
      label: "서월국",
      href: buildStoriesHref({
        tab: "xiyue",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "myhome",
      label: "마이홈",
      href: buildStoriesHref({
        tab: "myhome",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
    {
      key: "company",
      label: "촬영장 / 회사 프로젝트",
      href: buildStoriesHref({
        tab: "company",
        q,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
  ]}
/>

    <form
  key={formStateKey}
  method="get"
  action="/stories"
  className="story-toolbar-form"
>
  <input type="hidden" name="tab" value={activeTab.key} />
  <input type="hidden" name="page" value="1" />
  {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
  {sub !== "all" ? <input type="hidden" name="sub" value={sub} /> : null}

  <div className="story-toolbar-top">
    <input
      type="text"
      name="q"
      defaultValue={q}
      placeholder="제목 / 스토리 내용 검색"
      className="story-toolbar-search"
    />

    <StoriesFilterModal
      defaultValues={{
        tab: activeTab.key,
        sub,
        q,
        scope,
        sort,
        tag: selectedTag,
        years: selectedYears,
        characters: rawSelectedCharacterKeys,
      }}
      yearOptions={yearOptions.map(String)}
      characterOptions={characterRows.map((item) => ({
        value: item.key,
        label: item.name_ko,
      }))}
      scopeOptions={SCOPE_OPTIONS.map((item) => ({
        value: item.key,
        label: item.label,
      }))}
      sortOptions={SORT_OPTIONS.map((item) => ({
        value: item.key,
        label: item.label,
      }))}
    />

    <button type="submit" className="primary-button story-toolbar-submit">
      검색
    </button>
  </div>

  <div className="story-toolbar-bottom">
    <div className="story-toolbar-bottom-left">
      {activeFilterChips.length > 0 ? (
        <div className="story-active-filters">
          {activeFilterChips.map((chip) => (
            <span key={chip} className="story-active-filter-chip">
              {chip}
            </span>
          ))}
        </div>
      ) : (
        <div className="story-active-filters">
          <span className="story-active-filter-chip">
            {SCOPE_OPTIONS.find((item) => item.key === scope)?.label ?? "등장 범위 전체"}
          </span>
        </div>
      )}
    </div>

   
  </div>
</form>
    
  </header>



  <section className="story-archive-shell">
        <div className="story-archive-main">
          <section className="detail-panel story-archive-intro">
            {(STORY_SUBFILTERS[activeTab.key as keyof typeof STORY_SUBFILTERS] ?? []).length > 0 ? (
  <div className="archive-subchip-row" style={{ marginTop: "12px" }}>
    {(STORY_SUBFILTERS[activeTab.key as keyof typeof STORY_SUBFILTERS] ?? []).map((item) => {
      const href = buildStoriesHref({
  tab: activeTab.key,
  sub: item.key,
  q,
  years: selectedYears,
  characters: getCharactersForSubfilterLink(
    activeTab.key,
    rawSelectedCharacterKeys
  ),
  scope,
  sort,
  page: 1,
});

      const active = sub === item.key;

      return (
        <Link
          key={item.key}
          href={href}
          className={`archive-subchip ${active ? "is-active" : ""}`}
        >
          {item.label}
        </Link>
      );
    })}
  </div>
) : null}
          <div className="story-archive-intro-top">
  <div>
    <p className="story-archive-intro-label">현재 카테고리</p>
    <h2 className="story-archive-intro-title">{activeTab.label}</h2>
  </div>

  <div className="story-archive-intro-right">
    {admin ? (
      <div className="story-archive-admin-mini">
        <Link
           href={`/admin/stories/new${activeTab.key ? `?tab=${activeTab.key}${sub && sub !== "all" ? `&sub=${sub}` : ""}` : ""}`}
          className="story-archive-mini-btn story-archive-mini-btn-primary"
        >
          + 새 스토리
        </Link>

        <Link
          href="/admin/stories"
          className="story-archive-mini-btn"
        >
          관리
        </Link>
      </div>
    ) : null}

    <span className="meta-pill">{totalCount}개</span>
  </div>
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
  <div className="story-archive-card-shell">
    <Link
  href={buildStoryDetailHref({
    slug: story.slug,
    tab: activeTab.key,
    sub: sub !== "all" ? sub : undefined,
    tag: selectedTag || undefined,
    q,
    years: selectedYears,
    characters: rawSelectedCharacterKeys,
    scope,
    sort,
    page: currentPage,
  })}
  className="story-archive-link"
>
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
            <span className="story-archive-badge">{visibilityLabel}</span>
          ) : null}

          <span className="story-archive-date">
            {formatStoryDate(story)}
          </span>
        </div>

        <h2 className="story-archive-title">{story.title}</h2>

        {story.summary ? (
          <p className="story-archive-summary">{story.summary}</p>
        ) : null}
      </div>
    </Link>

    {tags.length > 0 ? (
      <div className="story-archive-tags-inline">
        {tags.slice(0, 4).map((tag) => (
          <Link
            key={tag}
            href={buildStoriesHref({
              tab: activeTab.key,
              sub: sub !== "all" ? sub : undefined,
              tag,
              q: "",
              years: selectedYears,
              characters: rawSelectedCharacterKeys,
              scope,
              sort,
              page: 1,
            })}
            className="story-card-tag"
          >
            #{tag}
          </Link>
        ))}
      </div>
    ) : null}
  </div>
</li>
                  );
                })}
              </ul>

              {totalPages > 1 ? (
                <nav className="story-pagination" aria-label="스토리 페이지 이동">
                  <Link
                    href={buildStoriesHref({
  tab: activeTab.key,
  sub: sub !== "all" ? sub : undefined,
  q,
  years: selectedYears,
  characters: rawSelectedCharacterKeys,
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
  sub: sub !== "all" ? sub : undefined,
  q,
  years: selectedYears,
  characters: rawSelectedCharacterKeys,
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
  sub: sub !== "all" ? sub : undefined,
  q,
  years: selectedYears,
  characters: rawSelectedCharacterKeys,
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