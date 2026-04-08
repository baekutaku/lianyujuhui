import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default async function AdminRelationsPage() {
  const { data: relations, error } = await supabase
    .from("item_relations")
    .select("id, parent_type, parent_id, child_type, child_id, relation_type, created_at")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Relations</div>
        <h1 className="page-title">연결 관리</h1>
        <p className="page-desc">
          카드와 스토리 등 콘텐츠 간 연결 관계를 확인하고 새 연결을 추가할 수 있습니다.
        </p>
      </header>

      <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/admin/relations/new" className="primary-button">
          새 연결 등록
        </Link>
      </div>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!relations || relations.length === 0 ? (
        <div className="empty-box">등록된 연결이 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {relations.map((relation) => (
            <li key={relation.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">{relation.relation_type}</h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">parent: {relation.parent_type}</span>
                  <span className="meta-pill">child: {relation.child_type}</span>
                </div>

                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "13px",
                    color: "var(--text-soft)",
                    wordBreak: "break-all",
                  }}
                >
                  parent_id: {relation.parent_id}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--text-soft)",
                    wordBreak: "break-all",
                  }}
                >
                  child_id: {relation.child_id}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
