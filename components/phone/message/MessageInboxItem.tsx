import Link from "next/link";

type MessageInboxItemProps = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  preview: string;
  threadKey: string;
};

export default function MessageInboxItem({
  characterKey,
  characterName,
  avatarUrl,
  level,
  preview,
  threadKey,
}: MessageInboxItemProps) {
  return (
    <Link
      href={`/phone-items/messages/${characterKey}/${threadKey}`}
      className="message-inbox-item"
    >
      <div className="phone-avatar-wrap">
        <img src={avatarUrl} alt={characterName} className="phone-avatar" />
        {level ? <span className="phone-level-badge">{level}</span> : null}
      </div>

      <div className="message-main">
        <div className="message-name">{characterName}</div>
        <div className="message-preview">{preview}</div>
      </div>
    </Link>
  );
}