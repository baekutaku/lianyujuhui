import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import Link from "next/link";
import { deleteStoryBundle } from "@/app/admin/actions";
import ConfirmSubmitButton from "@/components/admin/common/ConfirmSubmitButton";
import StoryDetailHeightSync from "@/components/story/StoryDetailHeightSync";

type StoryPageProps = {
  params: Promise<{
    slug: string;
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

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug).trim();
  const admin = await isAdmin();

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (storyError) {
    console.error("[stories/[slug]] story fetch error:", storyError);
  }

  if (!story) {
    notFound();
  }

  if (!story.is_published && !admin) {
    notFound();
  }

  const { data: translations, error: translationError } = await supabase
    .from("translations")
    .select(
      "id, title, body, translation_type, is_primary, is_published, created_at"
    )
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (translationError) {
    console.error("[stories/[slug]] translations fetch error:", translationError);
  }

  const visibleTranslations = admin
    ? (translations ?? [])
    : (translations ?? []).filter((translation) => translation.is_published);

  const { data: media, error: mediaError } = await supabase
    .from("media_assets")
    .select(
      "id, media_type, usage_type, url, youtube_video_id, title, is_primary, sort_order"
    )
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error("[stories/[slug]] media fetch error:", mediaError);
  }

  const primaryMedia = media?.[0] ?? null;

  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type")
    .eq("child_type", "story")
    .eq("child_id", story.id);

  if (relationsError) {
    console.error("[stories/[slug]] relations fetch error:", relationsError);
  }

  let relatedCards: { id: string; title: string; slug: string }[] = [];

  if (relations && relations.length > 0) {
    const cardRelationIds = relations
      .filter((rel) => rel.parent_type === "card")
      .map((rel) => rel.parent_id);

    if (cardRelationIds.length > 0) {
      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("id, title, slug")
        .in("id", cardRelationIds);

      if (cardsError) {
        console.error("[stories/[slug]] related cards fetch error:", cardsError);
      }

      relatedCards = cards ?? [];
    }
  }

  return (
    <main>
      <section className="detail-panel story-topbar">
        <div className="story-topbar-main">
  <p className="page-eyebrow">Archive / Stories</p>
  <h1 className="story-page-title">{story.title}</h1>

  <div className="meta-row story-top-meta">
    <span className="meta-pill">type: {story.subtype}</span>
    <span className="meta-pill">year: {story.release_year}</span>
    {!story.is_published && admin ? (
      <span className="meta-pill">draft</span>
    ) : null}
  </div>

  <div className="story-top-actions">
    <Link
      href="/stories"
      className="story-action-button story-action-muted"
    >
      목록으로
    </Link>

    {admin ? (
      <>
        <Link
          href={`/admin/stories/${encodeURIComponent(story.slug)}/edit`}
          className="story-action-button"
        >
          관리자 수정
        </Link>

        <Link
          href="/admin/stories/new"
          className="story-action-button story-action-muted"
        >
          새 스토리 등록
        </Link>

        <form action={deleteStoryBundle} style={{ display: "inline-flex" }}>
          <input type="hidden" name="storyId" value={story.id} />
          <ConfirmSubmitButton
            label="삭제"
            confirmMessage={`정말 삭제할까요?\n\n${story.title}`}
            className="story-action-button story-action-muted"
            style={{
              border: "none",
              cursor: "pointer",
              color: "#d35f7a",
            }}
          />
        </form>
      </>
    ) : null}
  </div>
</div>
        <aside className="story-topbar-side">
          <div className="story-side-block">
            <h3 className="story-side-title">연결 카드</h3>
            <div className="story-side-links">
              {relatedCards.length > 0 ? (
                relatedCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.slug}`}
                    className="meta-pill"
                  >
                    {card.title}
                  </Link>
                ))
              ) : (
                <span className="detail-text">없음</span>
              )}
            </div>
          </div>

          <div className="story-side-block">
            <h3 className="story-side-title">휴대폰</h3>
            <div className="story-side-links">
              <span className="detail-text">문자 / 전화 / 모먼트 연결 예정</span>
            </div>
          </div>

          <div className="story-side-block">
            <h3 className="story-side-title">기타 연결</h3>
            <div className="story-side-links">
              <span className="detail-text">외전 / ASMR / 이벤트 연결 예정</span>
            </div>
          </div>
        </aside>
      </section>
<StoryDetailHeightSync />
      <section className="story-main-grid">
        <div className="detail-panel story-media-panel">
          <div className="story-media-box">
            {primaryMedia ? (
              primaryMedia.media_type === "youtube" &&
              primaryMedia.youtube_video_id ? (
                <div className="media-embed-wrap">
                  <iframe
                    src={`https://www.youtube.com/embed/${primaryMedia.youtube_video_id}`}
                    title={primaryMedia.title || story.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : primaryMedia.media_type === "image" ? (
                <img
                  src={primaryMedia.url}
                  alt={primaryMedia.title || story.title}
                  className="story-detail-image"
                />
              ) : (
                <div className="empty-box">
                  지원되지 않는 미디어 형식입니다.
                </div>
              )
            ) : (
              <div className="empty-box">등록된 영상/이미지가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="detail-panel story-translation-panel">
          <h2 className="detail-section-title">번역</h2>

          {translationError && (
            <pre className="error-box">
              {JSON.stringify(translationError, null, 2)}
            </pre>
          )}

          {!visibleTranslations || visibleTranslations.length === 0 ? (
            <div className="empty-box">등록된 번역이 없습니다.</div>
          ) : (
            <div className="translation-scroll-panel">
              <div style={{ display: "grid", gap: "20px" }}>
                {visibleTranslations.map((translation) => (
                  <section key={translation.id}>
                    {translation.title ? (
                      <h3 className="story-translation-title">
                        {translation.title}
                      </h3>
                    ) : null}

                    {looksLikeHtml(translation.body || "") ? (
                      <div
                        className="translation-body rich-content"
                        dangerouslySetInnerHTML={{
                          __html: translation.body || "",
                        }}
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