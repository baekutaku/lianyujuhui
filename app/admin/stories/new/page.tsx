import { createStoryBundle } from "@/app/admin/actions";
import { supabase } from "@/lib/supabase/server";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import StoryMainMetaFields from "@/components/admin/stories/StoryMainMetaFields";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import StoryTranslationFields from "@/components/admin/stories/StoryTranslationFields";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

const STORY_SUBTYPE_OPTIONS = [
  { value: "card_story", label: "데이트" },
  { value: "main_story", label: "메인스토리" },
  { value: "side_story", label: "외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "behind_story", label: "막후의 장" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈 스토리" },
  { value: "company_project", label: "회사 프로젝트" },
] as const;

const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
] as const;

const CARD_CATEGORY_OPTIONS = [
  { value: "date", label: "데이트 카드" },
  { value: "main_story", label: "메인스토리 연계" },
  { value: "side_story", label: "외전 / 서브" },
  { value: "birthday", label: "생일 카드" },
  { value: "charge", label: "누적충전 카드" },
  { value: "free", label: "무료 카드" },
] as const;

const PHONE_CATEGORY_OPTIONS = [
  { value: "daily", label: "일상" },
  { value: "companion", label: "동반" },
  { value: "card_story", label: "카드" },
  { value: "main_story", label: "메인스토리" },
  { value: "tangle", label: "얽힘" },
] as const;

const PHONE_SUBTYPE_OPTIONS = [
  { value: "message", label: "메시지" },
  { value: "moment", label: "모멘트" },
  { value: "call", label: "전화" },
  { value: "video_call", label: "영상통화" },
  { value: "article", label: "기사" },
] as const;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

const [
  { data: characters },
  { data: stories },
  { data: cards },
  { data: phoneItems },
  { data: events },
] = await Promise.all([
  supabase
    .from("characters")
    .select("id, key, name_ko")
    .order("sort_order", { ascending: true }),

  supabase
    .from("stories")
    .select("id, title, slug, subtype, primary_character_id")
    .order("release_year", { ascending: false }),

  supabase
    .from("cards")
    .select("id, title, slug, primary_character_id, card_category")
    .order("release_year", { ascending: false }),

  supabase
    .from("phone_items")
    .select("id, title, slug, subtype, content_json")
    .order("release_year", { ascending: false }),

  supabase
    .from("events")
    .select("id, title, slug, subtype, primary_character_id")
    .order("release_year", { ascending: false }),
]);


const relationSourceIds = [
  ...(stories ?? []).map((item: any) => item.id),
  ...(cards ?? []).map((item: any) => item.id),
  ...(phoneItems ?? []).map((item: any) => item.id),
  ...(events ?? []).map((item: any) => item.id),
];

let itemTagsMap = new Map<string, string[]>();

if (relationSourceIds.length > 0) {
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("item_id, tag_id, item_type, sort_order")
    .in("item_id", relationSourceIds)
    .in("item_type", ["story", "card", "phone_item", "event"])
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((itemTagRows ?? []).map((row: any) => row.tag_id)));

  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagLabelMap = new Map(
      (tagRows ?? []).map((row: any) => [
        row.id,
        row.label ?? row.name ?? row.slug,
      ])
    );

    itemTagsMap = (itemTagRows ?? []).reduce((map, row: any) => {
      const label = tagLabelMap.get(row.tag_id);
      if (!label) return map;

      const prev = map.get(row.item_id) ?? [];
      prev.push(label);
      map.set(row.item_id, prev);
      return map;
    }, new Map<string, string[]>());
  }
}

  const characterRows = characters ?? [];
  const characterKeyMap = new Map(
    characterRows.map((item: any) => [item.id, item.key])
  );
const storyCandidates: RelationCandidate[] =
  (stories ?? []).map((item: any) => ({
    slug: item.slug,
    title: item.title,
    subtype: item.subtype ?? null,
    characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
    tags: itemTagsMap.get(item.id) ?? [],
  })) ?? [];

