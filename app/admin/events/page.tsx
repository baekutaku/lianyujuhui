import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default async function AdminEventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, slug, subtype, release_year, start_date, end_date, is_published")
    .order("created_at", { ascending: false });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Events</div>
        <h1 className="page-title">이벤트 관리</h1>
        <p className="page-desc">
          등록된 이벤트를 확인하고 수정할 수 있습니다.
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
        <Link href="/admin/events/new" className="primary-button">
          새 이벤트 등록
        </Link>

        <Link
          href="/events"
          className="nav-link"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          공개 이벤트 목록 보기
        </Link>
      </div>

      {error && (
        <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
      )}

      {!events || events.length === 0 ? (
        <div className="empty-box">등록된 이벤트가 없습니다.</div>
      ) : (
        <ul className="list-grid">
          {events.map((event) => (
            <li key={event.id}>
              <div className="archive-card">
                <h2 className="archive-card-title">{event.title}</h2>

                <div className="meta-row" style={{ marginBottom: "14px" }}>
                  <span className="meta-pill">type: {event.subtype}</span>
                  <span className="meta-pill">year: {event.release_year}</span>
                  <span className="meta-pill">slug: {event.slug}</span>
                  <span className="meta-pill">
                    published: {event.is_published ? "true" : "false"}
                  </span>
                  {event.start_date ? (
                    <span className="meta-pill">start: {event.start_date}</span>
                  ) : null}
                  {event.end_date ? (
                    <span className="meta-pill">end: {event.end_date}</span>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/events/${event.slug}/edit`}
                    className="primary-button"
                    style={{ marginTop: 0 }}
                  >
                    수정하기
                  </Link>

                  <Link href={`/events/${event.slug}`} className="nav-link">
                    공개 페이지 보기
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