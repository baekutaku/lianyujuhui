type ArticleDetailProps = {
  title: string;
  author?: string;
  sourceName?: string;
  imageUrl?: string;
  body: string;
};

export default function ArticleDetail({
  title,
  author,
  sourceName,
  imageUrl,
  body,
}: ArticleDetailProps) {
  return (
    <div className="phone-detail-body-wrap">
      <div className="phone-panel">
        <div className="article-detail-title">{title}</div>
        <div className="article-detail-meta">
          {author ? `작성자 ${author}` : ""}
          {author && sourceName ? " · " : ""}
          {sourceName ?? ""}
        </div>

        {imageUrl ? (
          <div className="phone-detail-media">
            <img src={imageUrl} alt={title} />
          </div>
        ) : null}

        <div className="article-detail-body">{body}</div>
      </div>
    </div>
  );
}