import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { deletePhoneItem } from "@/app/admin/actions";

export default async function AdminPhoneItemsPage() {
  const { data: phoneItems, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, release_year, release_date, is_published")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items</div>
        <h1 className="page-title">휴대폰 콘텐츠 관리</h1>
        <p className="page-desc">
          문자, 모멘트, 전화, 영상통화, 기사 콘텐츠를 관리합니다.
        </p>
      </header>

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/admin/phone-items/new" className="primary-button">
          새 휴대폰 콘텐츠 등록
        </Link>

        <Link
          href="/phone-items"
          className="nav-link"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          공개 휴대폰 목록 보기
        </Link>
      </div>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!phoneItems || phoneItems.length === 0 ? (
        <div className="empty-box">등록된 휴대폰 콘텐츠가 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {phoneItems.map((item) => (
            <li key={item.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">{item.title}</h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">type: {item.subtype}</span>
                  <span className="meta-pill">year: {item.release_year}</span>
                  <span className="meta-pill">slug: {item.slug}</span>
                  <span className="meta-pill">
                    published: {item.is_published ? "true" : "false"}
                  </span>
                  {item.release_date ? (
                    <span className="meta-pill">date: {item.release_date}</span>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/phone-items/${item.slug}/edit`}
                    className="primary-button"
                    style={{ marginTop: 0 }}
                  >
                    수정하기
                  </Link>

                  <Link href={`/phone-items/${item.slug}`} className="nav-link">
                    공개 페이지 보기
                  </Link>

                  <form action={deletePhoneItem}>
                    <input type="hidden" name="phoneItemId" value={item.id} />
                    <button
                      type="submit"
                      className="nav-link"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      삭제하기
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}