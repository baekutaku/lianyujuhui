import Link from "next/link";

type CallDetailProps = {
  characterName: string;
  title: string | null;
  coverImage: string;
  youtubeEmbedUrl: string;
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
  body,
  translationHtml = "",
  memoHtml = "",
}: CallDetailProps) {
  const embedUrl = normalizeYoutubeEmbedUrl(youtubeEmbedUrl);

  return (
    <div className="call-fullscreen">
      {embedUrl ? (
        <div className="call-fullscreen-media">
          <iframe
            src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&playsinline=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="call-fullscreen-empty">영상 링크가 없습니다.</div>
        
      )}{translationHtml || memoHtml ? (
  <div
    style={{
      marginTop: 24,
      display: "grid",
      gap: 20,
    }}
  >
    {translationHtml ? (
      <section className="content-card">
        <h3 style={{ marginBottom: 12 }}>번역</h3>
        <div
          dangerouslySetInnerHTML={{ __html: translationHtml }}
        />
      </section>
    ) : null}

    {memoHtml ? (
      <section className="content-card">
        <h3 style={{ marginBottom: 12 }}>메모</h3>
        <div
          dangerouslySetInnerHTML={{ __html: memoHtml }}
        />
      </section>
    ) : null}
  </div>
) : null}

      <div className="call-top-only">
        <Link href="/phone-items/calls" className="call-back-button">
          ←
        </Link>
      </div>
    </div>
 


);
}