import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import CardsFilterModal from "@/components/cards/CardsFilterModal";
import CardsSortModal from "@/components/cards/CardsSortModal";
import { optimizedImageUrl } from "@/lib/media/optimized-image";
import { getImageDerivativeObject, resolveImageDerivativeUrl } from "@/lib/media/image-derivative-server";

type CardsPageProps = {
  searchParams?: Promise<{
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
    tag?: string;
    sort?: string;
    illustrations?: string;
    page?: string;
  }>;
};

function getAttributeClass(attribute?: string | null) {
  const value = String(attribute || "").trim().toLowerCase();

  switch (value) {
    case "결단력":
    case "decisiveness":
    case "judgment":
    case "decision":
      return "stat-decisiveness";

    case "창의력":
    case "creativity":
      return "stat-creativity";

    case "친화력":
    case "affinity":
      return "stat-affinity";

    case "추진력":
    case "drive":
    case "action":
    case "execution":
      return "stat-drive";

    default:
      return "";
  }
}

const CHARACTER_LABEL_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const RARITY_LABEL_MAP: Record<string, string> = {
  nh: "NH",
  n: "N",
  r: "R",
  sr: "SR",
  er: "ER",
  ser: "SER",
  ssr: "SSR",
  sp: "SP",
  ur: "UR",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  date: "데이트 연계",
  main_story: "메인스토리 연계",
  side_story: "비밀이야기 / 외전 연계",
  birthday: "생일",
  anniversary: "주년",
  event: "이벤트",
  charge: "누적충전 카드",
  free: "무료 카드",
  other: "미분류",
};

const SORT_LABEL_MAP: Record<string, string> = {
  latest: "최신 등록순",
  oldest: "오래된 순",
  year_desc: "연도 높은 순",
  year_asc: "연도 낮은 순",
  title: "제목순",
  rarity: "등급순",
};

const RARITY_SORT_ORDER: Record<string, number> = {
  nh: 0,
  n: 1,
  r: 2,
  sr: 3,
  er: 4,
  ser: 5,
  ssr: 6,
  sp: 7,
  ur: 8,
};

function getCategoryLabel(value: string | null | undefined) {
  if (!value || value === "other") return "미분류";
  return CATEGORY_LABEL_MAP[value] ?? "미분류";
}

function getRarityLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return RARITY_LABEL_MAP[value] ?? String(value).toUpperCase();
}

function getVisiblePageNumbers(
  totalPages: number,
  currentPage: number
) {
  const MAX_VISIBLE = 10;

  if (totalPages <= MAX_VISIBLE) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  // 총 10개 숫자만 표시하고, 첫 페이지와 마지막 페이지는 항상 유지.
  // 예: 15페이지 / 현재 1페이지 -> 1 2 3 4 5 6 7 8 9 15
  const innerCount = MAX_VISIBLE - 2;
  let start = Math.max(2, currentPage - Math.floor(innerCount / 2));
  let end = start + innerCount - 1;

  if (end >= totalPages) {
    end = totalPages - 1;
    start = end - innerCount + 1;
  }

  const middle = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index
  );

  return [1, ...middle, totalPages];
}

