import { unlockProtectedStory } from "@/app/stories/[slug]/actions";

type Props = {
  slug: string;
  title: string;
  hint?: string | null;
};

export default function ProtectedStoryGate({ slug, title, hint }: Props) {
  return (
    <main>
      <section className="page-header">
        <div className="page-eyebrow">Protected Story</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">이 스토리는 비밀번호가 있어야 열람할 수 있습니다.</p>
      </section>

      <section className="detail-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <strong>비밀번호 보호 글</strong>
            <p style={{ margin: 0, color: "var(--text-sub)" }}>
              비밀번호를 입력하면 이 기기에서 계속 열람할 수 있습니다.
            </p>
          </div>

          {hint ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                background: "rgba(248, 245, 251, 0.96)",
                border: "1px solid rgba(222, 213, 228, 0.72)",
                color: "var(--text-sub)",
              }}
            >
              힌트: {hint}
            </div>
          ) : null}

          <form action={unlockProtectedStory} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="slug" value={slug} />

            <input
              type="password"
              name="password"
              placeholder="비밀번호 입력"
              autoComplete="off"
              className="story-toolbar-search"
            />

            <button type="submit" className="primary-button">
              열람하기
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}