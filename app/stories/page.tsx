import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";

type StoryCard = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number;
  release_date: string | null;
};

type StoryThumb = {
  parent_id: string;
  media_type: string;
  usage_type: string | null;
  url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    year?: string;
    subtype?: string;
  }>;
};

export default async function StoriesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const q = String(resolvedSearchParams?.q || "").trim();
  const year = String(resolvedSearchParams?.year || "").trim();
  const subtype = String(resolvedSearchParams?.subtype || "").trim();

  const admin = await isAdmin();

  let query = supabase
    .from("stories")
    .select("id, title, slug, subtype, release_year, release_date")
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("release_date", { ascending: false })
    .order("title", { ascending: true });

  if (q) {
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  if (year && !Number.isNaN(Number(year))) {
    query = query.eq("release_year", Number(year));
  }

  if (subtype) {
    query = query.eq("subtype", subtype);
  }

  const { data: stories, error } = await query;

  const storyIds = (stories ?? []).map((story) => story.id);
  const mediaMap = new Map<string, string>();

  if (storyIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from("media_assets")
      .select(
        "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, is_primary, sort_order"
      )
      .eq("parent_type", "story")
      .in("parent_id", storyIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    const grouped = new Map<string, StoryThumb[]>();

    (mediaAssets as StoryThumb[] | null)?.forEach((media) => {
      const arr = grouped.get(media.parent_id) ?? [];
      arr.push(media);
      grouped.set(media.parent_id, arr);
    });

    grouped.forEach((items, storyId) => {
      const coverImage = items.find(
        (media) => media.media_type === "image" && media.usage_type === "cover"
      );

      const normalImage = items.find((media) => media.media_type === "image");

      const youtubeMedia = items.find((media) => media.media_type === "youtube");

      let thumb = "";

      if (coverImage?.url) {
        thumb = coverImage.url;
      } else if (normalImage?.url) {
        thumb = normalImage.url;
      } else if (youtubeMedia) {
        thumb =
          youtubeMedia.thumbnail_url ||
          (youtubeMedia.youtube_video_id
            ? `https://img.youtube.com/vi/${youtubeMedia.youtube_video_id}/hqdefault.jpg`
            : "");
      }

      if (thumb) {
        mediaMap.set(storyId, thumb);
      }
    });
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Stories</div>
        <h1 className="page-title">스토리 아카이브</h1>
        <p className="page-desc">
          카드 스토리와 번역 중심으로 정리된 스토리 목록입니다.
        </p>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 18,
          }}
        >
          <form
            method="get"
            action="/stories"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="제목 / slug 검색"
              style={{
                minWidth: 220,
                flex: "1 1 240px",
                height: 42,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid rgba(190, 205, 222, 0.7)",
                background: "rgba(255,255,255,0.72)",
              }}
            />

            <input
              type="number"
              name="year"
              defaultValue={year}
              placeholder="연도"
              style={{
                width: 120,
                height: 42,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid rgba(190, 205, 222, 0.7)",
                background: "rgba(255,255,255,0.72)",
              }}
            />

            <select
              name="subtype"
              defaultValue={subtype}
              style={{
                width: 180,
                height: 42,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid rgba(190, 205, 222, 0.7)",
                background: "rgba(255,255,255,0.72)",
              }}
            >
              <option value="">전체 유형</option>
              <option value="card_story">카드 스토리</option>
              <option value="main_story">메인스토리</option>
              <option value="event_story">이벤트 스토리</option>
              <option value="side_story">외전</option>
            </select>

            <button type="submit" className="primary-button">
              검색
            </button>

            <Link href="/stories" className="nav-link">
              초기화
            </Link>
          </form>

          {admin ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href="/admin/stories/new" className="primary-button">
                새 스토리 등록
              </Link>

              <Link href="/admin/stories" className="nav-link">
                스토리 관리
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      {error && (
        <pre className="error-box">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!stories || stories.length === 0 ? (
        <div className="empty-box">등록된 스토리가 없습니다.</div>
      ) : (
        <ul className="story-thumb-grid">
          {(stories as StoryCard[]).map((story) => {
            const thumb = mediaMap.get(story.id);

            return (
              <li key={story.id} className="story-thumb-card">
                <Link href={`/stories/${story.slug}`} className="story-thumb-link">
                  <div className="story-thumb-media">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={story.title}
                        className="story-thumb-image"
                      />
                    ) : (
                      <div className="story-thumb-empty">NO IMAGE</div>
                    )}
                  </div>

                  <div className="story-thumb-body">
                    <h2 className="story-thumb-title">{story.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "12px" }}>
                      <span className="meta-pill">type: {story.subtype}</span>
                      <span className="meta-pill">year: {story.release_year}</span>
                    </div>

                    <span className="mini-button">상세 보기</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}