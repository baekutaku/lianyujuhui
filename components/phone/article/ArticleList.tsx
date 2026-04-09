import ArticleListItem from "./ArticleListItem";

type ArticleItem = {
  slug: string;
  title: string;
  preview: string;
  iconUrl: string;
};

export default function ArticleList({ items }: { items: ArticleItem[] }) {
  return (
    <div className="article-list">
      {items.map((item) => (
        <ArticleListItem key={item.slug} {...item} />
      ))}
    </div>
  );
}