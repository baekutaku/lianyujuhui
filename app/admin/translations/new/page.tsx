import { createServerSupabase } from "@/lib/supabase/server";
const supabase = createServerSupabase();
import { createTranslation } from "@/app/admin/actions";

export default async function NewTranslationPage() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      subtype,
      release_year,
      characters (
        name_ko
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Translations</div>
        <h1 className="page-title">번역 등록</h1>
        <p className="page-desc">
          스토리를 선택하고 번역 제목과 본문을 입력해 등록합니다.
        </p>
      </header>

      <form action={createTranslation} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>story</span>
            <select name="storySlug" required defaultValue="">
              <option value="" disabled>
                스토리를 선택하세요
              </option>
              {stories?.map((story) => {
                const characterName = Array.isArray(story.characters)
                  ? story.characters[0]?.name_ko
                  : (story.characters as { name_ko?: string } | null)?.name_ko;

                return (
                  <option key={story.id} value={story.slug}>
                    [{characterName || "공용"}] [{story.subtype}] [{story.release_year}] {story.title}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" required />
          </label>

          <label className="form-field form-field-full">
            <span>body</span>
            <textarea name="body" rows={14} required />
          </label>
        </div>

        <button type="submit" className="primary-button">
          번역 등록
        </button>
      </form>

      {error && (
        <pre className="error-box" style={{ marginTop: "20px" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
    </main>
  );
}
