type Props = {
  values?: {
    visibility?: string | null;
    access_hint?: string | null;
  };
};

export default function StoryVisibilityFields({ values = {} }: Props) {
  return (
    <section className="admin-form-section">
      <div className="admin-form-section-head">
        <h3>공개 범위</h3>
        <p>기본은 공개, 비밀번호 보호 또는 관리자 전용 비공개 가능</p>
      </div>

      <div className="admin-form-grid two-column">
        <label className="admin-form-field">
          <span>공개 범위</span>
          <select name="visibility" defaultValue={values.visibility ?? "public"}>
            <option value="public">공개</option>
            <option value="protected">비밀번호 보호</option>
            <option value="private">비공개 (관리자만)</option>
          </select>
        </label>

        <label className="admin-form-field">
          <span>비밀번호</span>
          <input
            type="text"
            name="accessPassword"
            placeholder="예: 0740"
            autoComplete="off"
          />
        </label>

        <label className="admin-form-field">
          <span>비밀번호 힌트</span>
          <input
            type="text"
            name="accessHint"
            defaultValue={values.access_hint ?? ""}
            placeholder="선택사항"
          />
        </label>
      </div>

      <div className="admin-form-help">
        <p>공개: 누구나 열람 가능</p>
        <p>비밀번호 보호: 목록에는 보이고, 상세 진입 시 비밀번호 필요</p>
        <p>비공개: 관리자만 확인</p>
        <p>비밀번호를 바꾸고 싶으면 새 비밀번호를 입력하면 됨</p>
      </div>
    </section>
  );
}