import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { updateCard, deleteCard } from "@/app/admin/actions";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
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

const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
] as const;

const PHONE_CATEGORY_OPTIONS = [
  { value: "daily", label: "일상" },
  { value: "companion", label: "동반" },
  { value: "card_story", label: "카드" },
  { value: "main_story", label: "메인스토리" },
  { value: "tangle", label: "얽힘" },
] as const;

const RARITY_OPTIONS = [
  { value: "nh", label: "NH" },
  { value: "n", label: "N" },
  { value: "r", label: "R" },
  { value: "sr", label: "SR" },
  { value: "er", label: "ER" },
  { value: "ser", label: "SER" },
  { value: "ssr", label: "SSR" },
  { value: "sp", label: "SP" },
  { value: "ur", label: "UR" },
] as const;

const ATTRIBUTE_OPTIONS = [
  { value: "drive", label: "추진력" },
  { value: "affinity", label: "친화력" },
  { value: "judgment", label: "결단력" },
  { value: "creativity", label: "창의력" },
] as const;

const CARD_CATEGORY_OPTIONS = [
  { value: "date", label: "데이트 카드" },
  { value: "main_story", label: "메인스토리 연계" },
  { value: "side_story", label: "외전 / 서브" },
  { value: "birthday", label: "생일 카드" },
  { value: "charge", label: "누적충전 카드" },
  { value: "free", label: "무료 카드" },
] as const;

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
      "id, title, slug, rarity, attribute, release_year, release_date, thumbnail_url, cover_image_url, summary, card_category"
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

  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("tag_id, sort_order")
    .eq("item_type", "card")
    .eq("item_id", card.id)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((itemTagRows ?? []).map((row) => row.tag_id)));

  let defaultTagText = "";

  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagNameMap = new Map(
      (tagRows ?? []).map((row) => [row.id, row.label ?? row.name ?? row.slug])
    );

    defaultTagText = (itemTagRows ?? [])
      .map((row) => tagNameMap.get(row.tag_id))
      .filter(Boolean)
      .join(", ");
  }

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

  const { data: cardRelations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("child_type", "card")
    .eq("relation_type", "card_card")
    .order("sort_order", { ascending: true });

  const storyIds = (storyRelations ?? []).map((item) => item.child_id);
  const phoneIds = (phoneRelations ?? []).map((item) => item.child_id);
  const eventIds = (eventRelations ?? []).map((item) => item.child_id);
  const cardIds = (cardRelations ?? []).map((item) => item.child_id);

  const [
    { data: characters },
    { data: linkedStories },
    { data: linkedPhoneItems },
    { data: linkedEvents },
    { data: linkedCards },
    { data: allStories },
    { data: allPhoneItems },
    { data: allEvents },
    { data: allCards },
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

    cardIds.length > 0
      ? supabase
          .from("cards")
          .select("id, slug, title, rarity, primary_character_id")
          .in("id", cardIds)
      : Promise.resolve({ data: [] as any[] }),

   supabase
      .from("stories")
      .select("id, slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("phone_items")
      .select("id, slug, title, subtype, content_json")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("events")
      .select("id, slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("cards")
      .select("id, slug, title, rarity, primary_character_id")
      .eq("is_published", true)
      .neq("id", card.id)
      .order("created_at", { ascending: false }),
  ]);

 const characterMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  // 태그 조회
  const allIds = Array.from(new Set([
    ...(allStories ?? []).map((item: any) => item.id),
    ...(allPhoneItems ?? []).map((item: any) => item.id),
    ...(allEvents ?? []).map((item: any) => item.id),
    ...(allCards ?? []).map((item: any) => item.id),
  ].filter(Boolean)));

  let itemTagsMap = new Map<string, string[]>();

  if (allIds.length > 0) {
 const CHUNK_SIZE = 100;
    const itemTagChunks2: any[] = [];
    for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
      const chunk = allIds.slice(i, i + CHUNK_SIZE);
      const { data } = await supabase
        .from("item_tags")
        .select("item_id, tag_id, sort_order")
        .in("item_id", chunk)
        .order("sort_order", { ascending: true });
      if (data) itemTagChunks2.push(...data);
    }
    const itemTagRows2 = itemTagChunks2;
    const tagIds2 = Array.from(new Set((itemTagRows2 ?? []).map((row: any) => row.tag_id)));

    if (tagIds2.length > 0) {
      const { data: tagRows2 } = await supabase
        .from("tags")
        .select("id, label, name, slug")
        .in("id", tagIds2);

      const tagLabelMap = new Map(
        (tagRows2 ?? []).map((row: any) => [row.id, row.label ?? row.name ?? row.slug])
      );

      itemTagsMap = (itemTagRows2 ?? []).reduce((map: Map<string, string[]>, row: any) => {
        const label = tagLabelMap.get(row.tag_id);
        if (!label) return map;
        const prev = map.get(row.item_id) ?? [];
        prev.push(label);
        map.set(row.item_id, prev);
        return map;
      }, new Map<string, string[]>());
    }
  }

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

  const linkedCardMap = new Map(
    (linkedCards ?? []).map((item) => [item.id, item])
  );

  const initialLinkedCards: RelationCandidate[] = (cardRelations ?? [])
    .map((item) => linkedCardMap.get(item.child_id))
    .filter(Boolean)
    .map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.rarity,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    }));

