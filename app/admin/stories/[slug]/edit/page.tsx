import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { updateStoryBundle, deleteStoryBundle } from "@/app/admin/actions";
import SmartEditor from "@/components/editor/SmartEditor";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";
import StoryMainMetaFields from "@/components/admin/stories/StoryMainMetaFields";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import StoryTranslationFields from "@/components/admin/stories/StoryTranslationFields";

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

const { data: translations } = await supabase
  .from("translations")
  .select("id, title, body, language_code")
  .eq("parent_type", "story")
  .eq("parent_id", story.id);

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

const translationCn =
  translations?.find((item) => normalizeLang(item.language_code) === "cn") ??
  null;

const translationKr =
  translations?.find((item) => normalizeLang(item.language_code) === "kr") ??
  null;

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, url")
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .eq("media_type", "youtube")
    .maybeSingle();

  const { data: coverMedia } = await supabase
    .from("media_assets")
    .select("id, url")
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .eq("media_type", "image")
    .eq("usage_type", "cover")
    .maybeSingle();

  const { data: relation } = await supabase
    .from("item_relations")
    .select("id, parent_id")
    .eq("child_type", "story")
    .eq("child_id", story.id)
    .eq("relation_type", "card_story")
    .maybeSingle();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .order("sort_order", { ascending: true });

  const { data: appearingCharacterRows } = await supabase
    .from("item_characters")
    .select("character_id")
    .eq("item_type", "story")
    .eq("item_id", story.id);

  const appearingCharacterIds =
    appearingCharacterRows?.map((row) => row.character_id) ?? [];

  let linkedCardSlug = "";

  if (relation?.parent_id) {
    const { data: linkedCard } = await supabase
      .from("cards")
      .select("slug")
      .eq("id", relation.parent_id)
      .maybeSingle();

    linkedCardSlug = linkedCard?.slug ?? "";
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories / Edit</div>
        <h1 className="page-title">스토리 통합 수정</h1>
        <p className="page-desc">
          스토리, 메인 정렬 메타, 공개 범위, 번역, 영상, 카드 연결을 한 화면에서 수정합니다.
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
        <input type="hidden" name="mediaId" value={media?.id ?? ""} />
        <input type="hidden" name="coverMediaId" value={coverMedia?.id ?? ""} />
        <input type="hidden" name="relationId" value={relation?.id ?? ""} />

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
            <span>요약</span>
            <textarea
              name="summary"
              rows={4}
              defaultValue={story.summary ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 링크</span>
            <input
              name="youtubeUrl"
              defaultValue={media?.url ?? ""}
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

          <label className="form-field form-field-full">
            <span>연결 카드</span>
            <input
              name="cardSlug"
              defaultValue={linkedCardSlug}
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>
        </div>

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