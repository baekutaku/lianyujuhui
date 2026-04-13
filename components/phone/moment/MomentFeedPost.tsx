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

function getMomentReplyDisplayName(line: {
  speakerName?: string;
  isReplyToMc?: boolean;
}) {
  const baseName = line.speakerName?.trim() || "이름 없음";
  if (line.isReplyToMc) return `${baseName}답장유연`;
  return baseName;
}

const UI = {
  wrapperPadding: "18px 10px 20px",
  nameSize: 18,
  bodySize: 17,
  bodyLineHeight: 1.34,
  dateSize: 12.5,
  replyFontSize: 15,
  replyLineHeight: 1.32,
  replyBg: "rgba(248, 236, 241, 0.56)",
  replyAccent: "#df7f96",
  imageWidth: "78%",
  imageAspectRatio: "1.95 / 1",
};

type MomentFeedPostProps = {
  item: MomentFeedItem;
};

export default function MomentFeedPost({ item }: MomentFeedPostProps) {
  return (
    <div
      style={{
        padding: UI.wrapperPadding,
        borderTop: "1px solid rgba(233, 226, 236, 0.95)",
        borderBottom: "1px solid rgba(233, 226, 236, 0.95)",
        background: "transparent",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "66px minmax(0, 1fr)",
          gap: 10,
          alignItems: "start",
        }}
      >
        <div>
          {item.authorHasProfile ? (
            <Link href={`/phone-items/me/${item.authorKey}`}>
              <img
                src={item.authorAvatarUrl}
                alt={item.authorName}
                style={{
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
                width: 58,
                height: 58,
                borderRadius: "999px",
                objectFit: "cover",
              }}
            />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "start",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: UI.nameSize,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: UI.replyAccent,
                  marginBottom: 8,
                }}
              >
                {item.authorName}
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
                  marginTop: 12,
                  fontSize: UI.dateSize,
                  color: "#b8adb9",
                }}
              >
                {item.dateText}
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flex: "0 0 auto",
                paddingTop: 2,
              }}
            >
              <Link
                href={`/phone-items/moments/${item.authorKey}/${item.slug}`}
                className="moment-choice-trigger"
                aria-label="모멘트 상세"
                title="모멘트 상세"
              >
                <span className="material-symbols-rounded">autorenew</span>
              </Link>

              <span
                style={{
                  fontSize: 22,
                  color: item.isFavorite ? "#e8d8df" : "#e5dce6",
                  lineHeight: 1,
                }}
              >
                ♡
              </span>
            </div>
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

          {item.activeChoice ? (
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
              }}
            >
              <div>
                <strong style={{ color: UI.replyAccent }}>
                  {item.activeChoice.replyTargetName || "유연"}:
                </strong>{" "}
                {item.activeChoice.label}
              </div>

              {item.activeChoice.replyContent ? (
                <div style={{ marginTop: 6 }}>
                  <strong
                    style={{
                      color: UI.replyAccent,
                      lineHeight: 1.2,
                    }}
                  >
                    {item.activeChoice.replySpeakerName || "답장"}
                    {item.activeChoice.replyTargetName
                      ? `답장${item.activeChoice.replyTargetName}`
                      : ""}
                    :
                  </strong>{" "}
                  {item.activeChoice.replyContent}
                </div>
              ) : null}
            </div>
          ) : item.replyLines.length ? (
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {item.replyLines.map((line, index) => (
                <div
                  key={`${line.speakerName || "reply"}-${index}`}
                  style={{
                    padding: "11px 14px",
                    background: UI.replyBg,
                    color: "#665561",
                    whiteSpace: "pre-wrap",
                    lineHeight: UI.replyLineHeight,
                    letterSpacing: "-0.015em",
                    fontSize: UI.replyFontSize,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: 4,
                      lineHeight: 1.2,
                      color: UI.replyAccent,
                    }}
                  >
                    {getMomentReplyDisplayName(line)}
                    {line.targetName ? `→${line.targetName}` : ""}
                  </strong>
                  <div>{line.content || ""}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}