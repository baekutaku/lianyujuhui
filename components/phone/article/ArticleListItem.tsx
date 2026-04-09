import Link from "next/link";

type ArticleListItemProps = {
  slug: string;
  title: string;
  preview: string;
  iconUrl: string;
};

export default function ArticleListItem({
  slug,
  title,
  preview,
  iconUrl,
}: ArticleListItemProps) {
  return (
    <Link href={`/phone-items/articles/${slug}`} className="article-item">
      <img src={iconUrl} alt={title} className="article-icon" />

      <div style={{ minWidth: 0 }}>
        <div className="article-name">{title}</div>
        <div className="article-preview">{preview}</div>
      </div>
    </Link>
  );
}