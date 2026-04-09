import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default async function PhoneItemsPage() {
  const { data: phoneItems, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, release_year, release_date")
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Phone Items</div>
        <h1 className="page-title">휴대폰 콘텐츠</h1>
        <p className="page-desc">
          문자, 모멘트, 전화, 영상통화, 기사 아카이브입니다.
        </p>
      </header>

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
              <Link href={`/phone-items/${item.slug}`} className="archive-card-link">
                <div className="archive-card story-list-card">
                  <div>
                    <h2 className="story-list-title">{item.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "12px" }}>
                      <span className="meta-pill">type: {item.subtype}</span>
                      <span className="meta-pill">year: {item.release_year}</span>
                      {item.release_date ? (
                        <span className="meta-pill">date: {item.release_date}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="story-list-footer">
                    <span className="mini-button">상세 보기</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}