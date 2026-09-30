"use client";

import Link from "next/link";
import { useState } from "react";

type CallDetailProps = {
  characterName: string;
  title: string | null;
  coverImage: string;
  youtubeEmbedUrl: string;
  youtubeEmbedUrlKr?: string;
  body: string;
  translationHtml?: string;
  memoHtml?: string;
};

function normalizeYoutubeEmbedUrl(raw?: string) {
  const value = (raw || "").trim();
  if (!value) return "";

  if (value.includes("/embed/")) return value;

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

  return value;
}



export default function CallDetail({
  characterName,
  title,
  coverImage,
  youtubeEmbedUrl,
  youtubeEmbedUrlKr = "",
  body,
  translationHtml = "",
  memoHtml = "",
}: CallDetailProps) {
  const hasCn = !!youtubeEmbedUrl;
  const hasKr = !!youtubeEmbedUrlKr;
  const hasBoth = hasCn && hasKr;

  const [lang, setLang] = useState<"cn" | "kr">(hasCn ? "cn" : "kr");

  const activeUrl = lang === "kr" && hasKr ? youtubeEmbedUrlKr : youtubeEmbedUrl;
  const embedUrl = normalizeYoutubeEmbedUrl(activeUrl);

  return (
    <div className="call-fullscreen">
      {embedUrl ? (
        <div className="call-fullscreen-media">
          <iframe
            key={embedUrl}
            src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&playsinline=1&rel=0`}
            title={title ?? `${characterName} 통화`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="call-fullscreen-empty">영상 링크가 없습니다.</div>
      )}

    <div className="call-top-only">
        <Link href="/phone-items/calls" className="call-back-button">
          ←
        </Link>

        {hasBoth ? (
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
              zIndex: 30,
            }}
          >
            <button
              type="button"
              onClick={() => setLang("cn")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: lang === "cn" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                color: lang === "cn" ? "#333" : "#fff",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              CN
            </button>
            <button
              type="button"
              onClick={() => setLang("kr")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: lang === "kr" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                color: lang === "kr" ? "#333" : "#fff",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              KR
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}