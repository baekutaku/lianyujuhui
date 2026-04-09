import Link from "next/link";

type CallHistoryItemProps = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  slug: string;
  title: string;
  isVideo?: boolean;
};

export default function CallHistoryItem({
  characterKey,
  characterName,
  avatarUrl,
  level,
  slug,
  title,
  isVideo,
}: CallHistoryItemProps) {
  return (
    <Link
      href={`/phone-items/calls/${characterKey}/${slug}`}
      className="call-history-item"
    >
      <div className="phone-avatar-wrap">
        <img src={avatarUrl} alt={characterName} className="phone-avatar" />
        {level ? <span className="phone-level-badge">{level}</span> : null}
      </div>

      <div className="call-main">
        <div className="call-name">{characterName}</div>
        <div className="call-title">{title}</div>
      </div>

      <div className="call-action">{isVideo ? "▶" : "◔"}</div>
    </Link>
  );
}