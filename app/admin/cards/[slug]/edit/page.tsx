import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { updateCard, deleteCard } from "@/app/admin/actions";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

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

    const [
    { data: characters },
    { data: linkedStories },
    { data: linkedPhoneItems },
    { data: linkedEvents },
    { data: allStories },
    { data: allPhoneItems },
    { data: allEvents },
  ] = await Promise.all([
    supabase.from("characters").select("id, key"),

    storyIds.length > 0
      ? supabase
          .from("stories")
          .select("id, slug, title, subtype, primary_character_id")
          .in("id", storyIds)
      : Promise.resolve({ data: [] as any[] }),

    phoneIds.length > 0
      ? supabase
          .from("phone_items")
          .select("id, slug, title, subtype, content_json")
          .in("id", phoneIds)
      : Promise.resolve({ data: [] as any[] }),

    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, slug, title, subtype, primary_character_id")
          .in("id", eventIds)
      : Promise.resolve({ data: [] as any[] }),

    supabase
      .from("stories")
      .select("slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("phone_items")
      .select("slug, title, subtype, content_json")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("events")
      .select("slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  const characterMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  const linkedStoryMap = new Map(
    (linkedStories ?? []).map((item) => [item.id, item])
  );
  const linkedPhoneMap = new Map(
    (linkedPhoneItems ?? []).map((item) => [item.id, item])
  );
  const linkedEventMap = new Map(
    (linkedEvents ?? []).map((item) => [item.id, item])
  );



  const initialStories: RelationCandidate[] = (storyRelations ?? [])
    .map((item) => linkedStoryMap.get(item.child_id))
    .filter(Boolean)
    .map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    }));

  const initialPhoneItems: RelationCandidate[] = (phoneRelations ?? [])
    .map((item) => linkedPhoneMap.get(item.child_id))
    .filter(Boolean)
    .map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: item.content_json?.characterKey ?? null,
      category: item.content_json?.historyCategory ?? null,
    }));

  const initialEvents: RelationCandidate[] = (eventRelations ?? [])
    .map((item) => linkedEventMap.get(item.child_id))
    .filter(Boolean)
    .map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    }));

  const storyCandidates: RelationCandidate[] =
    (allStories ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    })) ?? [];

  const phoneCandidates: RelationCandidate[] =
    (allPhoneItems ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: item.content_json?.characterKey ?? null,
      category: item.content_json?.historyCategory ?? null,
    })) ?? [];

  const eventCandidates: RelationCandidate[] =
    (allEvents ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    })) ?? [];

  const thumbnailAfterUrl = thumbAfterMedia?.url ?? "";
  const coverAfterUrl = coverAfterMedia?.url ?? "";


const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
];

const PHONE_CATEGORY_OPTIONS = [
  { value: "daily", label: "일상" },
  { value: "companion", label: "동반" },
  { value: "card_story", label: "카드" },
  { value: "main_story", label: "메인스토리" },
  { value: "tangle", label: "얽힘" },
];




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
        </div>

        <RelationPicker
          label="연결 스토리"
          name="linkedStorySlugs"
          candidates={storyCandidates}
          initialSelected={initialStories}
          characterOptions={CHARACTER_OPTIONS}
          subtypeOptions={[
            { value: "card_story", label: "데이트" },
            { value: "asmr", label: "너의 곁에" },
            { value: "side_story", label: "외전" },
            { value: "main_story", label: "메인스토리" },
            { value: "behind_story", label: "막후의 장" },
            { value: "xiyue_story", label: "서월국" },
            { value: "myhome_story", label: "마이홈 스토리" },
            { value: "company_project", label: "회사 프로젝트" },
          ]}
        />

        <RelationPicker
          label="연결 휴대폰"
          name="linkedPhoneItemSlugs"
          candidates={phoneCandidates}
          initialSelected={initialPhoneItems}
          characterOptions={CHARACTER_OPTIONS}
          categoryOptions={PHONE_CATEGORY_OPTIONS}
          subtypeOptions={[
            { value: "message", label: "메시지" },
            { value: "moment", label: "모멘트" },
            { value: "call", label: "전화" },
            { value: "video_call", label: "영상통화" },
            { value: "article", label: "기사" },
          ]}
        />

        <RelationPicker
          label="연결 이벤트"
          name="linkedEventSlugs"
          candidates={eventCandidates}
          initialSelected={initialEvents}
          characterOptions={CHARACTER_OPTIONS}
        />

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