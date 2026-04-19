import Link from "next/link";

type Props = {
  id: string;
  characterName: string;
  avatarUrl: string;
  preview: string;
};

export default function MakerMessageInboxItem({
  id,
  characterName,
  avatarUrl,
  preview,
}: Props) {
  return (
    <Link href={`/maker/messages/${id}`} className="message-inbox-item">
      <div className="phone-avatar-wrap">
        <img src={avatarUrl} alt={characterName} className="phone-avatar" />
      </div>

      <div className="message-main">
        <div className="message-name">{characterName}</div>
        <div className="message-preview">{preview}</div>
      </div>
    </Link>
  );
}