export default async function CardsPage({ searchParams }: CardsPageProps) {
  const admin = await isAdmin();
  const params = searchParams ? await searchParams : {};

  const q = String(params?.q || "").trim().toLowerCase();
  const rarity = String(params?.rarity || "").trim().toLowerCase();
  const category = String(params?.category || "").trim();
  const character = String(params?.character || "").trim();
  const year = String(params?.year || "").trim();
  const tag = String(params?.tag || "").trim();
  const sort = String(params?.sort || "latest").trim();
  const includeIllustrations = String(params?.illustrations || "") === "1";
  const page = Math.max(1, Number(String(params?.page || "1")) || 1);
const ITEMS_PER_PAGE = 15;

 const illustrationQuery = includeIllustrations
  ? supabase
      .from("illustrations")
      .select(
        "id, title, image_url, release_year, release_date, created_at, summary, primary_character_id"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
  : Promise.resolve({ data: [], error: null });

 const [
  { data: cards, error },
  { data: characters },
  { data: illustrations, error: illustrationsError },
] = await Promise.all([
  supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, created_at, thumbnail_url, cover_image_url, card_category, summary, primary_character_id"
    )
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("created_at", { ascending: false }),

  supabase.from("characters").select("id, key"),
  illustrationQuery,
]);
const characterKeyMap = new Map(
  (characters ?? []).map((item: any) => [item.id, item.key])
);

const allCards =
  (cards ?? []).map((card: any) => {
    const characterKey = characterKeyMap.get(card.primary_character_id) ?? "";
    return { ...card, characterKey };
  }) ?? [];

const allIllustrations =
  ((illustrations ?? []) as any[]).map((item: any) => {
    const characterKey = characterKeyMap.get(item.primary_character_id) ?? "";
    return { ...item, characterKey };
  }) ?? [];

const cardIds = allCards.map((card: any) => card.id);

let tagSearchTextByCardId = new Map<string, string>();

if (cardIds.length > 0) {
  const { data: itemTags, error: itemTagsError } = await supabase
    .from("item_tags")
    .select("item_id, tag_id")
    .eq("item_type", "card")
    .in("item_id", cardIds);

  if (itemTagsError) {
    throw new Error(itemTagsError.message);
  }

  const tagIds = Array.from(
    new Set((itemTags ?? []).map((row: any) => row.tag_id))
  );

  if (tagIds.length > 0) {
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    if (tagsError) {
      throw new Error(tagsError.message);
    }

    const tagTextMap = new Map(
      (tags ?? []).map((tag: any) => [
        tag.id,
        [tag.label, tag.name, tag.slug].filter(Boolean).join(" ").toLowerCase(),
      ])
    );

    const grouped = new Map<string, string[]>();

    for (const row of itemTags ?? []) {
      const tagText = tagTextMap.get(row.tag_id);
      if (!tagText) continue;

      const prev = grouped.get(row.item_id) ?? [];
      prev.push(tagText);
      grouped.set(row.item_id, prev);
    }

    tagSearchTextByCardId = new Map(
      Array.from(grouped.entries()).map(([itemId, texts]) => [
        itemId,
        texts.join(" ").toLowerCase(),
      ])
    );
  }
}

const baseFilteredCards = allCards.filter((card: any) => {
  const summaryText = String(card.summary || "").toLowerCase();
  const tagText = tagSearchTextByCardId.get(card.id) ?? "";

  const matchesQ =
    !q ||
    String(card.title || "").toLowerCase().includes(q) ||
    String(card.slug || "").toLowerCase().includes(q) ||
    summaryText.includes(q) ||
    tagText.includes(q);

  const matchesRarity =
    !rarity || String(card.rarity || "").toLowerCase() === rarity;

  const normalizedCategory = card.card_category ?? "";
  const matchesCategory =
    !category ||
    (category === "__uncategorized__"
      ? !normalizedCategory || normalizedCategory === "other"
      : normalizedCategory === category);

  const matchesCharacter = !character || card.characterKey === character;
  const matchesYear = !year || String(card.release_year || "") === year;

  return (
    matchesQ &&
    matchesRarity &&
    matchesCategory &&
    matchesCharacter &&
    matchesYear
  );
});

  let filteredCards = baseFilteredCards;

  if (tag && baseFilteredCards.length > 0) {
    const baseCardIds = baseFilteredCards.map((card: any) => card.id);

    const { data: itemTags } = await supabase
      .from("item_tags")
      .select("item_id, tag_id")
      .eq("item_type", "card")
      .in("item_id", baseCardIds);

    const relatedTagIds = Array.from(
      new Set((itemTags ?? []).map((row) => row.tag_id))
    );

    if (relatedTagIds.length > 0) {
      const { data: relatedTags } = await supabase
        .from("tags")
        .select("id, slug, label, name")
        .in("id", relatedTagIds);

      const normalizedTargetTag = tag.toLowerCase();

      const matchedTagIds = new Set(
        (relatedTags ?? [])
          .filter((row) =>
            [row.slug, row.label, row.name]
              .filter(Boolean)
              .some((value) =>
  String(value).trim().toLowerCase().includes(normalizedTargetTag)
)
          )
          .map((row) => row.id)
      );

      if (matchedTagIds.size > 0) {
        const matchedCardIds = new Set(
          (itemTags ?? [])
            .filter((row) => matchedTagIds.has(row.tag_id))
            .map((row) => row.item_id)
        );

        filteredCards = baseFilteredCards.filter((card: any) =>
          matchedCardIds.has(card.id)
        );
      } else {
        filteredCards = [];
      }
    } else {
      filteredCards = [];
    }
  }
const filteredIllustrations = includeIllustrations
  ? allIllustrations.filter((item: any) => {
      const titleText = String(item.title || "").toLowerCase();
      const summaryText = String(item.summary || "").toLowerCase();

      const matchesQ = !q || titleText.includes(q) || summaryText.includes(q);
      const matchesYear = !year || String(item.release_year || "") === year;
      const matchesCharacter = !character || item.characterKey === character;

      // 카드 전용 필터가 활성화되어 있으면 일반 일러스트는 섞지 않는다.
      const hasCardOnlyFilter = Boolean(rarity || category || tag);

      return (
        !hasCardOnlyFilter &&
        matchesQ &&
        matchesYear &&
        matchesCharacter
      );
    })
  : [];

const sortedCards = [...filteredCards].sort((a: any, b: any) => {
  const aTitle = String(a.title || "");
  const bTitle = String(b.title || "");

  const aYear = Number(a.release_year || 0);
  const bYear = Number(b.release_year || 0);

  const aRelease = a.release_date ? new Date(a.release_date).getTime() : 0;
  const bRelease = b.release_date ? new Date(b.release_date).getTime() : 0;

  const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;

  const aRarity =
    RARITY_SORT_ORDER[String(a.rarity || "").toLowerCase()] ?? -1;
  const bRarity =
    RARITY_SORT_ORDER[String(b.rarity || "").toLowerCase()] ?? -1;

  switch (sort) {
    case "oldest":
      return (
        aCreated - bCreated ||
        aRelease - bRelease ||
        aTitle.localeCompare(bTitle, "ko")
      );

    case "year_desc":
      return (
        bYear - aYear ||
        bRelease - aRelease ||
        aTitle.localeCompare(bTitle, "ko")
      );

    case "year_asc":
      return (
        aYear - bYear ||
        aRelease - bRelease ||
        aTitle.localeCompare(bTitle, "ko")
      );

    case "title":
      return aTitle.localeCompare(bTitle, "ko") || bYear - aYear;

    case "rarity":
      return (
        bRarity - aRarity ||
        bYear - aYear ||
        bRelease - aRelease ||
        aTitle.localeCompare(bTitle, "ko")
      );

    case "latest":
    default:
      return (
        bCreated - aCreated ||
        bRelease - aRelease ||
        bYear - aYear ||
        aTitle.localeCompare(bTitle, "ko")
      );
  }
});

const mixedArchiveItems = includeIllustrations
  ? [
      ...sortedCards.map((card: any) => ({ kind: "card" as const, data: card })),
      ...filteredIllustrations.map((item: any) => ({
        kind: "illustration" as const,
        data: item,
      })),
    ].sort((a: any, b: any) => {
      const aData = a.data;
      const bData = b.data;
      const aTitle = String(aData.title || "");
      const bTitle = String(bData.title || "");
      const aYear = Number(aData.release_year || 0);
      const bYear = Number(bData.release_year || 0);
      const aRelease = aData.release_date
        ? new Date(aData.release_date).getTime()
        : 0;
      const bRelease = bData.release_date
        ? new Date(bData.release_date).getTime()
        : 0;
      const aCreated = aData.created_at
        ? new Date(aData.created_at).getTime()
        : 0;
      const bCreated = bData.created_at
        ? new Date(bData.created_at).getTime()
        : 0;
      const aRarity =
        a.kind === "card"
          ? RARITY_SORT_ORDER[String(aData.rarity || "").toLowerCase()] ?? -1
          : -1;
      const bRarity =
        b.kind === "card"
          ? RARITY_SORT_ORDER[String(bData.rarity || "").toLowerCase()] ?? -1
          : -1;

      switch (sort) {
        case "oldest":
          return aCreated - bCreated || aRelease - bRelease || aTitle.localeCompare(bTitle, "ko");
        case "year_desc":
          return bYear - aYear || bRelease - aRelease || aTitle.localeCompare(bTitle, "ko");
        case "year_asc":
          return aYear - bYear || aRelease - bRelease || aTitle.localeCompare(bTitle, "ko");
        case "title":
          return aTitle.localeCompare(bTitle, "ko") || bYear - aYear;
        case "rarity":
          return bRarity - aRarity || bYear - aYear || bRelease - aRelease || aTitle.localeCompare(bTitle, "ko");
        case "latest":
        default:
          return bCreated - aCreated || bRelease - aRelease || bYear - aYear || aTitle.localeCompare(bTitle, "ko");
      }
    })
  : sortedCards.map((card: any) => ({ kind: "card" as const, data: card }));

const totalCount = mixedArchiveItems.length;
const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
const currentPage = Math.min(page, totalPages);

const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const pagedItems = mixedArchiveItems.slice(startIndex, endIndex);
const pagedCards = pagedItems
  .filter((item: any) => item.kind === "card")
  .map((item: any) => item.data);

const pagedCardIds = pagedCards.map((card: any) => card.id);
const afterThumbMap = new Map<string, string>();

if (pagedCardIds.length > 0) {
  const { data: afterThumbs } = await supabase
    .from("media_assets")
    .select("parent_id, url")
    .eq("parent_type", "card")
    .eq("media_type", "image")
    .eq("usage_type", "thumbnail")
    .eq("title", "evolution_after")
    .in("parent_id", pagedCardIds);

  for (const item of afterThumbs ?? []) {
    afterThumbMap.set(item.parent_id, item.url);
  }
}


const optionSource = includeIllustrations
  ? [...allCards, ...allIllustrations]
  : allCards;

const cardListDerivativeSources = [
  ...pagedCards.flatMap((card: any) => [
    card.thumbnail_url,
    card.cover_image_url,
  ]),
  ...Array.from(afterThumbMap.values()),
];

const cardListImageDerivatives =
  await getImageDerivativeObject(
    cardListDerivativeSources
  );

const yearOptions = Array.from(
  new Set(
    optionSource
      .map((item: any) => item.release_year)
      .filter(Boolean)
      .map(String)
  )
).sort((a, b) => Number(b) - Number(a));

const characterOptions = Array.from(
  new Set(optionSource.map((item: any) => item.characterKey).filter(Boolean))
);

const currentListParams = new URLSearchParams();

if (q) currentListParams.set("q", q);
if (rarity) currentListParams.set("rarity", rarity);
if (category) currentListParams.set("category", category);
if (character) currentListParams.set("character", character);
if (year) currentListParams.set("year", year);
if (tag) currentListParams.set("tag", tag);
if (sort) currentListParams.set("sort", sort);
if (includeIllustrations) currentListParams.set("illustrations", "1");

const currentListQuery = currentListParams.toString();



function buildCardsPageHref(targetPage: number) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (rarity) params.set("rarity", rarity);
  if (category) params.set("category", category);
  if (character) params.set("character", character);
  if (year) params.set("year", year);
  if (tag) params.set("tag", tag);
  if (sort) params.set("sort", sort);
  if (includeIllustrations) params.set("illustrations", "1");
  if (targetPage > 1) params.set("page", String(targetPage));

  const query = params.toString();
  return query ? `/cards?${query}` : "/cards";
}

