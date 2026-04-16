import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { deleteCard } from "@/app/admin/actions";
import CardDetailMediaSwitcher from "@/components/cards/CardDetailMediaSwitcher";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RARITY_LABEL_MAP: Record<string, string> = {
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

const ATTRIBUTE_LABEL_MAP: Record<string, string> = {
  execution: "추진력",
  drive: "추진력",
  affinity: "친화력",
  decision: "결단력",
  judgment: "결단력",
  creativity: "창의력",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  date: "데이트 카드",
  main_story: "메인스토리 연계",
  side_story: "외전 / 서브",
  birthday: "생일 카드",
  charge: "누적충전 카드",
  free: "무료 카드",
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRarityLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return RARITY_LABEL_MAP[value] ?? String(value).toUpperCase();
}

function getAttributeLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return ATTRIBUTE_LABEL_MAP[value] ?? value;
}

function getCategoryLabel(value: string | null | undefined) {
  if (!value) return "미분류";
  return CATEGORY_LABEL_MAP[value] ?? "미분류";
}

// 네 실제 공개 라우트가 다르면 여기만 바꾸면 됨
function getStoryHref(slug: string) {
  return `/stories/${slug}`;
}

function getPhoneHref(slug: string) {
  return `/phone-items/${slug}`;
}

function getEventHref(slug: string) {
  return `/events/${slug}`;
}

