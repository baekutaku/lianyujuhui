"use client";

import { useMemo, useState } from "react";

type StoryMediaItem = {
  id: string;
  media_type: string;
  usage_type: string | null;
  url: string;
  youtube_video_id?: string | null;
  title?: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
};

type Props = {
  storyTitle: string;
  media: StoryMediaItem[];
};

function getYoutubeEmbedUrl(item: StoryMediaItem) {
  if (item.youtube_video_id) {
    return `https://www.youtube.com/embed/${item.youtube_video_id}`;
  }

  const value = item.url.trim();
  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const shortsMatch = value.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (shortsMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  if (value.includes("/embed/")) return value;
  return value;
}

export default function StoryMediaSwitcher({ storyTitle, media }: Props) {
  const mediaCn =
    media.find((item) => item.media_type === "youtube" && item.usage_type === "pv_cn") ?? null;

  const mediaKr =
    media.find((item) => item.media_type === "youtube" && item.usage_type === "pv_kr") ?? null;

  const fallbackMedia =
    media.find((item) => item.media_type === "image" && item.usage_type === "cover") ??
    media[0] ??
    null;

  const initialLang: "cn" | "kr" = mediaCn ? "cn" : "kr";
  const [activeLang, setActiveLang] = useState<"cn" | "kr">(initialLang);

  const activeVideo = useMemo(() => {
    return activeLang === "cn" ? mediaCn : mediaKr;
  }, [activeLang, mediaCn, mediaKr]);

  return (
    <div className="story-media-box">
      {mediaCn || mediaKr ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {mediaCn ? (
            <button
              type="button"
              onClick={() => setActiveLang("cn")}
              style={{
                border: "1px solid rgba(170, 170, 170, 0.35)",
                borderRadius: 999,
                padding: "8px 14px",
                background: activeLang === "cn" ? "rgba(255,255,255,0.96)" : "transparent",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              CN
            </button>
          ) : null}

          {mediaKr ? (
            <button
              type="button"
              onClick={() => setActiveLang("kr")}
              style={{
                border: "1px solid rgba(170, 170, 170, 0.35)",
                borderRadius: 999,
                padding: "8px 14px",
                background: activeLang === "kr" ? "rgba(255,255,255,0.96)" : "transparent",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              KR
            </button>
          ) : null}
        </div>
      ) : null}

      {activeVideo ? (
        <div className="media-embed-wrap">
          <iframe
            src={getYoutubeEmbedUrl(activeVideo)}
            title={activeVideo.title || storyTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : fallbackMedia ? (
        fallbackMedia.media_type === "image" ? (
          <img
            src={fallbackMedia.url}
            alt={fallbackMedia.title || storyTitle}
            className="story-detail-image"
          />
        ) : fallbackMedia.media_type === "youtube" ? (
          <div className="media-embed-wrap">
            <iframe
              src={getYoutubeEmbedUrl(fallbackMedia)}
              title={fallbackMedia.title || storyTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="empty-box">지원되지 않는 미디어 형식입니다.</div>
        )
      ) : (
        <div className="empty-box">등록된 영상/이미지가 없습니다.</div>
      )}
    </div>
  );
}