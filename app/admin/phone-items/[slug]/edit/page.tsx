import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updatePhoneItem, deletePhoneItem } from "@/app/admin/actions";

type EditPhoneItemPageProps = {
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

export default async function EditPhoneItemPage({
  params,
  searchParams,
}: EditPhoneItemPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error ?? "";

  const { data: item, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, release_year, release_date, summary")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[admin/phone-items/[slug]/edit] fetch error:", error);
  }

  if (!item) {
    notFound();
  }

  const { data: cardRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "phone_item")
    .eq("parent_id", item.id)
    .eq("child_type", "card")
    .eq("relation_type", "related_card")
    .order("sort_order", { ascending: true });

  const { data: storyRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "phone_item")
    .eq("parent_id", item.id)
    .eq("child_type", "story")
    .eq("relation_type", "related_story")
    .order("sort_order", { ascending: true });

  const { data: eventRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "phone_item")
    .eq("parent_id", item.id)
    .eq("child_type", "event")
    .eq("relation_type", "phone_event")
    .order("sort_order", { ascending: true });

  const cardIds = (cardRelations ?? []).map((item) => item.child_id);
  const storyIds = (storyRelations ?? []).map((item) => item.child_id);
  const eventIds = (eventRelations ?? []).map((item) => item.child_id);

  const { data: cards } =
    cardIds.length > 0
      ? await supabase.from("cards").select("id, slug").in("id", cardIds)
      : { data: [] as { id: string; slug: string }[] };

  const { data: stories } =
    storyIds.length > 0
      ? await supabase.from("stories").select("id, slug").in("id", storyIds)
      : { data: [] as { id: string; slug: string }[] };

  const { data: events } =
    eventIds.length > 0
      ? await supabase.from("events").select("id, slug").in("id", eventIds)
      : { data: [] as { id: string; slug: string }[] };

  const cardSlugMap = new Map((cards ?? []).map((item) => [item.id, item.slug]));
  const storySlugMap = new Map((stories ?? []).map((item) => [item.id, item.slug]));
  const eventSlugMap = new Map((events ?? []).map((item) => [item.id, item.slug]));

  const linkedCardSlugs = (cardRelations ?? [])
    .map((item) => cardSlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  const linkedStorySlugs = (storyRelations ?? [])
    .map((item) => storySlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  const linkedEventSlugs = (eventRelations ?? [])
    .map((item) => eventSlugMap.get(item.child_id))
    .filter(Boolean)
    .join("\n");

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items / Edit</div>
        <h1 className="page-title">휴대폰 콘텐츠 수정</h1>
        <p className="page-desc">
          휴대폰 콘텐츠 기본 정보와 연결 콘텐츠를 수정합니다.
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

      <form action={updatePhoneItem} className="form-panel">
        <input type="hidden" name="phoneItemId" value={item.id} />
        <input type="hidden" name="slug" value={item.slug} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" defaultValue={item.title} required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue={item.subtype}>
              <option value="moment">moment</option>
              <option value="message">message</option>
              <option value="call">call</option>
              <option value="video_call">video_call</option>
              <option value="article">article</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={item.release_year ?? ""}
              required
            />
          </label>

          <label className="form-field">
            <span>release_date</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={item.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea
              name="summary"
              rows={5}
              defaultValue={item.summary ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>linked card slugs</span>
            <textarea
              name="linkedCardSlugs"
              rows={5}
              defaultValue={linkedCardSlugs}
              placeholder="한 줄에 slug 하나씩 입력"
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
          휴대폰 콘텐츠 수정 저장
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
        <Link href={`/phone-items/${item.slug}`} className="nav-link">
          공개 보기
        </Link>

        <Link href="/admin/phone-items" className="nav-link">
          목록으로
        </Link>

        <form action={deletePhoneItem}>
          <input type="hidden" name="phoneItemId" value={item.id} />
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