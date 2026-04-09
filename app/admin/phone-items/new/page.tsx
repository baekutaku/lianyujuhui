import { createPhoneItem } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewPhoneItemPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items</div>
        <h1 className="page-title">새 휴대폰 콘텐츠 등록</h1>
        <p className="page-desc">
          문자, 모멘트, 전화, 영상통화, 기사 메타 정보를 등록합니다.
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

      <form action={createPhoneItem} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue="message">
              <option value="moment">moment</option>
              <option value="message">message</option>
              <option value="call">call</option>
              <option value="video_call">video_call</option>
              <option value="article">article</option>
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
            <textarea name="summary" rows={5} />
          </label>
        </div>

        <button type="submit" className="primary-button">
          휴대폰 콘텐츠 등록
        </button>
      </form>
    </main>
  );
}