import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MomentChoiceTrigger from "@/components/phone/moment/MomentChoiceTrigger";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { getCurrentViewerProfile } from "@/lib/phone/get-current-viewer-profile";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "유연",
  other: "기타",
};

type PageProps = {
  params: Promise<{
    characterKey: string;
    slug: string;
  }>;
  searchParams?: Promise<{
    choice?: string;
  }>;
};

type MomentReplyLine = {
  speakerKey?: string;
  speakerName?: string;
  targetName?: string;
  content?: string;
  isReplyToMc?: boolean;
};

type MomentChoiceOption = {
  id: string;
  label: string;
  isHistory: boolean;
  replySpeakerKey: string;
  replySpeakerName: string;
  replyTargetName: string;
  replyContent: string;
};

type MomentRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  is_published?: boolean | null;
  content_json?: {
    authorKey?: string;
    authorName?: string;
    authorAvatarUrl?: string;
    authorHasProfile?: boolean;
    momentCategory?: string;
    momentCategoryLabel?: string;
    momentDateText?: string;
    momentBody?: string;
    momentSummary?: string;
    momentSource?: string;
    momentImageUrls?: string[];
    momentReplyLines?: MomentReplyLine[];
    momentComments?: Array<{
      avatarUrl?: string;
      nickname?: string;
      content?: string;
      likeCount?: number;
    }>;
    momentChoiceOptions?: Array<{
      id?: string;
      label?: string;
      isHistory?: boolean;
      replySpeakerKey?: string;
      replySpeakerName?: string;
      replyTargetName?: string;
      replyContent?: string;
    }>;
    momentSelectedOptionId?: string;
    isFavorite?: boolean;
    isComplete?: boolean;
  } | null;
};

