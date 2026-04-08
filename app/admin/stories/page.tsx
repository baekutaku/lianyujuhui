import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { deleteStoryBundle } from "@/app/admin/actions";

export default async function AdminStoriesPage() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories</div>
        <h1 className="page-title">스토리 관리</h1>
        <p className="page-desc">
          등록된 스토리를 확인하고 수정/삭제할 수 있습니다.
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
        <Link href="/admin/stories/new" className="primary-button">
          새 스토리 등록
        </Link>

        <Link
          href="/stories"
          className="nav-link"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          공개 스토리 목록 보기
        </Link>
      </div>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!stories || stories.length === 0 ? (
        <div className="empty-box">등록된 스토리가 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {stories.map((story) => (
            <li key={story.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">{story.title}</h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">type: {story.subtype}</span>
                  <span className="meta-pill">year: {story.release_year}</span>
                  <span className="meta-pill">slug: {story.slug}</span>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/stories/${story.slug}/edit`}
                    className="primary-button"
                    style={{ marginTop: 0 }}
                  >
                    수정하기
                  </Link>

                  <Link href={`/stories/${story.slug}`} className="nav-link">
                    공개 페이지 보기
                  </Link>

                  <form action={deleteStoryBundle}>
                    <input type="hidden" name="storyId" value={story.id} />
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
