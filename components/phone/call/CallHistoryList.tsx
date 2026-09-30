import CallHistoryItem from "@/components/phone/call/CallHistoryItem";

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