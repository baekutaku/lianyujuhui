import {
  createSiteUpdate,
  deleteSiteUpdate,
  updateSiteUpdate,
} from "@/app/admin/actions";
import { supabase } from "@/lib/supabase/server";

type AdminUpdatesPageProps = {
  searchParams?: Promise<{
    error?: string;
    saved?: string;
  }>;
};

const UPDATE_CATEGORY_OPTIONS = [
  { value: "update", label: "업데이트" },
  { value: "fix", label: "수정" },
  { value: "notice", label: "공지" },
  { value: "todo", label: "예정" },
] as const;

const UPDATE_TARGET_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "home", label: "홈" },
  { value: "cards", label: "카드" },
  { value: "stories", label: "스토리" },
  { value: "events", label: "이벤트" },
  { value: "phone", label: "휴대폰" },
  { value: "maker", label: "커스텀" },
  { value: "admin", label: "관리자" },
] as const;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default async function AdminUpdatesPage({
  searchParams,
}: AdminUpdatesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";
  const saved = params?.saved === "1";

  const { data: updates } = await supabase
    .from("site_updates")
    .select(
      "id, title, body, category, target_area, is_published, is_pinned, published_at, created_at"
    )
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Site Updates</div>
        <h1 className="page-title">사이트 업데이트 관리</h1>
        <p className="page-desc">
          홈 화면 업데이트 모달에 표시할 운영 로그를 작성합니다.
        </p>
      </header>

      {error ? (
        <p className="error-box" style={{ marginBottom: 16 }}>
          {safeDecode(error)}
        </p>
      ) : null}

      {saved ? (
        <p
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(232, 249, 239, 0.96)",
            border: "1px solid rgba(139, 211, 169, 0.5)",
            color: "#4e8d66",
            fontWeight: 800,
          }}
        >
          저장되었습니다.
        </p>
      ) : null}

      <form action={createSiteUpdate} className="form-panel">
        <div className="form-grid">
          <label className="form-field">
            <span>제목</span>
            <input name="title" required placeholder="예: 휴대폰 UI 수정" />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="category" defaultValue="update">
              {UPDATE_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>대상 영역</span>
            <select name="targetArea" defaultValue="all">
              {UPDATE_TARGET_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>표시 날짜</span>
            <input name="publishedAt" type="datetime-local" />
          </label>

          <label className="form-field">
            <span>공개 여부</span>
            <select name="isPublished" defaultValue="true">
              <option value="true">공개</option>
              <option value="false">비공개</option>
            </select>
          </label>

          <label className="form-field">
            <span>상단 고정</span>
            <select name="isPinned" defaultValue="false">
              <option value="false">일반</option>
              <option value="true">고정</option>
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>본문</span>
            <textarea
              name="body"
              rows={8}
              required
              placeholder={`예:
- 홈 메인 레이아웃 색감 수정
- 휴대폰 UI 모바일 대응
- 모멘트 상세페이지 CSS 정리`}
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          업데이트 등록
        </button>
      </form>

      <section className="detail-shell" style={{ marginTop: 24 }}>
        {(updates ?? []).map((item: any) => (
          <article key={item.id} className="form-panel">
            <form action={updateSiteUpdate}>
              <input type="hidden" name="updateId" value={item.id} />

              <div className="form-grid">
                <label className="form-field">
                  <span>제목</span>
                  <input name="title" defaultValue={item.title} required />
                </label>

                <label className="form-field">
                  <span>카테고리</span>
                  <select name="category" defaultValue={item.category ?? "update"}>
                    {UPDATE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>대상 영역</span>
                  <select name="targetArea" defaultValue={item.target_area ?? "all"}>
                    {UPDATE_TARGET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>표시 날짜</span>
                  <input
                    name="publishedAt"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(item.published_at)}
                  />
                </label>

                <label className="form-field">
                  <span>공개 여부</span>
                  <select
                    name="isPublished"
                    defaultValue={item.is_published ? "true" : "false"}
                  >
                    <option value="true">공개</option>
                    <option value="false">비공개</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>상단 고정</span>
                  <select
                    name="isPinned"
                    defaultValue={item.is_pinned ? "true" : "false"}
                  >
                    <option value="false">일반</option>
                    <option value="true">고정</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>본문</span>
                  <textarea
                    name="body"
                    rows={7}
                    defaultValue={item.body}
                    required
                  />
                </label>
              </div>

              <button type="submit" className="primary-button">
                수정 저장
              </button>
            </form>

            <form action={deleteSiteUpdate} style={{ marginTop: 10 }}>
              <input type="hidden" name="updateId" value={item.id} />
              <button
                type="submit"
                className="nav-link story-action-danger"
                style={{ cursor: "pointer" }}
              >
                삭제
              </button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}