import Link from "next/link";

type MomentFeedItemProps = {
  characterKey: string;
  authorName: string;
  authorAvatar: string;
  authorLevel?: number;
  body: string;
  images?: string[];
  quoteText?: string;
};

export default function MomentFeedItem({
  characterKey,
  authorName,
  authorAvatar,
  authorLevel,
  body,
  images,
  quoteText,
}: MomentFeedItemProps) {
  return (
    <Link href={`/phone-items/moments/${characterKey}`} className="moment-card">
      <div className="moment-header">
        <div className="phone-avatar-wrap">
          <img src={authorAvatar} alt={authorName} className="phone-avatar" />
          {authorLevel ? <span className="phone-level-badge">{authorLevel}</span> : null}
        </div>

        <div className="moment-main">
          <div className="moment-author">{authorName}</div>
          <div className="moment-body">{body}</div>

          {images && images.length > 0 ? (
            <div className="moment-gallery">
              {images.map((image, index) => (
                <div key={index} className="moment-image-wrap">
                  <img src={image} alt={`${authorName} moment ${index + 1}`} className="moment-image" />
                </div>
              ))}
            </div>
          ) : null}

          {quoteText ? <div className="moment-quote">{quoteText}</div> : null}
        </div>
      </div>
    </Link>
  );
}