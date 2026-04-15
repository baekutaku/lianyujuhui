import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateStoryBundle, deleteStoryBundle } from "@/app/admin/actions";
import SmartEditor from "@/components/editor/SmartEditor";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";

const STORY_SUBTYPE_OPTIONS = [
  { value: "card_story", label: "카드 스토리" },
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
    .select("id, title, slug, subtype, release_year, release_date, summary")
    .eq("slug", slug)
    .maybeSingle();

  if (storyError || !story) {
    notFound();
  }

  const { data: translation } = await supabase
    .from("translations")
    .select("id, title, body")
    .eq("parent_type", "story")
    .eq("parent_id", story.id)
    .eq("is_primary", true)
    .maybeSingle();

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
          스토리, 번역, 영상, 카드 연결을 한 화면에서 수정합니다.
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
        <input type="hidden" name="translationId" value={translation?.id ?? ""} />
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
  autosyncMs={1500}
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