import Link from "next/link";

export type MomentReplyLine = {
  speakerKey?: string;
  speakerName?: string;
  targetName?: string;
  content?: string;
  isReplyToMc?: boolean;
};

export type MomentChoice = {
  id: string;
  label: string;
  isHistory?: boolean;
  replySpeakerKey?: string;
  replySpeakerName?: string;
  replyTargetName?: string;
  replyContent?: string;
};

export type MomentFeedItem = {
  id: string;
  slug: string;
  authorKey: string;
  authorName: string;
  authorAvatarUrl: string;
  authorHasProfile: boolean;
  dateText: string;
  body: string;
  imageUrls: string[];
  replyLines: MomentReplyLine[];
  activeChoice: MomentChoice | null;
  isFavorite: boolean;
};

const UI = {
  wrapperPadding: "18px 10px 20px",
  nameSize: 18,
  bodySize: 17,
  bodyLineHeight: 1.34,
  dateSize: 12.5,
  replyFontSize: 15,
  replyLineHeight: 1.42,
  replyBg: "rgba(248, 230, 240, 0.90)",
  replyAccent: "#df7f96",
  replySub: "#746a74",
  imageWidth: "78%",
  imageAspectRatio: "1.95 / 1",
};

type MomentFeedPostProps = {
  item: MomentFeedItem;
};

type RenderLine = {
  kind: "choice" | "reply";
  speakerName: string;
  targetName?: string;
  content: string;
  isReplyToMc?: boolean;
};



function buildRenderLines(item: MomentFeedItem): RenderLine[] {
  const lines: RenderLine[] = [];

  if (item.activeChoice?.label?.trim()) {
    lines.push({
      kind: "choice",
      speakerName: item.activeChoice.replyTargetName?.trim() || item.authorName,
      content: item.activeChoice.label.trim(),
      isReplyToMc: false,
    });
  }

  if (item.activeChoice?.replyContent?.trim()) {
    lines.push({
      kind: "reply",
      speakerName: item.activeChoice.replySpeakerName?.trim() || "답장",
   targetName: item.activeChoice.replyTargetName?.trim() || item.authorName,
      content: item.activeChoice.replyContent.trim(),
      isReplyToMc: true,
    });
  }

  for (const line of item.replyLines ?? []) {
    const content = String(line.content || "").trim();
    if (!content) continue;

    lines.push({
      kind: "reply",
      speakerName: String(line.speakerName || "").trim() || "이름 없음",
      targetName: String(line.targetName || "").trim(),
      content,
      isReplyToMc: Boolean(line.isReplyToMc),
    });
  }

  return lines;
}

function ReactionPrefix({
  line,
}: {
  line: RenderLine;
}) {
  if (line.kind === "choice") {
    return (
      <>
        <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
          {line.speakerName}
        </span>
        <span style={{ color: UI.replySub }}>:</span>{" "}
      </>
    );
  }

  if (line.isReplyToMc && line.targetName) {
    return (
      <>
        <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
          {line.speakerName}
        </span>
        <span style={{ color: UI.replySub }}> 답장 </span>
        <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
          {line.targetName}
        </span>
        <span style={{ color: UI.replySub }}>:</span>{" "}
      </>
    );
  }

  return (
    <>
      <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
        {line.speakerName}
      </span>
      <span style={{ color: UI.replySub }}>:</span>{" "}
    </>
  );
}

export default function MomentFeedPost({ item }: MomentFeedPostProps) {
  const renderLines = buildRenderLines(item);

  const profileHref =
    item.authorKey === "mc"
      ? "/phone-items/me"
      : `/phone-items/me/${item.authorKey}`;

      const canOpenProfile =
  item.authorHasProfile ||
  item.authorKey === "mc" ||
  ["baiqi", "lizeyan", "zhouqiluo", "xumo", "lingxiao"].includes(item.authorKey);

  return (
    <div className="moment-card-item" style={{ padding: UI.wrapperPadding }}>
     <div
  style={{
    display: "grid",
    gridTemplateColumns: "66px minmax(0, 1fr)",
    gap: 10,
    alignItems: "start",
    position: "relative",
  }}
>
  <div
    style={{
      position: "relative",
      zIndex: 3,
    }}
  >
    {canOpenProfile ? (
      <Link
        href={profileHref}
        style={{
          display: "block",
          width: 58,
          height: 58,
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          zIndex: 3,
        }}
        aria-label={`${item.authorName} 개인창`}
        title={`${item.authorName} 개인창`}
      >
        <img
          src={item.authorAvatarUrl}
          alt={item.authorName}
          style={{
            display: "block",
            width: 58,
            height: 58,
            borderRadius: "999px",
            objectFit: "cover",
          }}
        />
      </Link>
    ) : (
      <img
        src={item.authorAvatarUrl}
        alt={item.authorName}
        style={{
          display: "block",
          width: 58,
          height: 58,
          borderRadius: "999px",
          objectFit: "cover",
        }}
      />
    )}
  </div>

 <div
  style={{
    minWidth: 0,
    zIndex: 1,
  }}
>
  <div className="moment-name-row">
  <span className="moment-name-text">{item.authorName}</span>

  <Link
    href={`/phone-items/moments/${item.authorKey}/${item.slug}`}
    className="moment-refresh-button"
    aria-label="모멘트 상세"
    title="모멘트 상세"
  >
    <span className="material-symbols-rounded">autorenew</span>
  </Link>
</div>

  <div
    style={{
      fontSize: UI.bodySize,
      lineHeight: UI.bodyLineHeight,
      letterSpacing: "-0.015em",
      color: "#66606b",
      whiteSpace: "pre-wrap",
    }}
  >
    {item.body}
  </div>

  <div
    style={{
      marginTop: 8,
      fontSize: UI.dateSize,
      color: "#b8adb9",
    }}
  >
    {item.dateText}
  </div>

  {item.imageUrls.length ? (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      {item.imageUrls.map((url, index) => (
        <img
          key={`${url}-${index}`}
          src={url}
          alt={`moment-${index + 1}`}
          style={{
            display: "block",
            width: UI.imageWidth,
            maxWidth: 430,
            aspectRatio: UI.imageAspectRatio,
            objectFit: "cover",
            background: "#fff",
          }}
        />
      ))}
    </div>
  ) : null}

  {renderLines.length ? (
    <div
      style={{
        marginTop: 14,
        padding: "11px 14px",
        background: UI.replyBg,
        color: "#665561",
        whiteSpace: "pre-wrap",
        lineHeight: UI.replyLineHeight,
        letterSpacing: "-0.015em",
        fontSize: UI.replyFontSize,
        display: "grid",
        gap: 4,
      }}
    >
      {renderLines.map((line, index) => (
        <div key={`reaction-${index}`}>
          <ReactionPrefix line={line} />
          <span>{line.content}</span>
        </div>
      ))}
    </div>
  ) : null}
</div>
</div>
    </div>
  );
}