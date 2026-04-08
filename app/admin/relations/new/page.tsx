import { supabase } from "@/lib/supabase/client";
import { createCardStoryRelation } from "@/app/admin/actions";

export default async function NewRelationPage() {
  const { data: cards, error: cardsError } = await supabase
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

  const { data: stories, error: storiesError } = await supabase
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
        <div className="page-eyebrow">Admin / Relations</div>
        <h1 className="page-title">카드-스토리 연결</h1>
        <p className="page-desc">
          카드와 스토리를 선택해서 연결합니다.
        </p>
      </header>

      <form action={createCardStoryRelation} className="form-panel">
        <div className="form-grid">
          <label className="form-field">
            <span>card</span>
            <select name="cardSlug" required defaultValue="">
              <option value="" disabled>
                카드를 선택하세요
              </option>
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

          <label className="form-field">
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
        </div>

        <button type="submit" className="primary-button">
          카드-스토리 연결
        </button>
      </form>

      {cardsError && (
        <pre className="error-box" style={{ marginTop: "20px" }}>
          {JSON.stringify(cardsError, null, 2)}
        </pre>
      )}

      {storiesError && (
        <pre className="error-box" style={{ marginTop: "20px" }}>
          {JSON.stringify(storiesError, null, 2)}
        </pre>
      )}
    </main>
  );
}
