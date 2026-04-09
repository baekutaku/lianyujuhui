import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateCard, deleteCard } from "@/app/admin/actions";

type EditCardPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ error?: string }>;
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function EditCardPage({
  params,
  searchParams,
}: EditCardPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error ?? "";

  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[admin/cards/[slug]/edit] card fetch error:", error);
  }

  if (!card) {
    notFound();
  }

  const { data: thumbAfterMedia } = await supabase
    .from("media_assets")
    .select("id, url")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("media_type", "image")
    .eq("usage_type", "thumbnail")
    .eq("title", "evolution_after")
    .maybeSingle();

  const { data: coverAfterMedia } = await supabase
    .from("media_assets")
    .select("id, url")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("media_type", "image")
    .eq("usage_type", "cover")
    .eq("title", "evolution_after")
    .maybeSingle();

  const { data: storyRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("child_type", "story")
    .eq("relation_type", "card_story")
    .order("sort_order", { ascending: true });

  const { data: phoneRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("child_type", "phone_item")
    .eq("relation_type", "card_phone")
    .order("sort_order", { ascending: true });

  const { data: eventRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("child_type", "event")
    .eq("relation_type", "card_event")
    .order("sort_order", { ascending: true });

  const storyIds = (storyRelations ?? []).map((item) => item.child_id);
  const phoneIds = (phoneRelations ?? []).map((item) => item.child_id);
  const eventIds = (eventRelations ?? []).map((item) => item.child_id);

  const { data: stories } =
    storyIds.length > 0
      ? await supabase.from("stories").select("id, slug").in("id", storyIds)
      : { data: [] as { id: string; slug: string }[] };

  const { data: phoneItems } =
    phoneIds.length > 0
      ? await supabase.from("phone_items").select("id, slug").in("id", phoneIds)
      : { data: [] as { id: string; slug: string }[] };

  const { data: events } =
    eventIds.length > 0
      ? await supabase.from("events").select("id, slug").in("id", eventIds)
      : { data: [] as { id: string; slug: string }[] };

  const storySlugMap = new Map((stories ?? []).map((item) => [item.id, item.slug]));
  const phoneSlugMap = new Map((phoneItems ?? []).map((item) => [item.id, item.slug]));
  const eventSlugMap = new Map((events ?? []).map((item) => [item.id, item.slug]));

  const linkedStorySlugs = (storyRelations ?? [])
    .map((item) => storySlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  const linkedPhoneItemSlugs = (phoneRelations ?? [])
    .map((item) => phoneSlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  const linkedEventSlugs = (eventRelations ?? [])
    .map((item) => eventSlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  const thumbnailAfterUrl = thumbAfterMedia?.url ?? "";
  const coverAfterUrl = coverAfterMedia?.url ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards / Edit</div>
        <h1 className="page-title">카드 수정</h1>
        <p className="page-desc">
          카드 기본 정보, 썸네일/대표 이미지, 연결 콘텐츠를 수정합니다.
        </p>
      </header>

      {errorMessage ? (
        <p
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#3a1f1f",
            color: "#ffb4b4",
            border: "1px solid #6b2d2d",
            whiteSpace: "pre-wrap",
          }}
        >
          {safeDecode(errorMessage)}
        </p>
      ) : null}

      <form action={updateCard} className="form-panel">
        <input type="hidden" name="cardId" value={card.id} />
        <input type="hidden" name="slug" value={card.slug} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" defaultValue={card.title} required />
          </label>

          <label className="form-field">
            <span>rarity</span>
            <select name="rarity" defaultValue={card.rarity}>
              <option value="nh">nh</option>
              <option value="n">n</option>
              <option value="r">r</option>
              <option value="sr">sr</option>
              <option value="er">er</option>
              <option value="ser">ser</option>
              <option value="ssr">ssr</option>
              <option value="sp">sp</option>
              <option value="ur">ur</option>
            </select>
          </label>

          <label className="form-field">
            <span>attribute</span>
            <select name="attribute" defaultValue={card.attribute}>
              <option value="drive">drive</option>
              <option value="affinity">affinity</option>
              <option value="judgment">judgment</option>
              <option value="creativity">creativity</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={card.release_year ?? ""}
              required
            />
          </label>

          <label className="form-field">
            <span>release_date</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={card.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>thumbnail url</span>
            <input
              name="thumbnailUrl"
              defaultValue={card.thumbnail_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>cover image url</span>
            <input
              name="coverImageUrl"
              defaultValue={card.cover_image_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>thumbnail after url (optional)</span>
            <input
              name="thumbnailAfterUrl"
              defaultValue={thumbnailAfterUrl}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>cover after url (optional)</span>
            <input
              name="coverAfterUrl"
              defaultValue={coverAfterUrl}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea
              name="summary"
              rows={5}
              defaultValue={card.summary ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>linked story slugs</span>
            <textarea
              name="linkedStorySlugs"
              rows={5}
              defaultValue={linkedStorySlugs}
              placeholder="한 줄에 slug 하나씩 입력"
            />
          </label>

          <label className="form-field form-field-full">
            <span>linked phone item slugs</span>
            <textarea
              name="linkedPhoneItemSlugs"
              rows={5}
              defaultValue={linkedPhoneItemSlugs}
              placeholder="한 줄에 slug 하나씩 입력"
            />
          </label>

          <label className="form-field form-field-full">
            <span>linked event slugs</span>
            <textarea
              name="linkedEventSlugs"
              rows={5}
              defaultValue={linkedEventSlugs}
              placeholder="한 줄에 slug 하나씩 입력"
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          카드 수정 저장
        </button>
      </form>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "18px",
        }}
      >
        <form action={deleteCard}>
          <input type="hidden" name="cardId" value={card.id} />
          <button
            type="submit"
            className="nav-link"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </form>
      </div>
    </main>
  );
}