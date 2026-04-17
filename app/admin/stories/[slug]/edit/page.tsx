import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { updateStoryBundle, deleteStoryBundle } from "@/app/admin/actions";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";
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

type EditStoryPageProps = {
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

function normalizeLang(value?: string | null) {
  const code = (value || "").toLowerCase().trim();
  if (code === "zh" || code === "zh-cn" || code === "cn" || code === "chs") {
    return "cn";
  }
  if (code === "ko" || code === "ko-kr" || code === "kr" || code === "korean") {
    return "kr";
  }
  return null;
}

export default async function EditStoryPage({
  params,
  searchParams,
}: EditStoryPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error ?? "";
  const saved = resolvedSearchParams?.saved === "1";

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (storyError || !story) {
    notFound();
  }

  const [
    { data: translations },
    { data: mediaRows },
    { data: coverMedia },
    { data: relations },
    { data: characters },
    { data: appearingCharacterRows },
    { data: itemTagRows },
    { data: cards },
    { data: phoneItems },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("translations")
      .select("id, title, body, language_code")
      .eq("parent_type", "story")
      .eq("parent_id", story.id),

    supabase
      .from("media_assets")
      .select("id, url, usage_type")
      .eq("parent_type", "story")
      .eq("parent_id", story.id)
      .eq("media_type", "youtube"),

    supabase
      .from("media_assets")
      .select("id, url")
      .eq("parent_type", "story")
      .eq("parent_id", story.id)
      .eq("media_type", "image")
      .eq("usage_type", "cover")
      .maybeSingle(),

    supabase
      .from("item_relations")
      .select("parent_type, parent_id, sort_order")
      .eq("child_type", "story")
      .eq("child_id", story.id)
      .order("sort_order", { ascending: true }),

    supabase
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),

    supabase
      .from("item_characters")
      .select("character_id")
      .eq("item_type", "story")
      .eq("item_id", story.id),

    supabase
      .from("item_tags")
      .select("tag_id, sort_order")
      .eq("item_type", "story")
      .eq("item_id", story.id)
      .order("sort_order", { ascending: true }),

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

  const translationCn =
    translations?.find((item) => normalizeLang(item.language_code) === "cn") ??
    null;

  const translationKr =
    translations?.find((item) => normalizeLang(item.language_code) === "kr") ??
    null;

  const mediaLegacy =
    mediaRows?.find((item) => item.usage_type === "pv") ?? null;

  const mediaCn =
    mediaRows?.find((item) => item.usage_type === "pv_cn") ?? null;

  const mediaKr =
    mediaRows?.find((item) => item.usage_type === "pv_kr") ?? mediaLegacy;

  const appearingCharacterIds =
    appearingCharacterRows?.map((row: any) => row.character_id) ?? [];

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

  const characterRows = characters ?? [];
  const characterKeyMap = new Map(
    characterRows.map((item: any) => [item.id, item.key])
  );

  const cardCandidates: RelationCandidate[] =
    (cards ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
      category: item.card_category ?? null,
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
    })) ?? [];

  const eventCandidates: RelationCandidate[] =
    (events ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype ?? null,
      characterKey: characterKeyMap.get(item.primary_character_id) ?? null,
    })) ?? [];

  const cardIdToCandidate = new Map(
    (cards ?? []).map((item: any) => [item.id, cardCandidates.find((c) => c.slug === item.slug)])
  );
  const phoneIdToCandidate = new Map(
    (phoneItems ?? []).map((item: any) => [item.id, phoneCandidates.find((c) => c.slug === item.slug)])
  );
  const eventIdToCandidate = new Map(
    (events ?? []).map((item: any) => [item.id, eventCandidates.find((c) => c.slug === item.slug)])
  );

  const initialCards =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "card")
      .map((rel: any) => cardIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  const initialPhoneItems =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "phone_item")
      .map((rel: any) => phoneIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  const initialEvents =
    (relations ?? [])
      .filter((rel: any) => rel.parent_type === "event")
      .map((rel: any) => eventIdToCandidate.get(rel.parent_id))
      .filter(Boolean) as RelationCandidate[];

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories / Edit</div>
        <h1 className="page-title">스토리 통합 수정</h1>
        <p className="page-desc">
          스토리, 메인 정렬 메타, 공개 범위, 번역, 영상, 연결 콘텐츠를 한 화면에서 수정합니다.
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

      <form action={updateStoryBundle} className="form-panel">
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="slug" value={story.slug} />
        <input type="hidden" name="translationCnId" value={translationCn?.id ?? ""} />
        <input type="hidden" name="translationKrId" value={translationKr?.id ?? ""} />
        <input type="hidden" name="mediaCnId" value={mediaCn?.id ?? ""} />
        <input type="hidden" name="mediaKrId" value={mediaKr?.id ?? ""} />
        <input type="hidden" name="coverMediaId" value={coverMedia?.id ?? ""} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" defaultValue={story.title} required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue={story.subtype}>
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
              defaultValue={story.release_year}
              required
            />
          </label>

          <label className="form-field">
            <span>출시일</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={story.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              defaultValue={defaultTagText}
              placeholder="예: 학교, 어머니, 추천, 고백전"
            />
          </label>

          <label className="form-field form-field-full">
            <span>CN 유튜브 링크</span>
            <input
              name="youtubeUrlCn"
              defaultValue={mediaCn?.url ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>KR 유튜브 링크</span>
            <input
              name="youtubeUrlKr"
              defaultValue={mediaKr?.url ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 URL</span>
            <input
              name="coverImageUrl"
              defaultValue={coverMedia?.url ?? ""}
              placeholder="https://..."
            />
          </label>

          <StoryTranslationFields
            cnTitle={translationCn?.title ?? ""}
            cnBody={translationCn?.body ?? ""}
            krTitle={translationKr?.title ?? ""}
            krBody={translationKr?.body ?? ""}
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
          label="연결 휴대폰"
          name="linkedPhoneItemSlugs"
          candidates={phoneCandidates}
          initialSelected={initialPhoneItems}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...PHONE_CATEGORY_OPTIONS]}
          subtypeOptions={[...PHONE_SUBTYPE_OPTIONS]}
        />

        <RelationPicker
          label="연결 이벤트"
          name="linkedEventSlugs"
          candidates={eventCandidates}
          initialSelected={initialEvents}
          characterOptions={[...CHARACTER_OPTIONS]}
        />

        <StoryVisibilityFields
          values={{
            visibility: story.visibility ?? "public",
            access_hint: story.access_hint ?? "",
          }}
        />

        <StoryMainMetaFields
          characters={characters ?? []}
          values={{
            part_no: story.part_no,
            volume_no: story.volume_no,
            main_season: story.main_season,
            chapter_no: story.chapter_no,
            main_kind: story.main_kind,
            route_scope: story.route_scope,
            primary_character_id: story.primary_character_id,
            manual_sort_order: story.manual_sort_order,
            arc_title: story.arc_title,
            episode_title: story.episode_title,
            appearing_character_ids: appearingCharacterIds,
          }}
        />

        <StoryFormEnhancer storageKey={`story-draft:${story.slug}`} />
      </form>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "18px",
        }}
      >
        <Link href={`/stories/${story.slug}`} className="nav-link">
          공개 보기
        </Link>

        <Link href="/admin/stories" className="nav-link">
          목록으로
        </Link>

        <form action={deleteStoryBundle}>
          <input type="hidden" name="storyId" value={story.id} />
          <DeletePhoneItemButton
            label="삭제"
            confirmMessage={`정말 삭제할까요?\n\n${story.title}`}
            className="nav-link"
            icon="delete"
          />
        </form>
      </div>
    </main>
  );
}