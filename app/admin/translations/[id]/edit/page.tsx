import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
const supabase = createServerSupabase();
import { updateTranslation } from "@/app/admin/actions";

type EditTranslationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTranslationPage({
  params,
}: EditTranslationPageProps) {
  const { id } = await params;

  const { data: translation, error } = await supabase
    .from("translations")
    .select("id, title, body, parent_type, parent_id")
    .eq("id", id)
    .single();

  if (error || !translation) {
    notFound();
  }

  let storySlug = "";

  if (translation.parent_type === "story") {
    const { data: story } = await supabase
      .from("stories")
      .select("slug")
      .eq("id", translation.parent_id)
      .single();

    storySlug = story?.slug ?? "";
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Translations / Edit</div>
        <h1 className="page-title">번역 수정</h1>
        <p className="page-desc">
          기존 번역 제목과 본문을 수정합니다.
        </p>
      </header>

      <form action={updateTranslation} className="form-panel">
        <input type="hidden" name="translationId" value={translation.id} />
        <input type="hidden" name="storySlug" value={storySlug} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input
              name="title"
              defaultValue={translation.title ?? ""}
              required
            />
          </label>

          <label className="form-field form-field-full">
            <span>body</span>
            <textarea
              name="body"
              rows={16}
              defaultValue={translation.body ?? ""}
              required
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          번역 저장
        </button>
      </form>
    </main>
  );
}
