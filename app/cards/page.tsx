import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import CardsFilterModal from "@/components/cards/CardsFilterModal";
import CardsSortModal from "@/components/cards/CardsSortModal";

type CardsPageProps = {
  searchParams?: Promise<{
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
    tag?: string;
    sort?: string;
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
  date: "데이트 카드",
  main_story: "메인스토리 연계",
  side_story: "외전 / 서브",
  birthday: "생일 카드",
  charge: "누적충전 카드",
  free: "무료 카드",
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
  if (!value) return "미분류";
  return CATEGORY_LABEL_MAP[value] ?? "미분류";
}

function getRarityLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return RARITY_LABEL_MAP[value] ?? String(value).toUpperCase();
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
  const page = Math.max(1, Number(String(params?.page || "1")) || 1);
const ITEMS_PER_PAGE = 15;

  const [{ data: cards, error }, { data: characters }] = await Promise.all([
    supabase
      .from("cards")
      .select(
        "id, title, slug, rarity, attribute, release_year, release_date, created_at, thumbnail_url, cover_image_url, card_category, primary_character_id"
      )
      .eq("is_published", true)
      .order("release_year", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase.from("characters").select("id, key"),
  ]);

  const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  const allCards =
    (cards ?? []).map((card: any) => {
      const characterKey = characterKeyMap.get(card.primary_character_id) ?? "";
      return { ...card, characterKey };
    }) ?? [];

  const baseFilteredCards = allCards.filter((card: any) => {
    const matchesQ =
      !q ||
      String(card.title || "").toLowerCase().includes(q) ||
      String(card.slug || "").toLowerCase().includes(q);

    const matchesRarity =
      !rarity || String(card.rarity || "").toLowerCase() === rarity;

    const normalizedCategory = card.card_category ?? "";
    const matchesCategory =
      !category ||
      (category === "__uncategorized__"
        ? !normalizedCategory
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
              .some(
                (value) =>
                  String(value).trim().toLowerCase() === normalizedTargetTag
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

const totalCount = sortedCards.length;
const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
const currentPage = Math.min(page, totalPages);

const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const pagedCards = sortedCards.slice(startIndex, endIndex);

const cardIds = pagedCards.map((card: any) => card.id);
const afterThumbMap = new Map<string, string>();
if (cardIds.length > 0) {
  const { data: afterThumbs } = await supabase
    .from("media_assets")
    .select("parent_id, url")
    .eq("parent_type", "card")
    .eq("media_type", "image")
    .eq("usage_type", "thumbnail")
    .eq("title", "evolution_after")
    .in("parent_id", cardIds);

  for (const item of afterThumbs ?? []) {
    afterThumbMap.set(item.parent_id, item.url);
  }
}

const yearOptions = Array.from(
  new Set(
    allCards
      .map((card: any) => card.release_year)
      .filter(Boolean)
      .map(String)
  )
).sort((a, b) => Number(b) - Number(a));

const characterOptions = Array.from(
  new Set(allCards.map((card: any) => card.characterKey).filter(Boolean))
);

const currentListParams = new URLSearchParams();

if (q) currentListParams.set("q", q);
if (rarity) currentListParams.set("rarity", rarity);
if (category) currentListParams.set("category", category);
if (character) currentListParams.set("character", character);
if (year) currentListParams.set("year", year);
if (tag) currentListParams.set("tag", tag);
if (sort) currentListParams.set("sort", sort);

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
  if (targetPage > 1) params.set("page", String(targetPage));

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

      <div className="cards-page-toolbar">
        <div className="cards-page-toolbar-left">
          {admin ? (
            <Link href="/admin/cards/new" className="primary-button">
              새 카드 등록
            </Link>
          ) : null}
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
          <Link href="/cards" className="nav-link">
            전체 보기
          </Link>
        </div>
      ) : null}

      {error && <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>}

    {!sortedCards || sortedCards.length === 0 ? (
  <div className="empty-box">조건에 맞는 카드가 없습니다.</div>
) : (
  <>
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
                {beforeImageUrl ? (
                  <>
                    <img
                      src={beforeImageUrl}
                      alt={card.title}
                      className="card-thumb-image card-thumb-image-before"
                    />
                    {afterImageUrl ? (
                      <img
                        src={afterImageUrl}
                        alt={`${card.title} evolution after`}
                        className="card-thumb-image card-thumb-image-after"
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
                <div className="card-thumb-meta-row">
                  <span className="meta-pill">
                    {getRarityLabel(card.rarity)}
                  </span>
                  <span className="meta-pill">
                    {getCategoryLabel(card.card_category)}
                  </span>
                  {card.release_year ? (
                    <span className="meta-pill">{card.release_year}</span>
                  ) : null}
                </div>

                <span className="mini-button">상세 보기</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>

{totalPages > 1 ? (
  <nav className="cards-pagination" aria-label="카드 페이지 이동">
    {currentPage === 1 ? (
      <span className="cards-pagination-button is-disabled">←</span>
    ) : (
      <Link
        href={buildCardsPageHref(currentPage - 1)}
        className="cards-pagination-button"
      >
        ←
      </Link>
    )}

    <div className="cards-pagination-numbers">
      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
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
      >
        →
      </Link>
    )}
  </nav>
) : null}
  </>
)}

  </main>
  );
}