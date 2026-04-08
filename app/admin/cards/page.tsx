import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default async function AdminCardsPage() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, title, slug, rarity, attribute, release_year")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">카드 관리</h1>
        <p className="page-desc">
          등록된 카드를 확인하고 수정 페이지로 이동할 수 있습니다.
        </p>
      </header>

      <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/admin/cards/new" className="primary-button">
          새 카드 등록
        </Link>

        <Link href="/cards" className="nav-link" style={{ display: "inline-flex", alignItems: "center" }}>
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
        <ul className="list-grid">
          {cards.map((card) => (
            <li key={card.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">{card.title}</h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">rarity: {card.rarity}</span>
                  <span className="meta-pill">attribute: {card.attribute}</span>
                  <span className="meta-pill">year: {card.release_year}</span>
                </div>

                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    color: "var(--text-soft)",
                    wordBreak: "break-all",
                  }}
                >
                  slug: {card.slug}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/cards/${card.slug}/edit`}
                    className="primary-button"
                    style={{ marginTop: 0 }}
                  >
                    수정하기
                  </Link>

                  <Link href={`/cards/${card.slug}`} className="nav-link">
                    공개 페이지 보기
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
