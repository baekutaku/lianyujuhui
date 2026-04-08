import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/utils/admin-auth";
import CardImageSwitcher from "@/components/cards/CardImageSwitcher";

type CardDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}


export default async function CardDetailPage({
  params,
}: CardDetailPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const admin = await isAdmin();
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (cardError) {
    console.error("[cards/[slug]] card fetch error:", cardError);
  }

if (!card) {
  return (
    <main>
      <pre className="error-box">
        {JSON.stringify({ reason: "card not found", slug }, null, 2)}
      </pre>
    </main>
  );
}

if (!card.is_published && !admin) {
  return (
    <main>
      <pre className="error-box">
        {JSON.stringify(
          { reason: "card is not published", slug, is_published: card.is_published },
          null,
          2
        )}
      </pre>
    </main>
  );
}

  const { data: coverAfterMedia } = await supabase
    .from("media_assets")
    .select("id, url")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("media_type", "image")
    .eq("usage_type", "cover")
    .eq("title", "evolution_after")
    .maybeSingle();

  const imageUrl = card.cover_image_url || card.thumbnail_url || "";
  const coverAfterUrl = coverAfterMedia?.url || "";

  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type")
    .eq("parent_type", "card")
    .eq("parent_id", card.id);

  if (relationsError) {
    console.error("[cards/[slug]] relations fetch error:", relationsError);
  }

  const storyIds =
    relations
      ?.filter((rel) => rel.child_type === "story")
      .map((rel) => rel.child_id) ?? [];

  const phoneIds =
    relations
      ?.filter((rel) => rel.child_type === "phone_item")
      .map((rel) => rel.child_id) ?? [];

  const eventIds =
    relations
      ?.filter((rel) => rel.child_type === "event")
      .map((rel) => rel.child_id) ?? [];

  const { data: stories } =
    storyIds.length > 0
      ? await supabase
          .from("stories")
          .select("id, title, slug, subtype, release_year")
          .in("id", storyIds)
      : { data: [] as any[] };

  const { data: phoneItems } =
    phoneIds.length > 0
      ? await supabase
          .from("phone_items")
          .select("id, title, slug, subtype, release_year")
          .in("id", phoneIds)
      : { data: [] as any[] };

  const { data: events } =
    eventIds.length > 0
      ? await supabase
          .from("events")
          .select("id, title, slug, subtype, release_year")
          .in("id", eventIds)
      : { data: [] as any[] };

  return (
    <main>
      <section className="detail-panel story-topbar">
        <div className="story-topbar-main">
          <p className="page-eyebrow">Archive / Cards</p>
          <h1 className="story-page-title">{card.title}</h1>

          <div className="meta-row story-top-meta">
            <span className="meta-pill">rarity: {card.rarity}</span>
            <span className="meta-pill">attribute: {card.attribute}</span>
            <span className="meta-pill">year: {card.release_year}</span>
            {card.release_date ? (
              <span className="meta-pill">date: {card.release_date}</span>
            ) : null}
            {!card.is_published && admin ? (
              <span className="meta-pill">draft</span>
            ) : null}
          </div>

          <div className="story-top-actions">
            <Link href="/cards" className="story-action-button story-action-muted">
              목록으로
            </Link>

            {admin && (
              <Link
                href={`/admin/cards/${card.slug}/edit`}
                className="story-action-button"
              >
                관리자 수정
              </Link>
            )}
          </div>
        </div>

        <aside className="story-topbar-side">
          <div className="story-side-block">
            <h3 className="story-side-title">요약</h3>
            <div className="story-side-links">
              <span className="detail-text">{card.summary || "없음"}</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="story-main-grid">
        <div className="detail-panel story-media-panel">
          <div className="story-media-box">
            {imageUrl ? (
              <CardImageSwitcher
                title={card.title}
                beforeImageUrl={imageUrl}
                afterImageUrl={coverAfterUrl}
              />
            ) : (
              <div className="empty-box">등록된 카드 이미지가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="detail-panel story-translation-panel">
          <h2 className="detail-section-title">연결 스토리</h2>

          {!stories || stories.length === 0 ? (
            <div className="empty-box" style={{ marginBottom: "20px" }}>
              연결된 스토리가 없습니다.
            </div>
          ) : (
            <ul className="link-list" style={{ marginBottom: "24px" }}>
              {stories.map((story) => (
                <li key={story.id} className="link-card">
                  <Link href={`/stories/${story.slug}`}>
                    <strong>{story.title}</strong>
                    <div className="meta-row" style={{ marginTop: "8px" }}>
                      <span className="meta-pill">type: {story.subtype}</span>
                      <span className="meta-pill">year: {story.release_year}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="detail-section-title">연결 휴대폰</h2>

          {!phoneItems || phoneItems.length === 0 ? (
            <div className="empty-box" style={{ marginBottom: "20px" }}>
              연결된 휴대폰 콘텐츠가 없습니다.
            </div>
          ) : (
            <ul className="link-list" style={{ marginBottom: "24px" }}>
              {phoneItems.map((item) => (
                <li key={item.id} className="link-card">
                  <Link href={`/phone-items/${item.slug}`}>
                    <strong>{item.title}</strong>
                    <div className="meta-row" style={{ marginTop: "8px" }}>
                      <span className="meta-pill">type: {item.subtype}</span>
                      <span className="meta-pill">year: {item.release_year}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="detail-section-title">관련 이벤트</h2>

          {!events || events.length === 0 ? (
            <div className="empty-box">관련 이벤트가 없습니다.</div>
          ) : (
            <ul className="link-list">
              {events.map((event) => (
                <li key={event.id} className="link-card">
                  <Link href={`/events/${event.slug}`}>
                    <strong>{event.title}</strong>
                    <div className="meta-row" style={{ marginTop: "8px" }}>
                      <span className="meta-pill">type: {event.subtype}</span>
                      <span className="meta-pill">year: {event.release_year}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}