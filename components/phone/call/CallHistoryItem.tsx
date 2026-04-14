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
  isVideo = false,
}: CallHistoryItemProps) {
  const detailHref = `/phone-items/calls/${characterKey}/${slug}`;
  const profileHref =
    characterKey === "mc"
      ? "/phone-items/me"
      : `/phone-items/me/${characterKey}`;

  return (
    <div className="call-history-item">
      <Link href={profileHref} aria-label={`${characterName} 프로필`}>
        <div className="phone-avatar-wrap">
          <img
            src={avatarUrl}
            alt={characterName}
            className="phone-avatar"
          />
          {typeof level === "number" ? (
            <span className="phone-level-badge">{level}</span>
          ) : null}
        </div>
      </Link>

      <Link href={detailHref} className="call-main">
        <div className="call-name">{characterName}</div>
        <div className="call-title">{title}</div>
      </Link>

      <Link
        href={detailHref}
        className="call-action"
        aria-label={isVideo ? "영상통화 보기" : "통화 보기"}
      >
        <span className="material-symbols-rounded">
          {isVideo ? "videocam" : "call"}
        </span>
      </Link>
    </div>
  );
}