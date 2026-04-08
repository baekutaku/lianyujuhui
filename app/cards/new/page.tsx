import { createCard } from "@/app/admin/actions";

export default function NewCardPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">카드 등록</h1>
        <p className="page-desc">
          새 카드 메타 정보를 등록합니다.
        </p>
      </header>

      <form action={createCard} className="form-panel">
        <div className="form-grid">
          <label className="form-field">
            <span>content_id</span>
            <input name="contentId" required />
          </label>

          <label className="form-field">
            <span>origin_key</span>
            <input name="originKey" required />
          </label>

          <label className="form-field">
            <span>title</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>slug</span>
            <input name="slug" required />
          </label>

          <label className="form-field">
            <span>rarity</span>
            <select name="rarity" defaultValue="ssr">
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
            <select name="attribute" defaultValue="affinity">
              <option value="drive">drive</option>
              <option value="affinity">affinity</option>
              <option value="judgment">judgment</option>
              <option value="creativity">creativity</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input name="releaseYear" type="number" defaultValue={2025} required />
          </label>

          <label className="form-field">
            <span>release_date</span>
            <input name="releaseDate" type="date" />
          </label>

          <label className="form-field">
            <span>server</span>
            <select name="serverKey" defaultValue="kr">
              <option value="kr">kr</option>
              <option value="cn">cn</option>
            </select>
          </label>

          <label className="form-field">
            <span>character</span>
            <select name="characterKey" defaultValue="baiqi">
              <option value="baiqi">baiqi</option>
              <option value="lizeyan">lizeyan</option>
              <option value="zhouqiluo">zhouqiluo</option>
              <option value="lingxiao">lingxiao</option>
              <option value="xumo">xumo</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea name="summary" rows={4} />
          </label>
        </div>

        <button type="submit" className="primary-button">
          카드 등록
        </button>
      </form>
    </main>
  );
}
