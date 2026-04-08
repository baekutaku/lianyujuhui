import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

function extractYoutubeVideoId(url: string) {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function getYoutubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default async function EventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, subtype, release_year, start_date, end_date, is_published, thumbnail_url"
    )
    .eq("is_published", true)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  const eventIds = (events ?? []).map((event) => event.id);

  let mediaMap = new Map<
    string,
    {
      media_type: string;
      url: string | null;
      youtube_video_id: string | null;
      usage_type: string | null;
      is_primary: boolean | null;
      sort_order: number | null;
    }
  >();

  if (eventIds.length > 0) {
    const { data: media } = await supabase
      .from("media_assets")
      .select(
        "parent_id, media_type, url, youtube_video_id, usage_type, is_primary, sort_order"
      )
      .eq("parent_type", "event")
      .in("parent_id", eventIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    for (const item of media ?? []) {
      if (!mediaMap.has(item.parent_id)) {
        mediaMap.set(item.parent_id, item);
      }
    }
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive / Events</div>
        <h1 className="page-title">이벤트</h1>
        <p className="page-desc">
          생일, N주년, 일반 이벤트, 복귀 이벤트 등의 아카이브입니다.
        </p>
      </header>

      {error && (
        <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
      )}

      {!events || events.length === 0 ? (
        <div className="empty-box">등록된 이벤트가 없습니다.</div>
      ) : (
        <ul className="story-thumb-grid">
          {events.map((event) => {
            const media = mediaMap.get(event.id);

            let imageUrl = event.thumbnail_url || "";

            if (!imageUrl && media) {
              if (media.media_type === "image" && media.url) {
                imageUrl = media.url;
              } else if (media.media_type === "youtube") {
                const videoId =
                  media.youtube_video_id ||
                  (media.url ? extractYoutubeVideoId(media.url) : null);

                if (videoId) {
                  imageUrl = getYoutubeThumbnail(videoId);
                }
              }
            }

            return (
              <li key={event.id} className="story-thumb-card">
                <Link href={`/events/${event.slug}`} className="story-thumb-link">
                  <div className="story-thumb-media">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={event.title}
                        className="story-thumb-image"
                      />
                    ) : (
                      <div className="story-thumb-empty">NO IMAGE</div>
                    )}
                  </div>

                  <div className="story-thumb-body">
                    <h2 className="story-thumb-title">{event.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "12px" }}>
                      <span className="meta-pill">type: {event.subtype}</span>
                      <span className="meta-pill">year: {event.release_year}</span>
                      {event.start_date ? (
                        <span className="meta-pill">start: {event.start_date}</span>
                      ) : null}
                      {event.end_date ? (
                        <span className="meta-pill">end: {event.end_date}</span>
                      ) : null}
                    </div>

                    <div className="story-list-footer">
                      <span className="mini-button">상세 보기</span>
                    </div>
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