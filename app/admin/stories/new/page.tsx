import { createStoryBundle } from "@/app/admin/actions";
import SmartEditor from "@/components/editor/SmartEditor";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories</div>
        <h1 className="page-title">스토리 통합 등록</h1>
        <p className="page-desc">
          스토리 기본 정보, 번역, 영상, 카드 연결을 한 화면에서 등록합니다.
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

      <form action={createStoryBundle} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue="card_story">
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
              defaultValue={2025}
              required
            />
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

          <label className="form-field form-field-full">
            <span>youtube url</span>
            <input
              name="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>cover image url</span>
            <input
              name="coverImageUrl"
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>translation title</span>
            <input name="translationTitle" />
          </label>

<SmartEditor
  name="translationBody"
  label="translation body"
  initialValue=""
  height={700}
/>

          <label className="form-field form-field-full">
            <span>linked card slug (optional)</span>
            <input
              name="cardSlug"
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          스토리 통합 등록
        </button>
      </form>
    </main>
  );
}