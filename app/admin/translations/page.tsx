import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
const supabase = createServerSupabase();

export default async function AdminTranslationsPage() {
  const { data: translations, error } = await supabase
    .from("translations")
    .select("id, title, parent_type, parent_id, translation_type, created_at")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Translations</div>
        <h1 className="page-title">번역 관리</h1>
        <p className="page-desc">
          등록된 번역 목록을 확인하고 수정 페이지로 이동할 수 있습니다.
        </p>
      </header>

      <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/admin/translations/new" className="primary-button">
          새 번역 등록
        </Link>
      </div>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!translations || translations.length === 0 ? (
        <div className="empty-box">등록된 번역이 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {translations.map((translation) => (
            <li key={translation.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">
                  {translation.title || "제목 없음"}
                </h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">type: {translation.translation_type}</span>
                  <span className="meta-pill">parent: {translation.parent_type}</span>
                </div>

                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    color: "var(--text-soft)",
                    wordBreak: "break-all",
                  }}
                >
                  parent_id: {translation.parent_id}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/translations/${translation.id}/edit`}
                    className="primary-button"
                    style={{ marginTop: 0 }}
                  >
                    수정하기
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
