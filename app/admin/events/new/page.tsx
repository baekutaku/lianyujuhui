import SmartEditor from "@/components/editor/SmartEditor";
import { createEventBundle } from "@/app/admin/actions";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";
import { supabase } from "@/lib/supabase/server";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const EVENT_SUBTYPE_OPTIONS = [
  { value: "birthday_baiqi", label: "캐릭터 생일" },
  { value: "birthday_mc", label: "유저 생일" },
  { value: "anniversary_event", label: "N주년" },
  { value: "game_event", label: "명절 / 기념일" },
  { value: "seasonal_event", label: "시즌 이벤트" },
  { value: "collaboration_event", label: "콜라보" },
  { value: "return_event", label: "복귀 이벤트" },
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

export default async function NewEventPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  const [
    { data: cards },
    { data: stories },
    { data: phoneItems },
    { data: events },
    { data: characters },
  ] = await Promise.all([
    supabase
      .from("cards")
      .select("id, title, slug, primary_character_id, card_category")
      .order("release_year", { ascending: false }),

    supabase
      .from("stories")
      .select("id, title, slug, subtype, primary_character_id")
      .order("release_year", { ascending: false }),

    supabase
      .from("phone_items")
      .select("id, title, slug, subtype, content_json")
      .order("release_year", { ascending: false }),

    supabase
      .from("events")
      .select("id, title, slug, subtype, primary_character_id")
      .order("release_year", { ascending: false }),

    supabase
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),
  ]);

   const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  // 태그 조회
  const allIds = Array.from(new Set([
    ...(cards ?? []).map((item: any) => item.id),
    ...(stories ?? []).map((item: any) => item.id),
    ...(phoneItems ?? []).map((item: any) => item.id),
    ...(events ?? []).map((item: any) => item.id),
  ].filter(Boolean)));

  let itemTagsMap = new Map<string, string[]>();

  if (allIds.length > 0) {
   const { data: itemTagRows } = await supabase
  .from("item_tags")
  .select("item_id, tag_id, item_type, sort_order")
  .in("item_id", allIds)
  .in("item_type", ["card", "story", "phone_item", "event"])
  .order("sort_order", { ascending: true });

    const tagIds = Array.from(new Set((itemTagRows ?? []).map((row: any) => row.tag_id)));

    if (tagIds.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, label, name, slug")
        .in("id", tagIds);

      const tagLabelMap = new Map(
        (tagRows ?? []).map((row: any) => [row.id, row.label ?? row.name ?? row.slug])
      );

      itemTagsMap = (itemTagRows ?? []).reduce((map: Map<string, string[]>, row: any) => {
        const label = tagLabelMap.get(row.tag_id);
        if (!label) return map;
        const prev = map.get(row.item_id) ?? [];
        prev.push(label);
        map.set(row.item_id, prev);
        return map;
      }, new Map<string, string[]>());
    }
  }

  const cardCandidates: RelationCandidate[] =
    (cards ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
      category: item.card_category ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const storyCandidates: RelationCandidate[] =
    (stories ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype ?? null,
      characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
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
        <div className="page-eyebrow">Admin / Events</div>
        <h1 className="page-title">이벤트 통합 등록</h1>
        <p className="page-desc">
          이벤트 기본 정보, 번역, 영상, 연결 카드/스토리/휴대폰을 한 화면에서 등록합니다.
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

      <form action={createEventBundle} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue="seasonal_event">
              {EVENT_SUBTYPE_OPTIONS.map((item) => (
                <option key={`${item.value}-${item.label}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>연도</span>
            <input name="releaseYear" type="number" defaultValue={2025} required />
          </label>

          <label className="form-field">
            <span>시작일</span>
            <input name="startDate" type="date" />
          </label>

          <label className="form-field">
            <span>종료일</span>
            <input name="endDate" type="date" />
          </label>

          <label className="form-field">
            <span>서버</span>
            <select name="serverKey" defaultValue="kr">
              <option value="kr">한국</option>
              <option value="cn">중국</option>
            </select>
          </label>

          <label className="form-field">
            <span>캐릭터</span>
            <select name="characterKey" defaultValue="baiqi">
              {CHARACTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
            <textarea name="summary" rows={4} />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="예: 생일, 한정, 복각"
            />
          </label>

         <label className="form-field form-field-full">
            <span>CN 유튜브 URL</span>
            <input
              name="youtubeUrlCn"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>KR 유튜브 URL</span>
            <input
              name="youtubeUrlKr"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 URL</span>
            <input name="thumbnailUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>번역 제목</span>
            <input name="translationTitle" />
          </label>

          <SmartEditor
            name="translationBody"
            label="번역 본문"
            initialValue=""
            height="700px"
          />
        </div>

        <RelationPicker
          label="연결 카드"
          name="linkedCardSlugs"
          candidates={cardCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...CARD_CATEGORY_OPTIONS]}
        />

        <RelationPicker
          label="연결 스토리"
          name="linkedStorySlugs"
          candidates={storyCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[...STORY_SUBTYPE_OPTIONS]}
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
          label="연결 이벤트"
          name="linkedRelatedEventSlugs"
          candidates={eventCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[...EVENT_SUBTYPE_OPTIONS]}
        />

        <div className="admin-subpanel">
          <StoryVisibilityFields
            values={{
              visibility: "public",
              access_hint: "",
            }}
          />
        </div>

        <div className="admin-subpanel">
          <StoryFormEnhancer storageKey="event-draft:new" />
        </div>
      </form>
    </main>
  );
}