"use client";

import { useState } from "react";
import Link from "next/link";

export type MomentReplyLine = {
  speakerKey?: string;
  speakerName?: string;
  targetName?: string;
  content?: string;
  originalContent?: string;
  isReplyToMc?: boolean;
};

export type MomentChoice = {
  id: string;
  label: string;
  originalLabel?: string;
  isHistory?: boolean;
  replySpeakerKey?: string;
  replySpeakerName?: string;
  replyTargetName?: string;
  replyContent?: string;
  replyOriginalContent?: string;
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
  originalBody?: string;
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
  originalContent?: string;
  isReplyToMc?: boolean;
};



function buildRenderLines(item: MomentFeedItem): RenderLine[] {
  const lines: RenderLine[] = [];

  if (item.activeChoice?.label?.trim()) {
    lines.push({
      kind: "choice",
      speakerName: item.activeChoice.replyTargetName?.trim() || item.authorName,
      content: item.activeChoice.label.trim(),
      originalContent: item.activeChoice.originalLabel?.trim() || "",
      isReplyToMc: false,
    });
  }

  if (item.activeChoice?.replyContent?.trim()) {
    lines.push({
      kind: "reply",
      speakerName: item.activeChoice.replySpeakerName?.trim() || "답장",
   targetName: item.activeChoice.replyTargetName?.trim() || item.authorName,
      content: item.activeChoice.replyContent.trim(),
      originalContent: item.activeChoice.replyOriginalContent?.trim() || "",
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
      originalContent: String(line.originalContent || "").trim(),
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

function InlineOriginalToggle({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  const original = text?.trim() || "";
  if (!original) return null;

  return (
    <div style={{ marginTop: 3, paddingLeft: 2 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        style={{
          border: 0,
          padding: 0,
          background: "transparent",
          color: UI.replySub,
          opacity: 0.72,
          fontSize: 11,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        {open ? "원문 닫기" : "원문"}
      </button>
      {open ? (
        <div
          style={{
            marginTop: 4,
            padding: "5px 7px",
            background: "rgba(255,255,255,0.55)",
            borderRadius: 6,
            color: UI.replySub,
            fontSize: 12.5,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
          }}
        >
          {original}
        </div>
      ) : null}
    </div>
  );
}

export default function MomentFeedPost({ item }: MomentFeedPostProps) {
  const renderLines = buildRenderLines(item);
  const [showOriginal, setShowOriginal] = useState(false);
  const originalBody = item.originalBody?.trim() || "";

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

  {originalBody ? (
    <div style={{ marginTop: 7 }}>
      <button
        type="button"
        onClick={() => setShowOriginal((prev) => !prev)}
        aria-expanded={showOriginal}
        aria-label={showOriginal ? "원문 닫기" : "원문 보기"}
        title={showOriginal ? "원문 닫기" : "원문 보기"}
        style={{
          width: 24,
          height: 24,
          borderRadius: "999px",
          border: "1px solid rgba(187, 170, 199, 0.52)",
          background: "rgba(255,255,255,0.72)",
          color: "#ad91c6",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15, lineHeight: 1 }}>
          translate
        </span>
      </button>
      {showOriginal ? (
        <div
          style={{
            marginTop: 7,
            padding: "10px 12px",
            background: "rgba(246, 243, 247, 0.86)",
            color: "#766e78",
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            fontSize: 14,
          }}
        >
          {originalBody}
        </div>
      ) : null}
    </div>
  ) : null}

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
          <div>
            <ReactionPrefix line={line} />
            <span>{line.content}</span>
          </div>
          <InlineOriginalToggle text={line.originalContent} />
        </div>
      ))}
    </div>
  ) : null}
</div>
</div>
    </div>
  );
}