const cardCandidates: RelationCandidate[] =
  (cards ?? []).map((item: any) => ({
    slug: item.slug,
    title: item.title,
    characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
    category: item.card_category ?? null,
    tags: itemTagsMap.get(item.id) ?? [],
  })) ?? [];

const phoneCandidates: RelationCandidate[] =
  (phoneItems ?? []).map((item: any) => ({
    slug: item.slug,
    title: item.title,
    subtype: item.subtype ?? null,
    characterKey: item.content_json?.characterKey ?? null,
    category:
      item.content_json?.historyCategory ??
      item.content_json?.momentCategory ??
      null,
    tags: itemTagsMap.get(item.id) ?? [],
  })) ?? [];

const eventCandidates: RelationCandidate[] =
  (events ?? []).map((item: any) => ({
    slug: item.slug,
    title: item.title,
    subtype: item.subtype ?? null,
    characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
    tags: itemTagsMap.get(item.id) ?? [],
  })) ?? [];
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories</div>
        <h1 className="page-title">스토리 통합 등록</h1>
        <p className="page-desc">
          스토리 기본 정보, 메인 정렬 메타, 공개 범위, 번역, 영상, 연결 콘텐츠를 한 화면에서 등록합니다.
        </p>
      </header>

      {error ? (
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
          {safeDecode(error)}
        </p>
      ) : null}

      <form action={createStoryBundle} className="form-panel">
<div className="form-grid">
  <label className="form-field form-field-full">
    <span>제목</span>
    <input name="title" required />
  </label>

  <label className="form-field">
    <span>slug</span>
    <input
      name="slug"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      placeholder="비워두면 자동 생성"
    />
  </label>

  <label className="form-field">
    <span>카테고리</span>
    <select name="subtype" defaultValue="card_story">
      {STORY_SUBTYPE_OPTIONS.map((item) => (
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
      defaultValue={2025}
      required
    />
  </label>

  <label className="form-field">
    <span>출시일</span>
    <input name="releaseDate" type="date" />
  </label>

  <label className="form-field">
    <span>서버</span>
    <select name="serverKey" defaultValue="cn">
      <option value="cn">중국</option>
      <option value="kr">한국</option>
    </select>
  </label>

  <label className="form-field">
    <span>대표 캐릭터</span>
    <select name="characterKey" defaultValue="baiqi">
      {CHARACTER_OPTIONS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="예: 러브레터, 워시환니, 키스"
            />
          </label>

          <label className="form-field form-field-full">
            <span>CN 유튜브 링크</span>
            <input
              name="youtubeUrlCn"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>KR 유튜브 링크</span>
            <input
              name="youtubeUrlKr"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 URL</span>
            <input name="coverImageUrl" placeholder="https://..." />
          </label>

          <StoryTranslationFields />
        </div>

        <RelationPicker
          label="연결 카드"
          name="linkedCardSlugs"
          candidates={cardCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...CARD_CATEGORY_OPTIONS]}
        />

        <RelationPicker
          label="연결 휴대폰"
          name="linkedPhoneItemSlugs"
          candidates={phoneCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...PHONE_CATEGORY_OPTIONS]}
          subtypeOptions={[...PHONE_SUBTYPE_OPTIONS]}
        />
<RelationPicker
  label="연결 스토리"
  name="linkedStorySlugs"
  candidates={storyCandidates}
  characterOptions={[...CHARACTER_OPTIONS]}
  subtypeOptions={[...STORY_SUBTYPE_OPTIONS]}
/>


        <RelationPicker
          label="연결 이벤트"
          name="linkedEventSlugs"
          candidates={eventCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
        />

        <StoryVisibilityFields
          values={{
            visibility: "public",
            access_hint: "",
          }}
        />

        <StoryMainMetaFields
          characters={characterRows}
          values={{
            manual_sort_order: 0,
            appearing_character_ids: [],
          }}
        />

        <StoryFormEnhancer storageKey="story-draft:new" />
      </form>
    </main>
  );
}