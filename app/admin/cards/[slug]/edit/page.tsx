import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateCard } from "@/app/admin/actions";

type EditCardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { slug } = await params;

  const { data: card, error } = await supabase
    .from("cards")
    .select("id, title, slug, rarity, attribute, release_year, release_date, summary")
    .eq("slug", slug)
    .single();

  if (error || !card) {
    notFound();
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards / Edit</div>
        <h1 className="page-title">카드 수정</h1>
        <p className="page-desc">
          기존 카드 정보를 수정합니다.
        </p>
      </header>

      <form action={updateCard} className="form-panel">
        <input type="hidden" name="cardId" value={card.id} />
        <input type="hidden" name="slug" value={card.slug} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" defaultValue={card.title} required />
          </label>

          <label className="form-field">
            <span>rarity</span>
            <select name="rarity" defaultValue={card.rarity}>
              <option value="nh">nh</option>
              <option value="n">n</option>
              <option value="r">r</option>
              <option value="sr">sr</option>
              <option value="er">er</option>
              <option value="ser">ser</option>
              <option value="ssr">ssr</option>
              <option value="sp">sp</option>
              <option value="ur">ur</option>
            </select>
          </label>

          <label className="form-field">
            <span>attribute</span>
            <select name="attribute" defaultValue={card.attribute}>
              <option value="drive">drive</option>
              <option value="affinity">affinity</option>
              <option value="judgment">judgment</option>
              <option value="creativity">creativity</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={card.release_year}
              required
            />
          </label>

          <label className="form-field">
            <span>release_date</span>
            <input
              name="releaseDate"
              type="date"
              defaultValue={card.release_date ?? ""}
            />
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea
              name="summary"
              rows={5}
              defaultValue={card.summary ?? ""}
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          카드 저장
        </button>
      </form>
    </main>
  );
}
