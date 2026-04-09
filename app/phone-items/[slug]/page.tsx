import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/utils/admin-auth";

type PhoneItemDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PhoneItemDetailPage({
  params,
}: PhoneItemDetailPageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const admin = await isAdmin();

  const { data: item, error } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, subtype, release_year, release_date, summary, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[phone-items/[slug]] fetch error:", error);
  }

  if (!item) {
    notFound();
  }

  if (!item.is_published && !admin) {
    notFound();
  }

  return (
    <main>
      <section className="detail-panel story-topbar">
        <div className="story-topbar-main">
          <p className="page-eyebrow">Archive / Phone Items</p>
          <h1 className="story-page-title">{item.title}</h1>

          <div className="meta-row story-top-meta">
            <span className="meta-pill">type: {item.subtype}</span>
            <span className="meta-pill">year: {item.release_year}</span>
            {item.release_date ? (
              <span className="meta-pill">date: {item.release_date}</span>
            ) : null}
            {!item.is_published && admin ? (
              <span className="meta-pill">draft</span>
            ) : null}
          </div>

          <div className="story-top-actions">
            <Link
              href="/phone-items"
              className="story-action-button story-action-muted"
            >
              목록으로
            </Link>

            {admin && (
              <Link
                href={`/admin/phone-items/${item.slug}/edit`}
                className="story-action-button"
              >
                관리자 수정
              </Link>
            )}
          </div>
        </div>

        <aside className="story-topbar-side">
          <div className="story-side-block">
            <h3 className="story-side-title">요약</h3>
            <div className="story-side-links">
              <span className="detail-text">{item.summary || "없음"}</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="detail-panel">
        <h2 className="detail-section-title">휴대폰 콘텐츠</h2>
        <p className="detail-text">
          일단 메타 상세 페이지만 열어둔 상태다. 다음 단계에서
          message / moment / call / video_call / article subtype별 UI를 붙이면 된다.
        </p>
      </section>
    </main>
  );
}