const storyCandidates: RelationCandidate[] =
    (allStories ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const phoneCandidates: RelationCandidate[] =
    (allPhoneItems ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: item.content_json?.characterKey ?? null,
      category: item.content_json?.historyCategory ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const eventCandidates: RelationCandidate[] =
    (allEvents ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const cardCandidates: RelationCandidate[] =
    (allCards ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.rarity,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const thumbnailAfterUrl = thumbAfterMedia?.url ?? "";
  const coverAfterUrl = coverAfterMedia?.url ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards / Edit</div>
        <h1 className="page-title">카드 수정</h1>
        <p className="page-desc">
          카드 기본 정보, 카드 분류, 해시태그, 연결 콘텐츠를 수정합니다.
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
            <span>카드 제목</span>
            <input name="title" defaultValue={card.title} required />
          </label>

          <label className="form-field">
            <span>등급</span>
            <select name="rarity" defaultValue={card.rarity ?? "ssr"}>
              {RARITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>속성</span>
            <select name="attribute" defaultValue={card.attribute ?? "affinity"}>
              {ATTRIBUTE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

   <label className="form-field">
  <span>카드 분류</span>
  <select name="cardCategory" defaultValue={card.card_category ?? ""}>
    <option value="">미분류</option>
    {CARD_CATEGORY_OPTIONS.map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
  </select>
</label>

          <label className="form-field">
            <span>연도</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={card.release_year ?? ""}
              required
            />
          </label>

          <label className="form-field">
            <span>출시일</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={card.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              defaultValue={defaultTagText}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="예: 생일, 무료, 카드스토리, 메인연계"
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 (진화 전)</span>
            <input
              name="thumbnailUrl"
              defaultValue={card.thumbnail_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 (진화 후)</span>
            <input
              name="thumbnailAfterUrl"
              defaultValue={thumbnailAfterUrl}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 (진화 전)</span>
            <input
              name="coverImageUrl"
              defaultValue={card.cover_image_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 (진화 후)</span>
            <input
              name="coverAfterUrl"
              defaultValue={coverAfterUrl}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
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
          characterOptions={[...CHARACTER_OPTIONS]}
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
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...PHONE_CATEGORY_OPTIONS]}
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
          characterOptions={[...CHARACTER_OPTIONS]}
        />

        <RelationPicker
          label="연결 카드"
          name="linkedCardSlugs"
          candidates={cardCandidates}
          initialSelected={initialLinkedCards}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[
            { value: "r", label: "R" },
            { value: "sr", label: "SR" },
            { value: "er", label: "ER" },
            { value: "ser", label: "SER" },
            { value: "ssr", label: "SSR" },
            { value: "sp", label: "SP" },
            { value: "ur", label: "UR" },
            { value: "nh", label: "NH" },
            { value: "n", label: "N" },
          ]}
        />

        <div className="admin-subpanel">
          <StoryFormEnhancer storageKey={`card-draft:${card.slug}`} />
        </div>
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
          <input type="hidden" name="slug" value={card.slug} />
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