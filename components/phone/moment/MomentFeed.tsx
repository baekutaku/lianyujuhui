import MomentFeedItem from "./MomentFeedItem";

type FeedItem = {
  id: string;
  characterKey: string;
  authorName: string;
  authorAvatar: string;
  authorLevel?: number;
  body: string;
  imageUrl?: string;
  quoteText?: string;
};

export default function MomentFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="moment-feed">
      {items.map((item) => (
        <MomentFeedItem key={item.id} {...item} />
      ))}
    </div>
  );
}