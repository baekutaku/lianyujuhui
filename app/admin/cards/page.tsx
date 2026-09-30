import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { deleteCard } from "@/app/admin/actions";

const rarityLabelMap: Record<string, string> = {
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

const attributeLabelMap: Record<string, string> = {
  execution: "추진력",
  drive: "추진력",
  affinity: "친화력",
  decision: "결단력",
  judgment: "결단력",
  creativity: "창의력",
};

const categoryLabelMap: Record<string, string> = {
  date: "데이트 카드",
  main_story: "메인스토리 연계",
  side_story: "외전 / 서브",
  birthday: "생일 카드",
  charge: "누적충전 카드",
  free: "무료 카드",
};


function getRarityLabel(value: string | null) {
  if (!value) return "미분류";
  return rarityLabelMap[value] ?? value.toUpperCase();
}

function getAttributeLabel(value: string | null) {
  if (!value) return "미분류";
  return attributeLabelMap[value] ?? value;
}

function getCategoryLabel(value: string | null) {
  if (!value) return "미분류";
  return categoryLabelMap[value] ?? "미분류";
}

export default async function AdminCardsPage() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, thumbnail_url, cover_image_url, is_published, card_category"
    )
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">카드 관리</h1>
        <p className="page-desc">
          등록된 카드를 확인하고 수정/삭제할 수 있습니다.
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
        <Link href="/admin/cards/new" className="primary-button">
          새 카드 등록
        </Link>

        <Link
          href="/cards"
          className="nav-link"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          공개 카드 목록 보기
        </Link>
      </div>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!cards || cards.length === 0 ? (
        <div className="empty-box">등록된 카드가 없습니다.</div>
      ) : (
        <ul className="story-thumb-grid">
          {cards.map((card) => {
            const imageUrl = card.thumbnail_url || card.cover_image_url || "";

            return (
              <li key={card.id} className="story-thumb-card">
                <div className="story-thumb-link">
                  <div
                    className="story-thumb-media"
                    style={{ aspectRatio: "9 / 16" }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={card.title}
                        className="story-thumb-image"
                      />
                    ) : (
                      <div className="story-thumb-empty">NO IMAGE</div>
                    )}
                  </div>

                  <div className="story-thumb-body">
                    <h2 className="story-thumb-title">{card.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "12px" }}>
                      <span className="meta-pill">등급: {getRarityLabel(card.rarity)}</span>
                      <span className="meta-pill">속성: {getAttributeLabel(card.attribute)}</span>
                      <span className="meta-pill">분류: {getCategoryLabel(card.card_category)}</span>
                      <span className="meta-pill">연도: {card.release_year}</span>
                      <span className="meta-pill">
                        공개: {card.is_published ? "예" : "아니오"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "8px",
                      }}
                    >
                      <Link
                        href={`/admin/cards/${card.slug}/edit`}
                        className="mini-button"
                      >
                        수정
                      </Link>

                      <Link
                        href={`/cards/${card.slug}`}
                        className="mini-button"
                      >
                        공개 보기
                      </Link>

                      <form action={deleteCard}>
                        <input type="hidden" name="cardId" value={card.id} />
                        <input type="hidden" name="slug" value={card.slug} />
                        <button
                          type="submit"
                          className="mini-button"
                          style={{
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          삭제
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}