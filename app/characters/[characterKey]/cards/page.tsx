import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    rarity?: string;
    attribute?: string;
    q?: string;
  }>;
};

type CardRow = {
  id: string;
  title: string;
  slug: string;
  rarity: string | null;
  attribute: string | null;
  release_year: number | null;
  release_date: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  summary: string | null;
  is_published: boolean | null;
};

const CHARACTER_LABELS: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const RARITY_LABELS: Record<string, string> = {
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

const ATTRIBUTE_LABELS: Record<string, string> = {
  drive: "추진력",
  judgment: "결단력",
  creativity: "창의력",
  affinity: "친화력",
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export default async function CharacterCardsPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const filters = (await searchParams) ?? {};

  const characterLabel = CHARACTER_LABELS[characterKey];
  if (!characterLabel) notFound();

  const rarityFilter = filters.rarity ?? "all";
  const attributeFilter = filters.attribute ?? "all";
  const q = filters.q?.trim() ?? "";

  const { data: character } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .eq("key", characterKey)
    .maybeSingle();

  if (!character) notFound();

  const { data: cards, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary, is_published"
    )
    .eq("primary_character_id", character.id)
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("release_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const filteredCards =
    ((cards as CardRow[] | null) ?? []).filter((card) => {
      const matchesRarity =
        rarityFilter === "all" || card.rarity === rarityFilter;
      const matchesAttribute =
        attributeFilter === "all" || card.attribute === attributeFilter;

      const searchText = normalize(
        [card.title, card.slug, card.summary, card.rarity, card.attribute].join(
          " "
        )
      );
      const matchesQuery = !q || searchText.includes(normalize(q));

      return matchesRarity && matchesAttribute && matchesQuery;
    }) ?? [];

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Character / Cards</div>
        <h1 className="page-title">{characterLabel} 카드</h1>
        <p className="page-desc">
          {characterLabel} 카드 목록을 캐릭터 기준으로 정리합니다.
        </p>
      </header>

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link href={`/characters/${characterKey}`} className="nav-link">
          캐릭터 허브로
        </Link>

        <Link href={`/characters/${characterKey}/phone`} className="nav-link">
          휴대폰 보기
        </Link>

        <Link href={`/characters/${characterKey}/stories`} className="nav-link">
          스토리 보기
        </Link>
      </div>

      <section className="form-panel" style={{ marginBottom: "24px" }}>
        <form method="get">
          <div className="form-grid">
            <label className="form-field">
              <span>등급</span>
              <select name="rarity" defaultValue={rarityFilter}>
                <option value="all">전체</option>
                {Object.entries(RARITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>속성</span>
              <select name="attribute" defaultValue={attributeFilter}>
                <option value="all">전체</option>
                {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field form-field-full">
              <span>검색</span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="카드명, slug, 요약 검색"
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <button type="submit" className="primary-button">
              필터 적용
            </button>

            <Link
              href={`/characters/${characterKey}/cards`}
              className="nav-link"
            >
              초기화
            </Link>
          </div>
        </form>
      </section>

      {filteredCards.length === 0 ? (
        <div className="empty-box">조건에 맞는 카드가 없습니다.</div>
      ) : (
        <>
          <div
            style={{
              marginBottom: "16px",
              color: "var(--text-sub)",
              fontSize: "14px",
            }}
          >
            총 {filteredCards.length}개
          </div>

          <ul className="list-grid">
            {filteredCards.map((card) => {
              const image = card.thumbnail_url || card.cover_image_url || "";

              return (
                <li key={card.id}>
                  <Link href={`/cards/${card.slug}`} className="archive-card-link">
                    <div className="archive-card">
                      {image ? (
                        <img
                          src={image}
                          alt={card.title}
                          style={{
                            width: "100%",
                            aspectRatio: "3 / 4",
                            objectFit: "cover",
                            borderRadius: "18px",
                            marginBottom: "16px",
                            border: "1px solid rgba(167, 194, 215, 0.25)",
                            background: "rgba(255,255,255,0.65)",
                          }}
                        />
                      ) : null}

                      <h2 className="archive-card-title" style={{ marginBottom: "12px" }}>
                        {card.title}
                      </h2>

                      <div className="meta-row" style={{ marginBottom: "14px" }}>
                        <span className="meta-pill">
                          rarity: {RARITY_LABELS[card.rarity ?? ""] ?? card.rarity ?? "-"}
                        </span>
                        <span className="meta-pill">
                          attribute:{" "}
                          {ATTRIBUTE_LABELS[card.attribute ?? ""] ??
                            card.attribute ??
                            "-"}
                        </span>
                        <span className="meta-pill">
                          year: {card.release_year ?? "-"}
                        </span>
                        {card.release_date ? (
                          <span className="meta-pill">date: {card.release_date}</span>
                        ) : null}
                      </div>

                      {card.summary ? (
                        <p
                          className="detail-text"
                          style={{
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical" as const,
                            overflow: "hidden",
                          }}
                        >
                          {card.summary}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}