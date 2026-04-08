import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateCard } from "@/app/admin/actions";

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

  const thumbnailAfterUrl = thumbAfterMedia?.url ?? "";
  const coverAfterUrl = coverAfterMedia?.url ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards / Edit</div>
        <h1 className="page-title">카드 수정</h1>
        <p className="page-desc">
          카드 기본 정보와 썸네일/대표 이미지를 수정합니다.
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
        </div>

        <button type="submit" className="primary-button">
          카드 수정 저장
        </button>
      </form>
    </main>
  );
}