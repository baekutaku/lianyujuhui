import SmartEditor from "@/components/editor/SmartEditor";
import { createEventBundle } from "@/app/admin/actions";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const EVENT_SUBTYPE_OPTIONS = [
  { value: "birthday_baiqi", label: "캐릭터 생일" },
  { value: "birthday_mc", label: "유저 생일" },
  { value: "anniversary_event", label: "N주년" },
  { value: "game_event", label: "명절 / 기념일" },
  { value: "seasonal_event", label: "시즌 이벤트" },
  { value: "game_event", label: "콜라보" },
  { value: "return_event", label: "복귀 이벤트" },
] as const;

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
            <span>제목</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue="seasonal_event">
              {EVENT_SUBTYPE_OPTIONS.map((item) => (
                <option
                  key={`${item.value}-${item.label}`}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>연도</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={2025}
              required
            />
          </label>

          <label className="form-field">
            <span>시작일</span>
            <input name="startDate" type="date" />
          </label>

          <label className="form-field">
            <span>종료일</span>
            <input name="endDate" type="date" />
          </label>

          <label className="form-field">
            <span>서버</span>
            <select name="serverKey" defaultValue="kr">
              <option value="kr">kr</option>
              <option value="cn">cn</option>
            </select>
          </label>

          <label className="form-field">
            <span>캐릭터</span>
            <select name="characterKey" defaultValue="baiqi">
              <option value="baiqi">baiqi</option>
              <option value="lizeyan">lizeyan</option>
              <option value="zhouqiluo">zhouqiluo</option>
              <option value="lingxiao">lingxiao</option>
              <option value="xumo">xumo</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
            <textarea name="summary" rows={4} />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="예: 생일, 한정, 복각"
            />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 URL</span>
            <input
              name="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 URL</span>
            <input
              name="thumbnailUrl"
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>번역 제목</span>
            <input name="translationTitle" />
          </label>

          <SmartEditor
            name="translationBody"
            label="번역 본문"
            initialValue=""
            height="700px"
          />

          <label className="form-field form-field-full">
            <span>연결 카드 slug (선택)</span>
            <input
              name="cardSlug"
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>

          <label className="form-field form-field-full">
            <span>연결 이벤트 slug (선택)</span>
            <input
              name="relatedEventSlug"
              placeholder="예: 2025-anniversary-event"
            />
          </label>
        </div>

        <StoryVisibilityFields
          values={{
            visibility: "public",
            access_hint: "",
          }}
        />

        <button type="submit" className="primary-button">
          이벤트 통합 등록
        </button>
      </form>
    </main>
  );
}