export default async function CardDetailPage({ params }: PageProps) {
  const admin = await isAdmin();
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);

  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary, card_category, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[cards/[slug]] card fetch error:", error);
  }

  if (!card) {
    notFound();
  }

  const { data: mediaRows } = await supabase
    .from("media_assets")
    .select("id, usage_type, title, url")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("media_type", "image");

  const beforeThumb =
    card.thumbnail_url ||
    mediaRows?.find(
      (item) => item.usage_type === "thumbnail" && item.title !== "evolution_after"
    )?.url ||
    null;

  const afterThumb =
    mediaRows?.find(
      (item) => item.usage_type === "thumbnail" && item.title === "evolution_after"
    )?.url || null;

  const beforeCover =
    card.cover_image_url ||
    mediaRows?.find(
      (item) => item.usage_type === "cover" && item.title !== "evolution_after"
    )?.url ||
    null;

  const afterCover =
    mediaRows?.find(
      (item) => item.usage_type === "cover" && item.title === "evolution_after"
    )?.url || null;

  const { data: tagRows } = await supabase
    .from("item_tags")
    .select("tag_id, sort_order")
    .eq("item_type", "card")
    .eq("item_id", card.id)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((tagRows ?? []).map((row) => row.tag_id)));
  let tags: string[] = [];

  if (tagIds.length > 0) {
    const { data: fullTags } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagMap = new Map(
      (fullTags ?? []).map((row) => [row.id, row.label ?? row.name ?? row.slug])
    );

    tags = (tagRows ?? [])
      .map((row) => tagMap.get(row.tag_id))
      .filter(Boolean) as string[];
  }

  const { data: relations } = await supabase
    .from("item_relations")
    .select("parent_type, parent_id, child_type, child_id, relation_type")
    .eq("parent_type", "card")
    .eq("parent_id", card.id);

  const storyIds = (relations ?? [])
    .filter((rel) => rel.child_type === "story")
    .map((rel) => rel.child_id);

  const phoneIds = (relations ?? [])
    .filter((rel) => rel.child_type === "phone_item")
    .map((rel) => rel.child_id);

  const eventIds = (relations ?? [])
    .filter((rel) => rel.child_type === "event")
    .map((rel) => rel.child_id);

  const [{ data: stories }, { data: phoneItems }, { data: events }] = await Promise.all([
    storyIds.length > 0
      ? supabase.from("stories").select("id, title, slug, subtype").in("id", storyIds)
      : Promise.resolve({ data: [] as any[] }),
    phoneIds.length > 0
      ? supabase.from("phone_items").select("id, title, slug, subtype").in("id", phoneIds)
      : Promise.resolve({ data: [] as any[] }),
    eventIds.length > 0
      ? supabase.from("events").select("id, title, slug, subtype").in("id", eventIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return (
    <main>
      <section className="detail-panel story-topbar">
        <div className="story-topbar-main">
          <p className="page-eyebrow">Archive / Cards</p>
          <h1 className="story-page-title">{card.title}</h1>

          <div className="meta-row story-top-meta">
            <span className="meta-pill">등급: {getRarityLabel(card.rarity)}</span>
            <span className="meta-pill">속성: {getAttributeLabel(card.attribute)}</span>
            <span className="meta-pill">분류: {getCategoryLabel(card.card_category)}</span>
            {card.release_year ? (
              <span className="meta-pill">연도: {card.release_year}</span>
            ) : null}
            {!card.is_published && admin ? (
              <span className="meta-pill">비공개 초안</span>
            ) : null}
          </div>

          <div className="story-top-actions">
            <Link href="/cards" className="story-action-button story-action-muted">
              목록으로
            </Link>

            {admin ? (
              <>
                <Link
                  href={`/admin/cards/${encodeURIComponent(card.slug)}/edit`}
                  className="story-action-button"
                >
                  관리자 수정
                </Link>

                <Link
                  href="/admin/cards/new"
                  className="story-action-button story-action-muted"
                >
                  새 카드 등록
                </Link>

                <form action={deleteCard} style={{ display: "inline-flex" }}>
                  <input type="hidden" name="cardId" value={card.id} />
                  <input type="hidden" name="slug" value={card.slug} />
                  <button
                    type="submit"
                    className="story-action-button story-action-danger"
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="story-main-grid card-detail-main-grid">
        <div className="detail-panel card-detail-media-panel">
          <CardDetailMediaSwitcher
            media={{
              title: card.title,
              beforeThumb,
              afterThumb,
              beforeCover,
              afterCover,
            }}
          />
        </div>

        <aside className="detail-panel card-detail-info-panel">
          {tags.length > 0 ? (
            <section className="card-detail-side-block">
              <h2 className="detail-section-title">해시태그</h2>
              <div className="card-detail-tags">
                {tags.map((tag) => (
                  <span key={tag} className="story-card-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card-detail-side-block">
            <h2 className="detail-section-title">카드 설명</h2>
            {card.summary ? (
              <div className="rich-content detail-text">
                <p>{card.summary}</p>
              </div>
            ) : (
              <div className="empty-box">등록된 카드 설명이 없습니다.</div>
            )}
          </section>

          <section className="card-detail-side-block">
            <h2 className="detail-section-title">연결 스토리</h2>
            <div className="story-side-links">
              {(stories?.length ?? 0) > 0 ? (
                stories!.map((story: any) => (
                  <Link key={story.id} href={getStoryHref(story.slug)} className="story-side-chip">
                    {story.title}
                  </Link>
                ))
              ) : (
                <span className="detail-text">연결된 스토리가 없습니다.</span>
              )}
            </div>
          </section>

          <section className="card-detail-side-block">
            <h2 className="detail-section-title">연결 휴대폰</h2>
            <div className="story-side-links">
              {(phoneItems?.length ?? 0) > 0 ? (
                phoneItems!.map((item: any) => (
                  <Link key={item.id} href={getPhoneHref(item.slug)} className="story-side-chip">
                    {item.title}
                  </Link>
                ))
              ) : (
                <span className="detail-text">연결된 휴대폰 콘텐츠가 없습니다.</span>
              )}
            </div>
          </section>

          <section className="card-detail-side-block">
            <h2 className="detail-section-title">관련 이벤트</h2>
            <div className="story-side-links">
              {(events?.length ?? 0) > 0 ? (
                events!.map((event: any) => (
                  <Link key={event.id} href={getEventHref(event.slug)} className="story-side-chip">
                    {event.title}
                  </Link>
                ))
              ) : (
                <span className="detail-text">관련 이벤트가 없습니다.</span>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}