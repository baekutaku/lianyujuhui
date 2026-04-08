import { createCard } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewCardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">새 카드 등록</h1>
        <p className="page-desc">
          카드 기본 정보와 썸네일/대표 이미지를 등록합니다.
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

      <form action={createCard} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" required />
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
            <span>thumbnail url</span>
            <input name="thumbnailUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>cover image url</span>
            <input name="coverImageUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>thumbnail after url (optional)</span>
            <input name="thumbnailAfterUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>cover after url (optional)</span>
            <input name="coverAfterUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea name="summary" rows={5} />
          </label>
        </div>

        <button type="submit" className="primary-button">
          카드 등록
        </button>
      </form>
    </main>
  );
}