function buildIllustrationToggleHref(nextEnabled: boolean) {
  const params = new URLSearchParams(currentListParams.toString());
  params.delete("page");

  if (nextEnabled) {
    params.set("illustrations", "1");
  } else {
    params.delete("illustrations");
  }

  const query = params.toString();
  return query ? `/cards?${query}` : "/cards";
}

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Cards</div>
        <h1 className="page-title">카드 아카이브</h1>
        <p className="page-desc">카드와 연결된 컨텐츠 아카이브</p>
      </header>

      <form className="cards-quick-search" method="get" action="/cards">
        <span className="material-symbols-rounded cards-quick-search-icon">
          search
        </span>
        {rarity ? <input type="hidden" name="rarity" value={rarity} /> : null}
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {character ? <input type="hidden" name="character" value={character} /> : null}
        {year ? <input type="hidden" name="year" value={year} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        {sort && sort !== "latest" ? <input type="hidden" name="sort" value={sort} /> : null}
        {includeIllustrations ? (
          <input type="hidden" name="illustrations" value="1" />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="카드명 / 요약 / 태그 검색"
          className="cards-quick-search-input"
        />
        <button type="submit" className="cards-quick-search-button">
          검색
        </button>
      </form>

      <div className="cards-page-toolbar">
        <div className="cards-page-toolbar-left cards-page-toolbar-left-modes">
          {admin ? (
            <Link href="/admin/cards/new" className="cards-new-button">
              새 카드 등록
            </Link>
          ) : null}

          <Link
            href={buildIllustrationToggleHref(!includeIllustrations)}
            className={`cards-illustration-toggle${
              includeIllustrations ? " is-on" : ""
            }`}
            aria-pressed={includeIllustrations}
          >
            <span className="cards-illustration-toggle-track" aria-hidden="true">
              <span className="cards-illustration-toggle-knob" />
            </span>
            <span>카드 외 일러스트</span>
            <small>{includeIllustrations ? "ON" : "OFF"}</small>
          </Link>
        </div>

        <div className="cards-page-toolbar-right">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span className="meta-pill">
              정렬: {SORT_LABEL_MAP[sort] ?? "최신 등록순"}
            </span>

            <CardsSortModal
              defaultValue={sort}
              sortOptions={[
                { value: "latest", label: "최신 등록순" },
                { value: "oldest", label: "오래된 순" },
                { value: "year_desc", label: "연도 높은 순" },
                { value: "year_asc", label: "연도 낮은 순" },
                { value: "title", label: "제목순" },
                { value: "rarity", label: "등급순" },
              ]}
              preserveValues={{
                q,
                rarity,
                category,
                character,
                year,
                tag,
                illustrations: includeIllustrations ? "1" : "",
              }}
            />

            <CardsFilterModal
              defaultValues={{
                q,
                rarity,
                category,
                character,
                year,
                sort,
                tag,
                illustrations: includeIllustrations ? "1" : "",
              }}
              yearOptions={yearOptions}
              characterOptions={characterOptions.map((key) => ({
                value: key,
                label: CHARACTER_LABEL_MAP[key] ?? key,
              }))}
              rarityOptions={Object.entries(RARITY_LABEL_MAP).map(
                ([value, label]) => ({
                  value,
                  label,
                })
              )}
              categoryOptions={[
                { value: "__uncategorized__", label: "미분류" },
                ...Object.entries(CATEGORY_LABEL_MAP).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {tag ? (
        <div className="cards-active-tag-row">
          <span className="cards-active-tag-chip">#{tag}</span>
          <Link
            href={includeIllustrations ? "/cards?illustrations=1" : "/cards"}
            className="nav-link"
          >
            전체 보기
          </Link>
        </div>
      ) : null}

      {error && <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>}
      {includeIllustrations && illustrationsError ? (
        <pre className="error-box">
          {JSON.stringify(illustrationsError, null, 2)}
        </pre>
      ) : null}

    {!mixedArchiveItems || mixedArchiveItems.length === 0 ? (
  <div className="empty-box">
    {includeIllustrations
      ? "조건에 맞는 카드 / 일러스트가 없습니다."
      : "조건에 맞는 카드가 없습니다."}
  </div>
) : (
  <>
    {includeIllustrations ? (
      <div className="cards-mixed-masonry">
        {pagedItems.map((entry: any) => {
          if (entry.kind === "illustration") {
            const item = entry.data;
            return (
              <article
                key={`illustration-${item.id}`}
                className="cards-mixed-item cards-mixed-illustration"
              >
                <Link
                  href={
                    currentListQuery
                      ? `/illustrations/${item.id}?${currentListQuery}`
                      : `/illustrations/${item.id}?illustrations=1`
                  }
                  className="cards-mixed-illustration-link"
                >
<div className="cards-mixed-media">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="cards-mixed-image"
                    />
                  ) : (
                    <div className="story-thumb-empty">NO IMAGE</div>
                  )}
                </div>
                <div className="cards-mixed-body">
                  <span className="cards-mixed-kind">ILLUST</span>
                  <h2 className="cards-mixed-title">{item.title}</h2>
                  {item.release_year ? (
                    <div className="cards-mixed-meta">{item.release_year}</div>
                  ) : null}
                </div>
                </Link>
              </article>
            );
          }

          const card = entry.data;
          const beforeImageUrl = card.thumbnail_url || card.cover_image_url || "";
          const afterImageUrl = afterThumbMap.get(card.id) || "";
          const attrClass = getAttributeClass(card.attribute);

          return (
            <article
              key={`card-${card.id}`}
              className="cards-mixed-item cards-mixed-card"
            >
              <Link
                href={
                  currentListQuery
                    ? `/cards/${card.slug}?${currentListQuery}`
                    : `/cards/${card.slug}`
                }
                className={`card-thumb-link ${attrClass}`.trim()}
              >
                <div
                  className={`card-thumb-media${afterImageUrl ? " has-after" : ""}`}
                >
                  <div className="card-thumb-badges">
                    <span className="card-thumb-rarity">
                      {getRarityLabel(card.rarity)}
                    </span>
                  </div>
                  {beforeImageUrl ? (
                    <>
                      <img
                        src={resolveImageDerivativeUrl(beforeImageUrl, cardListImageDerivatives, "thumb")}
                        alt={card.title}
                        className="card-thumb-image card-thumb-image-before"
                      loading="lazy"
                      decoding="async"
                    />
                      {afterImageUrl ? (
                        <img
                          src={resolveImageDerivativeUrl(afterImageUrl, cardListImageDerivatives, "thumb")}
                          alt={`${card.title} evolution after`}
                          className="card-thumb-image card-thumb-image-after"
                        loading="lazy"
                        decoding="async"
                      />
                      ) : null}
                    </>
                  ) : (
                    <div className="story-thumb-empty">NO IMAGE</div>
                  )}
                  <div className="card-thumb-overlay">
                    <div className="card-thumb-overlay-inner">
                      <h2 className="card-thumb-overlay-title">{card.title}</h2>
                    </div>
                  </div>
                </div>
                <div className="card-thumb-body card-thumb-body-minimal">
                  <span className="cards-mixed-kind">CARD</span>
                  <h2 className="card-thumb-visible-title">{card.title}</h2>
                  <div className="card-thumb-meta-row">
                    <span className="meta-pill">
                      {getCategoryLabel(card.card_category)}
                    </span>
                    {card.release_year ? (
                      <span className="meta-pill">{card.release_year}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    ) : (
      <ul className="card-thumb-grid">
        {pagedCards.map((card: any) => {
          const beforeImageUrl =
            card.thumbnail_url || card.cover_image_url || "";
          const afterImageUrl = afterThumbMap.get(card.id) || "";
          const attrClass = getAttributeClass(card.attribute);

          return (
            <li key={card.id} className="card-thumb-card">
              <Link
                href={
                  currentListQuery
                    ? `/cards/${card.slug}?${currentListQuery}`
                    : `/cards/${card.slug}`
                }
                className={`card-thumb-link ${attrClass}`.trim()}
              >
                <div
                  className={`card-thumb-media${
                    afterImageUrl ? " has-after" : ""
                  }`}
                >
                  <div className="card-thumb-badges">
                    <span className="card-thumb-rarity">
                      {getRarityLabel(card.rarity)}
                    </span>
                  </div>
                  {beforeImageUrl ? (
                    <>
                      <img
                        src={resolveImageDerivativeUrl(beforeImageUrl, cardListImageDerivatives, "thumb")}
                        alt={card.title}
                        className="card-thumb-image card-thumb-image-before"
                      loading="lazy"
                      decoding="async"
                    />
                      {afterImageUrl ? (
                        <img
                          src={resolveImageDerivativeUrl(afterImageUrl, cardListImageDerivatives, "thumb")}
                          alt={`${card.title} evolution after`}
                          className="card-thumb-image card-thumb-image-after"
                        loading="lazy"
                        decoding="async"
                      />
                      ) : null}
                    </>
                  ) : (
                    <div className="story-thumb-empty">NO IMAGE</div>
                  )}

                  <div className="card-thumb-overlay">
                    <div className="card-thumb-overlay-inner">
                      <h2 className="card-thumb-overlay-title">{card.title}</h2>
                    </div>
                  </div>
                </div>

                <div className="card-thumb-body card-thumb-body-minimal">
                  <h2 className="card-thumb-visible-title">{card.title}</h2>
                  {card.summary ? (
                    <p className="card-thumb-summary">{card.summary}</p>
                  ) : null}
                  <div className="card-thumb-meta-row">
                    <span className="meta-pill">
                      {getCategoryLabel(card.card_category)}
                    </span>
                    {card.release_year ? (
                      <span className="meta-pill">{card.release_year}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    )}

{totalPages > 1 ? (
  <nav className="cards-pagination" aria-label="카드 페이지 이동">
    {currentPage === 1 ? (
      <span className="cards-pagination-button is-disabled">←</span>
    ) : (
      <Link
        href={buildCardsPageHref(currentPage - 1)}
        className="cards-pagination-button"
        aria-label="이전 페이지"
      >
        ←
      </Link>
    )}

    <div className="cards-pagination-numbers">
      {getVisiblePageNumbers(totalPages, currentPage).map((pageNumber) => {
        const isActive = pageNumber === currentPage;

        return (
          <Link
            key={pageNumber}
            href={buildCardsPageHref(pageNumber)}
            className={`cards-pagination-number${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNumber}
          </Link>
        );
      })}
    </div>

    {currentPage === totalPages ? (
      <span className="cards-pagination-button is-disabled">→</span>
    ) : (
      <Link
        href={buildCardsPageHref(currentPage + 1)}
        className="cards-pagination-button"
        aria-label="다음 페이지"
      >
        →
      </Link>
    )}

    <form method="get" action="/cards" className="cards-page-jump">
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {rarity ? <input type="hidden" name="rarity" value={rarity} /> : null}
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {character ? (
        <input type="hidden" name="character" value={character} />
      ) : null}
      {year ? <input type="hidden" name="year" value={year} /> : null}
      {tag ? <input type="hidden" name="tag" value={tag} /> : null}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {includeIllustrations ? (
        <input type="hidden" name="illustrations" value="1" />
      ) : null}

      <input
        className="cards-page-jump-input"
        type="number"
        name="page"
        min={1}
        max={totalPages}
        defaultValue={currentPage}
        aria-label="이동할 페이지 번호"
      />
      <button type="submit" className="cards-page-jump-button">
        이동
      </button>
    </form>
  </nav>
) : null}
  </>
)}

  </main>
  );
}
