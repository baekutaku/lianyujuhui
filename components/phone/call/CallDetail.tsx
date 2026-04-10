import Link from "next/link";

type CallDetailProps = {
  characterKey: string;
  characterName: string;
  title: string;
  youtubeEmbedUrl?: string;
};

export default function CallDetail({
  characterKey,
  characterName,
  title,
  youtubeEmbedUrl,
}: CallDetailProps) {
  return (
    <div className="call-fullscreen">
      {youtubeEmbedUrl ? (
        <div className="call-fullscreen-media">
          <iframe
            src={`${youtubeEmbedUrl}${youtubeEmbedUrl.includes("?") ? "&" : "?"}autoplay=1&playsinline=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="call-fullscreen-empty">영상 링크가 없습니다.</div>
      )}

      <div className="call-top-only">
        <Link href="/phone-items/calls" className="call-back-button">
          ←
        </Link>
      </div>
    </div>
  );
}