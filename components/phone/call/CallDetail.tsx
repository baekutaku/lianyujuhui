type CallDetailProps = {
  characterName: string;
  title: string;
  coverImage: string;
  youtubeEmbedUrl?: string;
  body?: string;
};

export default function CallDetail({
  characterName,
  title,
  coverImage,
  youtubeEmbedUrl,
  body,
}: CallDetailProps) {
  return (
    <div className="phone-detail-body-wrap">
      <div className="call-cover">
        <img src={coverImage} alt={title} />
        <div className="call-cover-overlay">
          <div>
            <div className="call-cover-title">{characterName}</div>
            <div className="call-cover-subtitle">{title}</div>
          </div>
          <div />
        </div>
      </div>

      {youtubeEmbedUrl ? (
        <div className="phone-panel" style={{ marginTop: "16px" }}>
          <div className="phone-detail-media">
            <iframe
              src={youtubeEmbedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {body ? (
        <div className="phone-panel">
          <div className="phone-detail-text">{body}</div>
        </div>
      ) : null}

      <div className="call-hangup-wrap">
        <button type="button" className="call-hangup-btn">
          📞
        </button>
      </div>
    </div>
  );
}