type RenderLine = {
  speakerName: string;
  targetName?: string;
  content: string;
  isReplyToMc?: boolean;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getDateText(row: MomentRow) {
  const raw = row.content_json?.momentDateText?.trim();
  if (raw) return raw;

  const createdAt = row.created_at?.trim();
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

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

function buildRenderLines(
  activeChoice: MomentChoiceOption | null,
  replyLines: MomentReplyLine[],
  viewerDisplayName: string
): RenderLine[] {
  const lines: RenderLine[] = [];

  if (activeChoice?.label?.trim()) {
    lines.push({
      speakerName: activeChoice.replyTargetName.trim() || viewerDisplayName,
      content: activeChoice.label.trim(),
      isReplyToMc: false,
    });
  }

  if (activeChoice?.replyContent?.trim()) {
    lines.push({
      speakerName: activeChoice.replySpeakerName.trim() || "이름 없음",
      targetName: activeChoice.replyTargetName.trim() || viewerDisplayName,
      content: activeChoice.replyContent.trim(),
      isReplyToMc: true,
    });
  }

  for (const line of replyLines) {
    const content = String(line.content || "").trim();
    if (!content) continue;

    lines.push({
      speakerName: String(line.speakerName || "").trim() || "이름 없음",
      targetName: String(line.targetName || "").trim(),
      content,
      isReplyToMc: Boolean(line.isReplyToMc),
    });
  }

  return lines;
}

function ReplyPrefix({
  speakerName,
  targetName,
  isReplyToMc,
  viewerDisplayName,
}: {
  speakerName: string;
  targetName?: string;
  isReplyToMc?: boolean;
  viewerDisplayName: string;
}) {
  const safeSpeaker = speakerName.trim() || "이름 없음";
  const safeTarget = targetName?.trim() || viewerDisplayName;

  return (
    <>
      <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
        {safeSpeaker}
      </span>

      {isReplyToMc ? (
        <>
          <span style={{ color: UI.replySub }}> 답장 </span>
          <span style={{ color: UI.replyAccent, fontWeight: 700 }}>
            {safeTarget}
          </span>
        </>
      ) : null}

      <span style={{ color: UI.replySub }}>:</span>{" "}
    </>
  );
}
export default async function MomentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey, slug: rawSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const slug = safeDecode(rawSlug).trim();
  const admin = await isAdmin();
  const viewerProfile = await getCurrentViewerProfile();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, is_published, content_json")
    .eq("subtype", "moment")
    .eq("is_published", true)
    .eq("slug", slug)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) notFound();

  const rows = (data as MomentRow[] | null) ?? [];
  const item =
    rows.find(
      (row) => (row.content_json?.authorKey?.trim() || "other") === characterKey
    ) ?? null;

  if (!item) notFound();

 const authorKey = item.content_json?.authorKey?.trim() || characterKey;

const authorName =
  authorKey === "mc"
    ? viewerProfile.displayName
    : item.content_json?.authorName?.trim() ||
      DEFAULT_NAME_MAP[authorKey] ||
      "이름 없음";

const authorAvatarUrl =
  authorKey === "mc"
    ? viewerProfile.avatarUrl
    : item.content_json?.authorAvatarUrl?.trim() ||
      DEFAULT_AVATAR_MAP[authorKey] ||
      "/profile/npc.png";
  const authorHasProfile = Boolean(item.content_json?.authorHasProfile);
  const profileHref =
    authorKey === "mc" ? "/phone-items/me" : `/phone-items/me/${authorKey}`;
  const canOpenProfile =
    authorHasProfile ||
    authorKey === "mc" ||
    ["baiqi", "lizeyan", "zhouqiluo", "xumo", "lingxiao"].includes(authorKey);

  const dateText = getDateText(item);
  const body = item.content_json?.momentBody?.trim() || "";
  const summary = item.content_json?.momentSummary?.trim() || "";
  const source = item.content_json?.momentSource?.trim() || "";

  const imageUrls = Array.isArray(item.content_json?.momentImageUrls)
    ? item.content_json!.momentImageUrls!.filter(Boolean)
    : [];

  const replyLines = Array.isArray(item.content_json?.momentReplyLines)
  ? item.content_json!.momentReplyLines!
      .filter((line) => line && String(line.content ?? "").trim())
      .map((line) => ({
        ...line,
        speakerName:
          line.speakerKey?.trim() === "mc"
            ? viewerProfile.displayName
            : line.speakerName?.trim() || "",
        targetName: line.isReplyToMc
          ? line.targetName?.trim() || viewerProfile.displayName
          : line.targetName?.trim() || "",
      }))
  : [];
  const comments = Array.isArray(item.content_json?.momentComments)
    ? item.content_json!.momentComments!
    : [];

const choiceOptions: MomentChoiceOption[] = Array.isArray(
  item.content_json?.momentChoiceOptions
)
  ? item.content_json!.momentChoiceOptions!.map((option, index) => {
      const replySpeakerKey = option.replySpeakerKey?.trim() || "";
      const replyTargetName = option.replyTargetName?.trim() || "";

      return {
        id: option.id?.trim() || `option-${index + 1}`,
        label: option.label?.trim() || `선택지 ${index + 1}`,
        isHistory: Boolean(option.isHistory ?? false),
        replySpeakerKey,
        replySpeakerName:
          replySpeakerKey === "mc"
            ? viewerProfile.displayName
            : option.replySpeakerName?.trim() || "",
        replyTargetName: replyTargetName || viewerProfile.displayName,
        replyContent: option.replyContent?.trim() || "",
      };
    })
  : [];

  const defaultSelectedOptionId =
    item.content_json?.momentSelectedOptionId?.trim() || null;

  const requestedChoiceId = String(resolvedSearchParams?.choice || "").trim();
  const selectedOptionId = requestedChoiceId || defaultSelectedOptionId || null;

  const activeChoice =
    choiceOptions.find((option) => option.id === selectedOptionId) || null;

  const renderLines = buildRenderLines(
  activeChoice,
  replyLines,
  viewerProfile.displayName
);

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={item.title?.trim() || authorName}
          subtitle={authorName}
          backHref={`/phone-items/moments/${characterKey}`}
          rightSlot={
            admin ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Link
                  href={`/admin/phone-items/${item.id}/edit`}
                  className="history-top-admin-btn"
                  aria-label="수정"
                  title="수정"
                >
                  <span className="material-symbols-rounded">edit</span>
                </Link>

                <Link
                  href="/admin/phone-items"
                  className="history-top-admin-btn"
                  aria-label="휴대폰 관리"
                  title="휴대폰 관리"
                >
                  <span className="material-symbols-rounded">settings</span>
                </Link>
              </div>
            ) : null
          }
        />

        <div className="phone-content">
          <div style={{ display: "grid", gap: 16 }}>
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
                  {canOpenProfile ? (
                    <Link
                      href={profileHref}
                      style={{
                        display: "block",
                        width: 58,
                        height: 58,
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                      aria-label={`${authorName} 개인창`}
                      title={`${authorName} 개인창`}
                    >
                      <img
                        src={authorAvatarUrl}
                        alt={authorName}
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
                      src={authorAvatarUrl}
                      alt={authorName}
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

               <div style={{ minWidth: 0 }}>
  <div
    style={{
      fontSize: UI.nameSize,
      fontWeight: 700,
      lineHeight: 1.15,
      color: UI.replyAccent,
    marginBottom: 6,
    }}
  >
    {authorName}
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
    {body}
  </div>

  <div
    style={{
marginTop: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    }}
  >
    <div
      style={{
        fontSize: UI.dateSize,
        color: "#b8adb9",
        minWidth: 0,
      }}
    >
      {dateText}
    </div>

    {choiceOptions.length ? (
      <div
        style={{
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <MomentChoiceTrigger
          title={item.title?.trim() || authorName}
          options={choiceOptions.map((option) => ({
            id: option.id,
            label: option.label,
            isHistory: option.isHistory,
          }))}
          selectedOptionId={selectedOptionId}
        />
      </div>
    ) : null}
  </div>

                  {imageUrls.length ? (
                    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                      {imageUrls.map((url, index) => (
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
                         <ReplyPrefix
  speakerName={line.speakerName}
  targetName={line.targetName}
  isReplyToMc={line.isReplyToMc}
  viewerDisplayName={viewerProfile.displayName}
/>
                          <span>{line.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {summary ? (
              <div className="message-history-meta-source">{summary}</div>
            ) : null}

            {source ? (
              <div className="message-history-meta-source">{source}</div>
            ) : null}

            {comments.length ? (
              <div className="message-history-card">
                <div className="message-history-title-row">
                  <span className="message-history-title">댓글</span>
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  {comments.map((comment, index) => {
                    const safeAvatarUrl =
                      comment.avatarUrl?.trim() || "/profile/npc.png";

                    return (
                      <div
                        key={`${comment.nickname || "comment"}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px minmax(0, 1fr)",
                          gap: 12,
                        }}
                      >
                        <img
                          src={safeAvatarUrl}
                          alt={comment.nickname || "댓글 작성자"}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "999px",
                            objectFit: "cover",
                          }}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#5b5568",
                              marginBottom: 4,
                            }}
                          >
                            {comment.nickname || "이름 없음"}
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.55,
                              color: "#6b7180",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {comment.content || ""}
                          </div>

                          {typeof comment.likeCount === "number" ? (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#b3a8bb",
                                marginTop: 6,
                              }}
                            >
                              좋아요 {comment.likeCount}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}