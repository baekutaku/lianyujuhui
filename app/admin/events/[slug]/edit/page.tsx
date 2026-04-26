import Link from "next/link";
import { notFound } from "next/navigation";
import SmartEditor from "@/components/editor/SmartEditor";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";
import { supabase } from "@/lib/supabase/server";
import { updateEventBundle, deleteEventBundle } from "@/app/admin/actions";

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

type EditEventPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function EditEventPage({
  params,
  searchParams,
}: EditEventPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error ?? "";
  const saved = resolvedSearchParams?.saved === "1";

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (eventError || !event) {
    notFound();
  }

  const [
    { data: translation },
    { data: relations },
    { data: cards },
    { data: stories },
    { data: phoneItems },
    { data: characters },
    { data: itemTagRows },
    { data: youtubeMedia },
    { data: serverRow },
  ] = await Promise.all([
    supabase
      .from("translations")
      .select("id, title, body")
      .eq("parent_type", "event")
      .eq("parent_id", event.id)
      .maybeSingle(),

    supabase
      .from("item_relations")
      .select("parent_type, parent_id, sort_order")
      .eq("child_type", "event")
      .eq("child_id", event.id)
      .order("sort_order", { ascending: true }),

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
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),

    supabase
      .from("item_tags")
      .select("tag_id, sort_order")
      .eq("item_type", "event")
      .eq("item_id", event.id)
      .order("sort_order", { ascending: true }),

    supabase
      .from("media_assets")
      .select("id, url")
      .eq("parent_type", "event")
      .eq("parent_id", event.id)
      .eq("media_type", "youtube")
      .maybeSingle(),

    event.server_id
      ? supabase
          .from("servers")
          .select("key")
          .eq("id", event.server_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const tagIds = Array.from(
    new Set((itemTagRows ?? []).map((row: any) => row.tag_id))
  );
  let defaultTagText = "";

  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, label")
      .in("id", tagIds);

    const tagNameMap = new Map(
      (tagRows ?? []).map((row: any) => [row.id, row.label])
    );

    defaultTagText = (itemTagRows ?? [])
      .map((row: any) => tagNameMap.get(row.tag_id))
      .filter(Boolean)
      .join(", ");
  }

  const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );
  const relationSourceIds = [
  ...(cards ?? []).map((item: any) => item.id),
  ...(stories ?? []).map((item: any) => item.id),
  ...(phoneItems ?? []).map((item: any) => item.id),
];

let itemTagsMap = new Map<string, string[]>();

if (relationSourceIds.length > 0) {
  const { data: relationItemTagRows } = await supabase
    .from("item_tags")
    .select("item_id, tag_id, item_type, sort_order")
    .in("item_id", relationSourceIds)
    .in("item_type", ["card", "story", "phone_item"])
    .order("sort_order", { ascending: true });

  const relationTagIds = Array.from(
    new Set((relationItemTagRows ?? []).map((row: any) => row.tag_id))
  );

  if (relationTagIds.length > 0) {
    const { data: relationTagRows } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", relationTagIds);

    const relationTagLabelMap = new Map(
      (relationTagRows ?? []).map((row: any) => [
        row.id,
        row.label ?? row.name ?? row.slug,
      ])
    );

    itemTagsMap = (relationItemTagRows ?? []).reduce(
      (map: Map<string, string[]>, row: any) => {
        const label = relationTagLabelMap.get(row.tag_id);
        if (!label) return map;

        const prev = map.get(row.item_id) ?? [];
        prev.push(label);
        map.set(row.item_id, prev);

        return map;
      },
      new Map<string, string[]>()
    );
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

  
  const cardIdToCandidate = new Map(
    (cards ?? []).map((item: any) => [
      item.id,
      cardCandidates.find((c) => c.slug === item.slug),
    ])
  );

  const storyIdToCandidate = new Map(
    (stories ?? []).map((item: any) => [
      item.id,
      storyCandidates.find((c) => c.slug === item.slug),
    ])
  );

  const phoneIdToCandidate = new Map(
    (phoneItems ?? []).map((item: any) => [
      item.id,
      phoneCandidates.find((c) => c.slug === item.slug),
    ])
  );

  const initialCards =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "card")
      .map((rel: any) => cardIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  const initialStories =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "story")
      .map((rel: any) => storyIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  const initialPhoneItems =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "phone_item")
      .map((rel: any) => phoneIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  const characterKey =
    (characters ?? []).find((item: any) => item.id === event.primary_character_id)?.key ??
    "baiqi";

  const serverKey = serverRow?.key ?? "kr";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Events / Edit</div>
        <h1 className="page-title">이벤트 통합 수정</h1>
        <p className="page-desc">
          이벤트 기본 정보, 번역, 영상, 연결 카드/스토리/휴대폰을 한 화면에서 수정합니다.
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

      {saved ? (
        <p
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#1f3529",
            color: "#b6f5cb",
            border: "1px solid #2f6b46",
          }}
        >
          저장되었습니다.
        </p>
      ) : null}

      <form action={updateEventBundle} className="form-panel">
        <input type="hidden" name="eventId" value={event.id} />
        <input type="hidden" name="slug" value={event.slug} />
        <input type="hidden" name="translationId" value={translation?.id ?? ""} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" defaultValue={event.title} required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue={event.subtype}>
              {EVENT_SUBTYPE_OPTIONS.map((item) => (
                <option key={`${item.value}-${item.label}`} value={item.value}>
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
              defaultValue={event.release_year}
              required
            />
          </label>

          <label className="form-field">
            <span>시작일</span>
            <input
              name="startDate"
              type="date"
              defaultValue={event.start_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>종료일</span>
            <input
              name="endDate"
              type="date"
              defaultValue={event.end_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>서버</span>
            <select name="serverKey" defaultValue={serverKey}>
              <option value="kr">한국</option>
              <option value="cn">중국</option>
            </select>
          </label>

          <label className="form-field">
            <span>캐릭터</span>
            <select name="characterKey" defaultValue={characterKey}>
              {CHARACTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>게시 여부</span>
            <select
              name="isPublished"
              defaultValue={event.is_published ? "true" : "false"}
            >
              <option value="true">공개</option>
              <option value="false">비공개</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
            <textarea name="summary" rows={4} defaultValue={event.summary ?? ""} />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              defaultValue={defaultTagText}
              placeholder="예: 생일, 한정, 복각"
            />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 URL</span>
            <input
              name="youtubeUrl"
              defaultValue={youtubeMedia?.url ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 URL</span>
            <input
              name="thumbnailUrl"
              defaultValue={event.thumbnail_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>번역 제목</span>
            <input
              name="translationTitle"
              defaultValue={translation?.title ?? ""}
            />
          </label>

          <SmartEditor
            name="translationBody"
            label="번역 본문"
            initialValue={translation?.body ?? ""}
            height="700px"
          />
        </div>

        <RelationPicker
          label="연결 카드"
          name="linkedCardSlugs"
          candidates={cardCandidates}
          initialSelected={initialCards}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...CARD_CATEGORY_OPTIONS]}
        />

        <RelationPicker
          label="연결 스토리"
          name="linkedStorySlugs"
          candidates={storyCandidates}
          initialSelected={initialStories}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[...STORY_SUBTYPE_OPTIONS]}
        />

        <RelationPicker
          label="연결 휴대폰"
          name="linkedPhoneItemSlugs"
          candidates={phoneCandidates}
          initialSelected={initialPhoneItems}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...PHONE_CATEGORY_OPTIONS]}
          subtypeOptions={[...PHONE_SUBTYPE_OPTIONS]}
        />

        <div className="admin-subpanel">
          <StoryVisibilityFields
            values={{
              visibility: event.visibility ?? "public",
              access_hint: event.access_hint ?? "",
            }}
          />
        </div>

        <div className="admin-subpanel">
          <StoryFormEnhancer storageKey={`event-draft:${event.slug}`} />
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
        <Link href={`/events/${event.slug}`} className="nav-link">
          공개 보기
        </Link>

        <Link href="/admin/events" className="nav-link">
          목록으로
        </Link>

        <form action={deleteEventBundle}>
          <input type="hidden" name="eventId" value={event.id} />
          <button type="submit" className="nav-link" style={{ cursor: "pointer" }}>
            삭제
          </button>
        </form>
      </div>
    </main>
  );
}