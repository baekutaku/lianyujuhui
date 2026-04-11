import MessageInboxItem from "./MessageInboxItem";

type InboxRow = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  preview: string;
  threadKey: string;
};

export default function MessageInboxList({ items }: { items: InboxRow[] }) {
  return (
    <div className="message-inbox-list">
      {items.map((item) => (
        <MessageInboxItem
          key={`${item.characterKey}-${item.threadKey}`}
          {...item}
        />
      ))}
    </div>
  );
}