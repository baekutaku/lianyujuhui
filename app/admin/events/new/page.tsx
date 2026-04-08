import SmartEditor from "@/components/editor/SmartEditor";
import { createEventBundle } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Events</div>
        <h1 className="page-title">이벤트 통합 등록</h1>
        <p className="page-desc">
          이벤트 기본 정보, 번역, 영상, 관련 카드/이벤트 연결을 한 화면에서 등록합니다.
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

      <form action={createEventBundle} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue="game_event">
              <option value="return_event">return_event</option>
              <option value="birthday_baiqi">birthday_baiqi</option>
              <option value="birthday_mc">birthday_mc</option>
              <option value="game_event">game_event</option>
              <option value="anniversary_event">anniversary_event</option>
              <option value="seasonal_event">seasonal_event</option>
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
            <span>start_date</span>
            <input name="startDate" type="date" />
          </label>

          <label className="form-field">
            <span>end_date</span>
            <input name="endDate" type="date" />
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
            <span>thumbnail url</span>
            <input
              name="thumbnailUrl"
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
            height="700px"
          />

          <label className="form-field form-field-full">
            <span>linked card slug (optional)</span>
            <input
              name="cardSlug"
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>

          <label className="form-field form-field-full">
            <span>linked event slug (optional)</span>
            <input
              name="relatedEventSlug"
              placeholder="예: 2025-anniversary-event"
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          이벤트 통합 등록
        </button>
      </form>
    </main>
  );
}