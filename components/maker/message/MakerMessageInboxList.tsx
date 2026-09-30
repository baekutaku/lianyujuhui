import MakerMessageInboxItem from "@/components/maker/message/MakerMessageInboxItem";

type Item = {
  id: string;
  characterName: string;
  avatarUrl: string;
  preview: string;
};

export default function MakerMessageInboxList({
  items = [],
}: {
  items?: Item[];
}) {
  return (
    <div className="message-inbox-list">
      {items.map((item) => (
        <MakerMessageInboxItem key={item.id} {...item} />
      ))}
    </div>
  );
}