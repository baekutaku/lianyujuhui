import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default async function CardsPage() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, title, slug, rarity, attribute, release_year")
    .eq("is_published", true)
    .order("release_year", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Cards</div>
        <h1 className="page-title">카드 아카이브</h1>
        <p className="page-desc">
          카드 메타 정보와 연결된 스토리로 이동할 수 있는 카드 목록입니다.
        </p>
      </header>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!cards || cards.length === 0 ? (
        <div className="empty-box">등록된 카드가 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {cards.map((card) => (
            <li key={card.id} className="archive-card">
              <h2 className="archive-card-title">{card.title}</h2>

              <div className="meta-row" style={{ marginBottom: "14px" }}>
                <span className="meta-pill">rarity: {card.rarity}</span>
                <span className="meta-pill">attribute: {card.attribute}</span>
                <span className="meta-pill">year: {card.release_year}</span>
              </div>

              <Link
                href={`/cards/${card.slug}`}
                className="primary-button"
                style={{ display: "inline-flex", marginTop: 0 }}
              >
                상세 보기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
