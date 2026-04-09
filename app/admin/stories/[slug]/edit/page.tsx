import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateStoryBundle, deleteStoryBundle } from "@/app/admin/actions";
import SmartEditor from "@/components/editor/SmartEditor";

type EditStoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ error?: string }>;
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

      <form action={updateStoryBundle} className="form-panel">
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="slug" value={story.slug} />
        <input type="hidden" name="translationId" value={translation?.id ?? ""} />
        <input type="hidden" name="mediaId" value={media?.id ?? ""} />
        <input type="hidden" name="coverMediaId" value={coverMedia?.id ?? ""} />
        <input type="hidden" name="relationId" value={relation?.id ?? ""} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" defaultValue={story.title} required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue={story.subtype}>
              <option value="card_story">card_story</option>
              <option value="asmr">asmr</option>
              <option value="side_story">side_story</option>
              <option value="main_story">main_story</option>
              <option value="behind_story">behind_story</option>
              <option value="xiyue_story">xiyue_story</option>
              <option value="myhome_story">myhome_story</option>
              <option value="company_project">company_project</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={story.release_year}
              required
            />
          </label>

          <label className="form-field">
            <span>release_date</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={story.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea
              name="summary"
              rows={4}
              defaultValue={story.summary ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>youtube url</span>
            <input
              name="youtubeUrl"
              defaultValue={media?.url ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>cover image url</span>
            <input
              name="coverImageUrl"
              defaultValue={coverMedia?.url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>translation title</span>
            <input
              name="translationTitle"
              defaultValue={translation?.title ?? ""}
            />
          </label>

          <SmartEditor
            name="translationBody"
            label="translation body"
            initialValue={translation?.body ?? ""}
            height="700px"
          />

          <label className="form-field form-field-full">
            <span>linked card</span>
            <input
              name="cardSlug"
              defaultValue={linkedCardSlug}
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          스토리 통합 저장
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
        <Link href={`/stories/${story.slug}`} className="nav-link">
          공개 보기
        </Link>

        <Link href="/admin/stories" className="nav-link">
          목록으로
        </Link>

        <form action={deleteStoryBundle}>
          <input type="hidden" name="storyId" value={story.id} />
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