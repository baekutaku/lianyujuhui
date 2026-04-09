import { createBulkRelation } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewRelationPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Relations</div>
        <h1 className="page-title">새 연결 등록</h1>
        <p className="page-desc">
          부모 콘텐츠 1개와 자식 콘텐츠 여러 개를 slug 기준으로 한 번에 연결합니다.
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

      <form action={createBulkRelation} className="form-panel">
        <div className="form-grid">
          <label className="form-field">
            <span>parent type</span>
            <select name="parentType" defaultValue="card" required>
              <option value="card">card</option>
              <option value="story">story</option>
              <option value="event">event</option>
              <option value="phone_item">phone_item</option>
            </select>
          </label>

          <label className="form-field">
            <span>child type</span>
            <select name="childType" defaultValue="story" required>
              <option value="story">story</option>
              <option value="event">event</option>
              <option value="phone_item">phone_item</option>
              <option value="card">card</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>parent slug</span>
            <input
              name="parentSlug"
              required
              placeholder="예: kr-2026-ssr-baiqi-some-card"
            />
          </label>

          <label className="form-field">
            <span>relation type</span>
            <select name="relationType" defaultValue="card_story" required>
              <option value="card_story">card_story</option>
              <option value="card_phone">card_phone</option>
              <option value="related_event">related_event</option>
              <option value="related_story">related_story</option>
              <option value="related_card">related_card</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>child slugs (줄바꿈으로 여러 개 입력)</span>
            <textarea
              name="childSlugs"
              rows={10}
              required
              placeholder={`예:
kr-2026-card-story-baiqi-something
kr-2026-message-baiqi-something
kr-2026-event-baiqi-something`}
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          연결 저장
        </button>
      </form>
    </main>
  );
}