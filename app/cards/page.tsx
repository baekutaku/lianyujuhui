import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import CardsFilterModal from "@/components/cards/CardsFilterModal";

type CardsPageProps = {
  searchParams?: Promise<{
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
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

  const [{ data: cards, error }, { data: characters }] = await Promise.all([
    supabase
      .from("cards")
      .select(
        "id, title, slug, rarity, attribute, release_year, thumbnail_url, cover_image_url, card_category, primary_character_id"
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

  const filteredCards = allCards.filter((card: any) => {
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

  const cardIds = filteredCards.map((card: any) => card.id);
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
          <CardsFilterModal
            defaultValues={{
              q,
              rarity,
              category,
              character,
              year,
            }}
            yearOptions={yearOptions}
            characterOptions={characterOptions.map((key) => ({
              value: key,
              label: CHARACTER_LABEL_MAP[key] ?? key,
            }))}
            rarityOptions={Object.entries(RARITY_LABEL_MAP).map(([value, label]) => ({
              value,
              label,
            }))}
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

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!filteredCards || filteredCards.length === 0 ? (
        <div className="empty-box">조건에 맞는 카드가 없습니다.</div>
      ) : (
        <ul className="card-thumb-grid">
          {filteredCards.map((card: any) => {
            const beforeImageUrl =
              card.thumbnail_url || card.cover_image_url || "";
            const afterImageUrl = afterThumbMap.get(card.id) || "";
            const attrClass = getAttributeClass(card.attribute);

            return (
              <li key={card.id} className="card-thumb-card">
                <Link
                  href={`/cards/${card.slug}`}
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
                        <h2 className="card-thumb-overlay-title">
                          {card.title}
                        </h2>
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
      )}
    </main>
  );
}