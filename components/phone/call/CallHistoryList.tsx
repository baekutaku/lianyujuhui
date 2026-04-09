import CallHistoryItem from "./CallHistoryItem";

type CallItem = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  slug: string;
  title: string;
  isVideo?: boolean;
};

export default function CallHistoryList({ items }: { items: CallItem[] }) {
  return (
    <div className="call-history-list">
      {items.map((item) => (
        <CallHistoryItem
          key={`${item.characterKey}-${item.slug}`}
          {...item}
        />
      ))}
    </div>
  );
}