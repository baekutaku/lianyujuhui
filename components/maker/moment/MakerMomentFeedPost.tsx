import Link from "next/link";
import MomentChoiceTrigger from "@/components/phone/moment/MomentChoiceTrigger";

export type MakerMomentReplyLine = {
  speakerKey?: string;
  speakerName?: string;
  targetName?: string;
  content?: string;
  isReplyToMc?: boolean;
};

export type MakerMomentChoice = {
  id: string;
  label: string;
  isHistory?: boolean;
  replySpeakerKey?: string;
  replySpeakerName?: string;
  replyTargetName?: string;
  replyContent?: string;
};

export type MakerMomentComment = {
  id?: string;
  speakerKey?: string;
  speakerName?: string;
  avatarUrl?: string;
  content?: string;
  likeCount?: number;
};

export type MakerMomentFeedItem = {
  id: string;
  title?: string;
  authorKey: string;
  authorName: string;
  authorAvatarUrl: string;
  authorHasProfile: boolean;
  dateText: string;
  body: string;
  imageUrls: string[];
  replyLines: MakerMomentReplyLine[];
  choiceOptions: MakerMomentChoice[];
  selectedOptionId?: string | null;
  comments: MakerMomentComment[];
  isFavorite: boolean;
};

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
  npc: "/profile/npc.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "유연",
  other: "NPC",
  npc: "NPC",
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

type RenderLine = {
  kind: "choice" | "reply";
  speakerName: string;
  targetName?: string;
  content: string;
  isReplyToMc?: boolean;
};

function ReactionPrefix({ line }: { line: RenderLine }) {
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

export default function MakerMomentFeedPost({
  item,
  useChoiceModal = false,
}: {
  item: MakerMomentFeedItem;
  useChoiceModal?: boolean;
}) {
  const authorKey = item.authorKey?.trim() || "npc";
  const safeAuthorName =
    item.authorName?.trim() || DEFAULT_NAME_MAP[authorKey] || "이름 없음";
  const safeAuthorAvatar =
    item.authorAvatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[authorKey] ||
    "/profile/npc.png";

  const canOpenProfile =
    item.authorHasProfile ||
    authorKey === "mc" ||
    ["baiqi", "lizeyan", "zhouqiluo", "xumo", "lingxiao"].includes(authorKey);

  const profileHref = "/maker/me";

  const activeChoice =
    item.choiceOptions.find((option) => option.id === item.selectedOptionId) ||
    null;

  const renderLines: RenderLine[] = [];

  if (activeChoice?.label?.trim()) {
    renderLines.push({
      kind: "choice",
      speakerName: activeChoice.replyTargetName?.trim() || safeAuthorName,
      content: activeChoice.label.trim(),
      isReplyToMc: false,
    });
  }

  if (activeChoice?.replyContent?.trim()) {
    renderLines.push({
      kind: "reply",
      speakerName: activeChoice.replySpeakerName?.trim() || "이름 없음",
      targetName: activeChoice.replyTargetName?.trim() || "유연",
      content: activeChoice.replyContent.trim(),
      isReplyToMc: true,
    });
  }

  for (const line of item.replyLines ?? []) {
    const content = String(line.content || "").trim();
    if (!content) continue;

    renderLines.push({
      kind: "reply",
      speakerName:
        String(line.speakerName || "").trim() ||
        DEFAULT_NAME_MAP[String(line.speakerKey || "").trim()] ||
        "이름 없음",
      targetName: String(line.targetName || "").trim(),
      content,
      isReplyToMc: Boolean(line.isReplyToMc),
    });
  }

  for (const comment of item.comments ?? []) {
    const content = String(comment.content || "").trim();
    if (!content) continue;

    renderLines.push({
      kind: "reply",
      speakerName:
        String(comment.speakerName || "").trim() ||
        DEFAULT_NAME_MAP[String(comment.speakerKey || "").trim()] ||
        "NPC",
      content,
      isReplyToMc: false,
    });
  }

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
        <div style={{ position: "relative", zIndex: 3 }}>
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
              aria-label={`${safeAuthorName} 프로필`}
              title={`${safeAuthorName} 프로필`}
            >
              <img
                src={safeAuthorAvatar}
                alt={safeAuthorName}
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
              src={safeAuthorAvatar}
              alt={safeAuthorName}
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

        <div style={{ minWidth: 0, position: "relative", zIndex: 1 }}>
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
                {safeAuthorName}
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
              {item.choiceOptions.length ? (
                useChoiceModal ? (
                  <MomentChoiceTrigger
                    title={item.title || item.authorName}
                    options={item.choiceOptions.map((option) => ({
                      id: option.id,
                      label: option.label,
                      isHistory: option.isHistory,
                    }))}
                    selectedOptionId={item.selectedOptionId || null}
                    buttonClassName="moment-choice-trigger"
                    buttonTitle="회상 선택지"
                  />
                ) : (
                  <Link
                    href={`/maker/moments/${item.id}`}
                    className="moment-choice-trigger"
                    aria-label="모멘트 상세"
                    title="모멘트 상세"
                  >
                    <span className="material-symbols-rounded">autorenew</span>
                  </Link>
                )
              ) : null}

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