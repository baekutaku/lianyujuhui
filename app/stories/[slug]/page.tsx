import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { deleteStoryBundle } from "@/app/admin/actions";
import ConfirmSubmitButton from "@/components/admin/common/ConfirmSubmitButton";
import StoryDetailHeightSync from "@/components/story/StoryDetailHeightSync";
import { unlockProtectedStory } from "@/app/stories/[slug]/actions";
import { hasStoryAccess } from "@/lib/utils/story-access";
import StoryTranslationSwitcher from "@/components/story/StoryTranslationSwitcher";
import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";

type StoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    passwordError?: string;
  }>;
};

type RelatedCard = {
  id: string;
  title: string;
  slug: string;
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
function normalizeStoryHtml(html = "") {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

function ProtectedStoryGate({
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
        <div className="page-eyebrow">Protected Story</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">이 스토리는 비밀번호가 있어야 열람할 수 있습니다.</p>
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

          <form action={unlockProtectedStory} style={{ display: "grid", gap: 12 }}>
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

          <Link href="/stories" className="nav-link">
            목록으로
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function StoryDetailPage({
  params,
  searchParams,
}: StoryPageProps) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug).trim();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const admin = await isAdmin();

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select(
      "id, title, slug, subtype, release_year, is_published, visibility, access_password_hash, access_hint"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (storyError) {
    console.error("[stories/[slug]] story fetch error:", storyError);
  }

  if (!story) {
    notFound();
  }

   if (story.visibility === "private" && !admin) {
    notFound();
  }

  if (story.visibility === "protected" && !admin) {
    const allowed = await hasStoryAccess(story.id, story.access_password_hash);

    if (!allowed) {
      return (
        <ProtectedStoryGate
          slug={story.slug}
          title={story.title}
          hint={story.access_hint}
          showError={resolvedSearchParams.passwordError === "1"}
        />
      );
    }
  }

  const { data: translations, error: translationError } = await supabase
    .from("translations")
    .select(
  "id, title, body, language_code, translation_type, is_primary, is_published, created_at"
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



  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type")
    .eq("child_type", "story")
    .eq("child_id", story.id);

  if (relationsError) {
    console.error("[stories/[slug]] relations fetch error:", relationsError);
  }

  let relatedCards: RelatedCard[] = [];

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

  const hasConnections = relatedCards.length > 0;

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
                    className="story-action-button story-action-danger"
                  />
                </form>
              </>
            ) : null}
          </div>
        </div>

        {hasConnections ? (
          <aside className="story-topbar-side">
            <section className="story-side-block">
              <h2 className="story-side-title">연결 카드</h2>

              <div className="story-side-links">
                {relatedCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.slug}`}
                    className="story-side-chip"
                  >
                    {card.title}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        ) : null}
      </section>

      <StoryDetailHeightSync />

      <section className="story-main-grid">
        <div className="detail-panel story-media-panel">
  <StoryMediaSwitcher storyTitle={story.title} media={media ?? []} />
</div>

        <div className="detail-panel story-translation-panel">
  {translationError ? (
    <pre className="error-box">
      {JSON.stringify(translationError, null, 2)}
    </pre>
  ) : null}

  {!visibleTranslations || visibleTranslations.length === 0 ? (
    <div className="empty-box">등록된 번역이 없습니다.</div>
  ) : (
    <StoryTranslationSwitcher translations={visibleTranslations} />
  )}
</div>
      </section>

      {hasConnections ? (
        <section className="detail-panel related-section">
          <h2 className="detail-section-title" style={{ display: "block" }}>
            관련 카드
          </h2>

          <div className="related-grid">
            {relatedCards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.slug}`}
                className="related-card"
              >
                <p className="related-card-title">{card.title}</p>
                <span className="mini-button">카드 보기</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}