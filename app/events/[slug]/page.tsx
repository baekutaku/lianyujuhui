import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { unlockProtectedEvent } from "@/app/events/[slug]/actions";
import { hasEventAccess } from "@/lib/utils/event-access";
import { deleteEventBundle } from "@/app/admin/actions";
import { getPhoneItemHref } from "@/lib/utils/getPhoneItemHref";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    passwordError?: string;
  }>;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function ProtectedEventGate({
  slug,
  title,
  hint,
  showError,
}: {
  slug: string;
  title: string;
  hint?: string | null;
  showError?: boolean;
}) {
  return (
    <main>
      <section className="page-header">
        <div className="page-eyebrow">Protected Event</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">이 이벤트는 비밀번호가 있어야 열람할 수 있습니다.</p>
      </section>

      <section className="detail-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {showError ? (
            <div className="error-box">비밀번호가 올바르지 않습니다.</div>
          ) : null}

          {hint ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                background: "rgba(248, 245, 251, 0.96)",
                border: "1px solid rgba(222, 213, 228, 0.72)",
                color: "var(--text-sub)",
              }}
            >
              힌트: {hint}
            </div>
          ) : null}

          <form action={unlockProtectedEvent} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="slug" value={slug} />

            <input
              type="password"
              name="password"
              placeholder="비밀번호 입력"
              autoComplete="off"
              className="story-toolbar-search"
            />

            <button type="submit" className="primary-button">
              열람하기
            </button>
          </form>

          <Link href="/stories?tab=event" className="nav-link">
            목록으로
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: EventPageProps) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug).trim();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const admin = await isAdmin();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title, slug, subtype, release_year, start_date, end_date, summary, is_published, visibility, access_password_hash, access_hint"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (eventError) {
    console.error("[events/[slug]] event fetch error:", eventError);
  }

  if (!event) {
    notFound();
  }

  if (!event.is_published && !admin) {
    notFound();
  }

  if (event.visibility === "private" && !admin) {
    notFound();
  }

  if (event.visibility === "protected" && !admin) {
    const allowed = await hasEventAccess(event.id, event.access_password_hash);

    if (!allowed) {
      return (
        <ProtectedEventGate
          slug={event.slug}
          title={event.title}
          hint={event.access_hint}
          showError={resolvedSearchParams.passwordError === "1"}
        />
      );
    }
  }

  const { data: translations, error: translationError } = await supabase
    .from("translations")
    .select("id, title, body, translation_type, is_primary, is_published, created_at")
    .eq("parent_type", "event")
    .eq("parent_id", event.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const visibleTranslations = admin
    ? (translations ?? [])
    : (translations ?? []).filter((translation) => translation.is_published);

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, media_type, usage_type, url, youtube_video_id, title, is_primary, sort_order")
    .eq("parent_type", "event")
    .eq("parent_id", event.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const primaryMedia = media?.[0] ?? null;

  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type")
    .eq("child_type", "event")
    .eq("child_id", event.id);

  if (relationsError) {
    console.error("[events/[slug]] relations fetch error:", relationsError);
  }

  let relatedCards: { id: string; title: string; slug: string }[] = [];
  let relatedStories: { id: string; title: string; slug: string; subtype?: string | null }[] = [];
  let relatedPhoneItems: {
    id: string;
    title: string;
    slug: string;
    subtype?: string | null;
    content_json?: any;
  }[] = [];
  let relatedEvents: { id: string; title: string; slug: string }[] = [];

  if (relations && relations.length > 0) {
    const cardIds = relations
      .filter((rel) => rel.parent_type === "card")
      .map((rel) => rel.parent_id);

    const storyIds = relations
      .filter((rel) => rel.parent_type === "story")
      .map((rel) => rel.parent_id);

    const phoneIds = relations
      .filter((rel) => rel.parent_type === "phone_item")
      .map((rel) => rel.parent_id);

    const eventIds = relations
      .filter((rel) => rel.parent_type === "event")
      .map((rel) => rel.parent_id);

    if (cardIds.length > 0) {
      const { data: cards } = await supabase
        .from("cards")
        .select("id, title, slug")
        .in("id", cardIds);

      relatedCards = cards ?? [];
    }

    if (storyIds.length > 0) {
      const { data: stories } = await supabase
        .from("stories")
        .select("id, title, slug, subtype")
        .in("id", storyIds);

      relatedStories = stories ?? [];
    }

    if (phoneIds.length > 0) {
      const { data: phoneItems } = await supabase
        .from("phone_items")
        .select("id, title, slug, subtype, content_json")
        .in("id", phoneIds);

      relatedPhoneItems = phoneItems ?? [];
    }

    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, title, slug")
        .in("id", eventIds);

      relatedEvents = events ?? [];
    }
  }

  const hasConnections =
    relatedCards.length > 0 ||
    relatedStories.length > 0 ||
    relatedPhoneItems.length > 0 ||
    relatedEvents.length > 0;

  return (
    <main>
      <section className="story-topbar-layout">
        <section className="detail-panel story-topbar-main-panel">
          <div className="story-topbar-main">
            <p className="page-eyebrow">Archive / Events</p>
            <h1 className="story-page-title">{event.title}</h1>

            <div className="meta-row story-top-meta">
              <span className="meta-pill">type: {event.subtype}</span>
              <span className="meta-pill">year: {event.release_year}</span>
              {event.start_date ? <span className="meta-pill">start: {event.start_date}</span> : null}
              {event.end_date ? <span className="meta-pill">end: {event.end_date}</span> : null}
              {event.visibility === "protected" ? (
                <span className="meta-pill">비밀번호 필요</span>
              ) : null}
              {event.visibility === "private" && admin ? (
                <span className="meta-pill">비공개</span>
              ) : null}
            </div>

            <div className="story-top-actions">
              <Link
                href="/stories?tab=event"
                className="story-action-button story-action-muted"
              >
                목록으로
              </Link>

              {admin ? (
                <>
                  <Link
                    href="/admin/events/new"
                    className="story-action-button story-action-muted"
                  >
                    새 이벤트 등록
                  </Link>

                  <Link
                    href={`/admin/events/${event.slug}/edit`}
                    className="story-action-button"
                  >
                    관리자 수정
                  </Link>

                  <form action={deleteEventBundle}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      className="story-action-button story-action-danger"
                    >
                      삭제
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {hasConnections ? (
          <aside className="story-topbar-side">
            {relatedCards.length > 0 ? (
              <details className="story-side-block story-side-disclosure">
                <summary className="story-side-summary">
                  <div className="story-side-title-row">
                    <h2 className="story-side-title">연결된 카드</h2>
                    <span className="story-side-count">{relatedCards.length}</span>
                  </div>
                  <span className="story-side-toggle" aria-hidden="true">
                    ▾
                  </span>
                </summary>

                <div className="story-side-content">
                  <div className="story-side-links">
                    {relatedCards.map((card) => (
                      <Link
                        key={card.id}
                        href={`/cards/${card.slug}`}
                        className="story-side-chip"
                        title={card.title}
                      >
                        {card.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}

            {relatedStories.length > 0 ? (
              <details className="story-side-block story-side-disclosure">
                <summary className="story-side-summary">
                  <div className="story-side-title-row">
                    <h2 className="story-side-title">관련 스토리</h2>
                    <span className="story-side-count">{relatedStories.length}</span>
                  </div>
                  <span className="story-side-toggle" aria-hidden="true">
                    ▾
                  </span>
                </summary>

                <div className="story-side-content">
                  <div className="story-side-links">
                    {relatedStories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/stories/${story.slug}`}
                        className="story-side-chip"
                        title={story.title}
                      >
                        {story.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}

            {relatedPhoneItems.length > 0 ? (
              <details className="story-side-block story-side-disclosure">
                <summary className="story-side-summary">
                  <div className="story-side-title-row">
                    <h2 className="story-side-title">연결 휴대폰</h2>
                    <span className="story-side-count">{relatedPhoneItems.length}</span>
                  </div>
                  <span className="story-side-toggle" aria-hidden="true">
                    ▾
                  </span>
                </summary>

                <div className="story-side-content">
                  <div className="story-side-links">
                    {relatedPhoneItems.map((item) => (
                      <Link
                        key={item.id}
                        href={getPhoneItemHref(item)}
                        className="story-side-chip"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}

            {relatedEvents.length > 0 ? (
              <details className="story-side-block story-side-disclosure">
                <summary className="story-side-summary">
                  <div className="story-side-title-row">
                    <h2 className="story-side-title">관련 이벤트</h2>
                    <span className="story-side-count">{relatedEvents.length}</span>
                  </div>
                  <span className="story-side-toggle" aria-hidden="true">
                    ▾
                  </span>
                </summary>

                <div className="story-side-content">
                  <div className="story-side-links">
                    {relatedEvents.map((relatedEvent) => (
                      <Link
                        key={relatedEvent.id}
                        href={`/events/${relatedEvent.slug}`}
                        className="story-side-chip"
                        title={relatedEvent.title}
                      >
                        {relatedEvent.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}
          </aside>
        ) : null}
      </section>

      <section className="story-main-grid">
        <div className="detail-panel story-media-panel">
          <div className="story-media-box">
            {primaryMedia ? (
              primaryMedia.media_type === "youtube" && primaryMedia.youtube_video_id ? (
                <div className="media-embed-wrap">
                  <iframe
                    src={`https://www.youtube.com/embed/${primaryMedia.youtube_video_id}`}
                    title={primaryMedia.title || event.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : primaryMedia.media_type === "image" ? (
                <img
                  src={primaryMedia.url}
                  alt={primaryMedia.title || event.title}
                  className="story-detail-image"
                />
              ) : (
                <div className="empty-box">지원되지 않는 미디어 형식입니다.</div>
              )
            ) : (
              <div className="empty-box">등록된 영상/이미지가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="detail-panel story-translation-panel">
          <h2 className="detail-section-title">번역</h2>

          {translationError ? (
            <pre className="error-box">
              {JSON.stringify(translationError, null, 2)}
            </pre>
          ) : null}

          {!visibleTranslations || visibleTranslations.length === 0 ? (
            <div className="empty-box">등록된 번역이 없습니다.</div>
          ) : (
            <div className="translation-scroll-panel">
              <div style={{ display: "grid", gap: "20px" }}>
                {visibleTranslations.map((translation) => (
                  <section key={translation.id}>
                    {translation.title ? (
                      <h3 className="story-translation-title">{translation.title}</h3>
                    ) : null}

                    {looksLikeHtml(translation.body || "") ? (
                      <div
                        className="translation-body rich-content"
                        dangerouslySetInnerHTML={{ __html: translation.body || "" }}
                      />
                    ) : (
                      <div
                        className="translation-body rich-content"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {translation.body || ""}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}