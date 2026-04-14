import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

function getAttributeClass(attribute?: string | null) {
  const value = String(attribute || "").trim().toLowerCase();

  switch (value) {
    case "결단력":
    case "decisiveness":
    case "judgment":
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
      return "stat-drive";

    default:
      return "";
  }
}

export default async function CardsPage() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, thumbnail_url, cover_image_url"
    )
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("created_at", { ascending: false });

  const cardIds = (cards ?? []).map((card) => card.id);
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

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Cards</div>
        <h1 className="page-title">카드 아카이브</h1>
        <p className="page-desc">카드와 연결된 컨텐츠 아카이브</p>
      </header>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!cards || cards.length === 0 ? (
        <div className="empty-box">등록된 카드가 없습니다.</div>
      ) : (
        <ul className="card-thumb-grid">
          {cards.map((card) => {
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