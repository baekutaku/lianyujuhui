import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { deleteCard } from "@/app/admin/actions";

export default async function AdminCardsPage() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, thumbnail_url, cover_image_url, is_published"
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
                      <span className="meta-pill">rarity: {card.rarity}</span>
                      <span className="meta-pill">attribute: {card.attribute}</span>
                      <span className="meta-pill">year: {card.release_year}</span>
                      <span className="meta-pill">
                        published: {card.is_published ? "true" : "false"}
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