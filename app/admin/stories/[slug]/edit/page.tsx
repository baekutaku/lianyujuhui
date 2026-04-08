import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateStoryBundle } from "@/app/admin/actions";
import TiptapEditor from "@/components/editor/StoryRichEditor";


type EditStoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const { slug } = await params;

  const { data: story, error } = await supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year, release_date, summary")
    .eq("slug", slug)
    .single();

  if (error || !story) {
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

  const { data: relation } = await supabase
    .from("item_relations")
    .select("id, parent_id")
    .eq("child_type", "story")
    .eq("child_id", story.id)
    .eq("relation_type", "card_story")
    .maybeSingle();

  const { data: cards } = await supabase
    .from("cards")
    .select(`
      id,
      title,
      slug,
      rarity,
      release_year,
      characters (
        name_ko
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  let linkedCardSlug = "";

  if (relation?.parent_id) {
    const { data: linkedCard } = await supabase
      .from("cards")
      .select("slug")
      .eq("id", relation.parent_id)
      .single();

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

      <form action={updateStoryBundle} className="form-panel">
        <input type="hidden" name="storyId" value={story.id} />
        <input type="hidden" name="slug" value={story.slug} />
        <input type="hidden" name="translationId" value={translation?.id ?? ""} />
        <input type="hidden" name="mediaId" value={media?.id ?? ""} />
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
            <span>translation title</span>
            <input
              name="translationTitle"
              defaultValue={translation?.title ?? ""}
            />
          </label>
<TiptapEditor
  name="translationBody"
  label="translation body"
  initialValue={translation?.body ?? ""}
/>



          <label className="form-field form-field-full">
            <span>linked card</span>
            <select name="cardSlug" defaultValue={linkedCardSlug}>
              <option value="">선택 안 함</option>
              {cards?.map((card) => {
                const characterName = Array.isArray(card.characters)
                  ? card.characters[0]?.name_ko
                  : (card.characters as { name_ko?: string } | null)?.name_ko;

                return (
                  <option key={card.id} value={card.slug}>
                    [{characterName || "공용"}] [{card.rarity}] [{card.release_year}] {card.title}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <button type="submit" className="primary-button">
          스토리 통합 저장
        </button>
      </form>
    </main>
  );
}
