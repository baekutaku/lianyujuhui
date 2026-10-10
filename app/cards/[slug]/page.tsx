import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { deleteCard } from "@/app/admin/actions";
import CardDetailMediaSwitcher from "@/components/cards/CardDetailMediaSwitcher";
import CardConnectedContent from "@/components/cards/CardConnectedContent";
import { getPhoneItemHref } from "@/lib/utils/getPhoneItemHref";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
    tag?: string;
    sort?: string;
  }>;
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

const ATTRIBUTE_LABEL_MAP: Record<string, string> = {
  execution: "추진력",
  drive: "추진력",
  affinity: "친화력",
  decision: "결단력",
  judgment: "결단력",
  creativity: "창의력",
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

const STORY_SUBTYPE_LABEL_MAP: Record<string, string> = {
  card_story: "데이트",
  asmr: "너의 곁에",
  side_story: "비밀이야기 / 외전",
  main_story: "메인스토리",
  behind_story: "막후의 장",
  xiyue_story: "서월국",
  myhome_story: "마이홈",
  company_project: "촬영장 / 회사 프로젝트",
};

const PHONE_SUBTYPE_LABEL_MAP: Record<string, string> = {
  message: "메시지",
  moment: "모멘트",
  call: "전화",
  video_call: "영상통화",
  article: "기사",
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

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRarityLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return RARITY_LABEL_MAP[value] ?? String(value).toUpperCase();
}

function getAttributeLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return ATTRIBUTE_LABEL_MAP[value] ?? value;
}
function getAttributeClass(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();

  switch (normalized) {
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


function getCategoryLabel(value: string | null | undefined) {
  if (!value || value === "other") return "미분류";
  return CATEGORY_LABEL_MAP[value] ?? "미분류";
}

function getStorySubtypeLabel(value: string | null | undefined) {
  if (!value) return "스토리";
  return STORY_SUBTYPE_LABEL_MAP[value] ?? value;
}

function getPhoneSubtypeLabel(value: string | null | undefined) {
  if (!value) return "휴대폰";
  return PHONE_SUBTYPE_LABEL_MAP[value] ?? value;
}

function getEventSubtypeLabel(value: string | null | undefined) {
  if (!value) return "이벤트";
  return value;
}

function getStoryHref(slug: string, from: string) {
  return `/stories/${slug}?from=${encodeURIComponent(from)}`;
}

function getEventHref(slug: string, from: string) {
  return `/events/${slug}?from=${encodeURIComponent(from)}`;
}

export default async function CardDetailPage({
  params,
  searchParams,
}: PageProps) {
  const admin = await isAdmin();
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : {};
 

  const q = String(resolvedSearchParams?.q || "").trim().toLowerCase();
  const rarity = String(resolvedSearchParams?.rarity || "").trim().toLowerCase();
  const category = String(resolvedSearchParams?.category || "").trim();
  const character = String(resolvedSearchParams?.character || "").trim();
  const year = String(resolvedSearchParams?.year || "").trim();
  const tag = String(resolvedSearchParams?.tag || "").trim();
  const sort = String(resolvedSearchParams?.sort || "latest").trim();

  const listParams = new URLSearchParams();
  if (q) listParams.set("q", q);
  if (rarity) listParams.set("rarity", rarity);
  if (category) listParams.set("category", category);
  if (character) listParams.set("character", character);
  if (year) listParams.set("year", year);
  if (tag) listParams.set("tag", tag);
  if (sort) listParams.set("sort", sort);

  const listQueryString = listParams.toString();
  const cardsListHref = listQueryString ? `/cards?${listQueryString}` : "/cards";

  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary, card_category, is_published, created_at, primary_character_id"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[cards/[slug]] card fetch error:", error);
  }

  if (!card) {
    notFound();
  }

  const attributeClass = getAttributeClass(card.attribute);
  const [{ data: allCards }, { data: characters }] = await Promise.all([
    supabase
      .from("cards")
      .select(
        "id, title, slug, rarity, attribute, release_year, release_date, created_at, thumbnail_url, cover_image_url, card_category, primary_character_id"
      )
      .eq("is_published", true),
    supabase.from("characters").select("id, key"),
  ]);

  const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  const allVisibleCards =
    (allCards ?? []).map((item: any) => {
      const characterKey = characterKeyMap.get(item.primary_character_id) ?? "";
      return { ...item, characterKey };
    }) ?? [];

  const baseFilteredCards = allVisibleCards.filter((item: any) => {
    const matchesQ =
      !q ||
      String(item.title || "").toLowerCase().includes(q) ||
      String(item.slug || "").toLowerCase().includes(q);

    const matchesRarity =
      !rarity || String(item.rarity || "").toLowerCase() === rarity;

    const normalizedCategory = item.card_category ?? "";
    const matchesCategory =
      !category ||
      (category === "__uncategorized__"
        ? !normalizedCategory || normalizedCategory === "other"
        : normalizedCategory === category);

    const matchesCharacter = !character || item.characterKey === character;
    const matchesYear = !year || String(item.release_year || "") === year;

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
    const baseCardIds = baseFilteredCards.map((item: any) => item.id);

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

        filteredCards = baseFilteredCards.filter((item: any) =>
          matchedCardIds.has(item.id)
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

  const currentIndex = sortedCards.findIndex((item: any) => item.id === card.id);
  const prevCard = currentIndex > 0 ? sortedCards[currentIndex - 1] : null;
  const nextCard =
    currentIndex >= 0 && currentIndex < sortedCards.length - 1
      ? sortedCards[currentIndex + 1]
      : null;

  const prevHref = prevCard
    ? listQueryString
      ? `/cards/${prevCard.slug}?${listQueryString}`
      : `/cards/${prevCard.slug}`
    : null;

  const nextHref = nextCard
    ? listQueryString
      ? `/cards/${nextCard.slug}?${listQueryString}`
      : `/cards/${nextCard.slug}`
    : null;

  const currentCardPath = listQueryString
    ? `/cards/${encodeURIComponent(card.slug)}?${listQueryString}`
    : `/cards/${encodeURIComponent(card.slug)}`;

  const { data: mediaRows } = await supabase
    .from("media_assets")
    .select("id, usage_type, title, url")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("media_type", "image");

  const beforeThumb =
    card.thumbnail_url ||
    mediaRows?.find(
      (item) =>
        item.usage_type === "thumbnail" && item.title !== "evolution_after"
    )?.url ||
    null;

  const afterThumb =
    mediaRows?.find(
      (item) =>
        item.usage_type === "thumbnail" && item.title === "evolution_after"
    )?.url || null;

  const beforeCover =
    card.cover_image_url ||
    mediaRows?.find(
      (item) => item.usage_type === "cover" && item.title !== "evolution_after"
    )?.url ||
    null;

  const afterCover =
    mediaRows?.find(
      (item) => item.usage_type === "cover" && item.title === "evolution_after"
    )?.url || null;

  const { data: tagRows } = await supabase
    .from("item_tags")
    .select("tag_id, sort_order")
    .eq("item_type", "card")
    .eq("item_id", card.id)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((tagRows ?? []).map((row) => row.tag_id)));
  let tags: string[] = [];

  if (tagIds.length > 0) {
    const { data: fullTags } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagMap = new Map(
      (fullTags ?? []).map((row) => [row.id, row.label ?? row.name ?? row.slug])
    );

    tags = (tagRows ?? [])
      .map((row) => tagMap.get(row.tag_id))
      .filter(Boolean) as string[];
  }

const { data: relations } = await supabase
    .from("item_relations")
    .select("parent_type, parent_id, child_type, child_id, relation_type")
    .eq("parent_type", "card")
    .eq("parent_id", card.id);

  // 역방향: 다른 카드가 이 카드를 child로 연결한 경우
  const { data: reverseCardRelations } = await supabase
    .from("item_relations")
    .select("parent_id")
    .eq("child_type", "card")
    .eq("child_id", card.id)
    .eq("relation_type", "card_card");

  const storyIds = (relations ?? [])
    .filter((rel) => rel.child_type === "story")
    .map((rel) => rel.child_id);

  const phoneIds = (relations ?? [])
    .filter((rel) => rel.child_type === "phone_item")
    .map((rel) => rel.child_id);

  const eventIds = (relations ?? [])
    .filter((rel) => rel.child_type === "event")
    .map((rel) => rel.child_id);

  const relatedCardIds = Array.from(new Set([
    ...(relations ?? [])
      .filter((rel) => rel.child_type === "card")
      .map((rel) => rel.child_id),
    ...(reverseCardRelations ?? [])
      .map((rel) => rel.parent_id),
  ])).filter((id) => id !== card.id);

  const [{ data: stories }, { data: phoneItems }, { data: events }, { data: relatedCards }] =
    await Promise.all([
      storyIds.length > 0
        ? supabase
            .from("stories")
            .select("id, title, slug, subtype")
            .in("id", storyIds)
        : Promise.resolve({ data: [] as any[] }),
      phoneIds.length > 0
        ? supabase
            .from("phone_items")
            .select("id, title, slug, subtype, content_json")
            .in("id", phoneIds)
        : Promise.resolve({ data: [] as any[] }),
      eventIds.length > 0
        ? supabase
            .from("events")
            .select("id, title, slug, subtype")
            .in("id", eventIds)
        : Promise.resolve({ data: [] as any[] }),
      relatedCardIds.length > 0
        ? supabase
            .from("cards")
            .select("id, title, slug, rarity")
            .in("id", relatedCardIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

  const storyTabLabel =
    (stories?.length ?? 0) > 0 &&
    stories!.every((story: any) => story.subtype === "card_story")
      ? "데이트"
      : "스토리";

  const releaseDateLabel = card.release_date
    ? String(card.release_date).replaceAll("-", ".")
    : "—";

  return (
    <main className="card-detail-page-figma">
      <div className="card-detail-back-row">
        <Link href={cardsListHref} className="card-detail-back-link">
          ← 카드 도감으로
        </Link>
      </div>

      <section
        className={`card-detail-figma ${attributeClass}`.trim()}
      >
        <div className="card-detail-figma-media">
          <div className="card-detail-media-panel">
            <CardDetailMediaSwitcher
              media={{
                title: card.title,
                beforeThumb,
                afterThumb,
                beforeCover,
                afterCover,
              }}
            />
          </div>
        </div>

        <div className="card-detail-figma-info">
          <p className="card-detail-database-label">
            Card Database
          </p>

          <h1 className="card-detail-figma-title">{card.title}</h1>

          <div className="card-detail-primary-meta">
            <span className="card-detail-soft-pill card-detail-rarity-pill">
              {getRarityLabel(card.rarity)}
            </span>

            <span className="card-detail-soft-pill card-detail-attribute-pill">
              주속성 · {getAttributeLabel(card.attribute)}
            </span>

            {!card.is_published && admin ? (
              <span className="card-detail-soft-pill">비공개 초안</span>
            ) : null}
          </div>

          {tags.length > 0 ? (
            <div className="card-detail-tag-row">
              {tags.map((item) => (
                <Link
                  key={item}
                  href={`/cards?tag=${encodeURIComponent(item)}`}
                  className="card-tag-link"
                >
                  #{item}
                </Link>
              ))}
            </div>
          ) : null}

          {card.summary ? (
            <p className="card-detail-summary">{card.summary}</p>
          ) : (
            <p className="card-detail-summary is-empty">
              등록된 카드 설명이 없습니다.
            </p>
          )}

          <div className="card-detail-facts">
            <div className="card-detail-fact">
              <span className="card-detail-fact-label">Release</span>
              <strong className="card-detail-fact-value">
                {releaseDateLabel}
              </strong>
            </div>

            <div className="card-detail-fact">
              <span className="card-detail-fact-label">Year</span>
              <strong className="card-detail-fact-value">
                {card.release_year || "—"}
              </strong>
            </div>

            <div className="card-detail-fact">
              <span className="card-detail-fact-label">Type</span>
              <strong className="card-detail-fact-value">
                {getCategoryLabel(card.card_category)}
              </strong>
            </div>
          </div>

          <CardConnectedContent
            storyLabel={storyTabLabel}
            stories={(stories ?? []).map((story: any) => ({
              id: story.id,
              title: story.title,
              href: getStoryHref(story.slug, currentCardPath),
              kicker: getStorySubtypeLabel(story.subtype),
            }))}
            phoneItems={(phoneItems ?? []).map((item: any) => ({
              id: item.id,
              title: item.title,
              href: getPhoneItemHref(item),
              kicker: getPhoneSubtypeLabel(item.subtype),
            }))}
            cards={(relatedCards ?? []).map((relCard: any) => ({
              id: relCard.id,
              title: relCard.title,
              href: `/cards/${relCard.slug}`,
              kicker: getRarityLabel(relCard.rarity),
            }))}
            events={(events ?? []).map((event: any) => ({
              id: event.id,
              title: event.title,
              href: getEventHref(event.slug, currentCardPath),
              kicker: getEventSubtypeLabel(event.subtype),
            }))}
          />

          <nav
            className="card-detail-secondary-nav"
            aria-label="카드 이동"
          >
            {prevHref ? (
              <Link
                href={prevHref}
                className="card-detail-secondary-link"
              >
                ← 이전 카드
              </Link>
            ) : (
              <span className="card-detail-secondary-link is-disabled">
                ← 이전 카드
              </span>
            )}

            {nextHref ? (
              <Link
                href={nextHref}
                className="card-detail-secondary-link"
              >
                다음 카드 →
              </Link>
            ) : (
              <span className="card-detail-secondary-link is-disabled">
                다음 카드 →
              </span>
            )}
          </nav>

          {admin ? (
            <div className="card-detail-admin-actions">
              <Link
                href={`/admin/cards/${encodeURIComponent(card.slug)}/edit`}
                className="story-action-button"
              >
                관리자 수정
              </Link>

              <Link
                href="/admin/cards/new"
                className="story-action-button story-action-muted"
              >
                새 카드 등록
              </Link>

              <form action={deleteCard} style={{ display: "inline-flex" }}>
                <input type="hidden" name="cardId" value={card.id} />
                <input type="hidden" name="slug" value={card.slug} />
                <button
                  type="submit"
                  className="story-action-button story-action-danger"
                  style={{ border: "none", cursor: "pointer" }}
                >
                  삭제
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
