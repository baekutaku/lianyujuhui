import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import MomentChoiceTrigger from "@/components/phone/moment/MomentChoiceTrigger";

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
  mc: "나",
  other: "기타",
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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
    momentCategory?: string;
    momentCategoryLabel?: string;
    momentDateText?: string;
    momentBody?: string;
    momentSummary?: string;
    momentSource?: string;
    momentImageUrls?: string[];
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
    }>;
    momentSelectedOptionId?: string;
    isFavorite?: boolean;
    isComplete?: boolean;
  } | null;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function getMomentReplyDisplayName(line: {
  speakerName?: string;
  isReplyToMc?: boolean;
}) {
  const baseName = line.speakerName?.trim() || "이름 없음";

  if (line.isReplyToMc) {
    return `${baseName} 답장 유연`;
  }

  return baseName;
}

function getDateText(row: MomentRow) {
  const raw = row.content_json?.momentDateText?.trim();
  if (raw) return raw;

  const createdAt = row.created_at?.trim();
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default async function MomentDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug).trim();
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, is_published, content_json")
    .eq("subtype", "moment")
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) notFound();

  const item = data as MomentRow;

  const authorKey = item.content_json?.authorKey?.trim() || "other";
  const authorName =
    item.content_json?.authorName?.trim() ||
    DEFAULT_NAME_MAP[authorKey] ||
    "이름 없음";

  const authorAvatarUrl =
    item.content_json?.authorAvatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[authorKey] ||
    "/profile/npc.png";

  const categoryLabel =
    item.content_json?.momentCategoryLabel?.trim() ||
    item.content_json?.momentCategory?.trim() ||
    "일상";

  const dateText = getDateText(item);
  const body = item.content_json?.momentBody?.trim() || "";
  const summary = item.content_json?.momentSummary?.trim() || "";
  const source = item.content_json?.momentSource?.trim() || "";
  const imageUrls = Array.isArray(item.content_json?.momentImageUrls)
    ? item.content_json!.momentImageUrls!.filter(Boolean)
    : [];
  const comments = Array.isArray(item.content_json?.momentComments)
    ? item.content_json!.momentComments!
    : [];
  const choiceOptions = Array.isArray(item.content_json?.momentChoiceOptions)
    ? item.content_json!.momentChoiceOptions!.map((option, index) => ({
        id: option.id?.trim() || `option-${index + 1}`,
        label: option.label?.trim() || `선택지 ${index + 1}`,
        isHistory: Boolean(option.isHistory ?? false),
      }))
    : [];
  const selectedOptionId =
    item.content_json?.momentSelectedOptionId?.trim() || null;

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={item.title?.trim() || authorName}
          subtitle={authorName}
          backHref="/phone-items/moments"
          rightSlot={
            <div className="history-top-admin">
              {choiceOptions.length ? (
                <MomentChoiceTrigger
                  title={item.title?.trim() || authorName}
                  options={choiceOptions}
                  selectedOptionId={selectedOptionId}
                />
              ) : null}

              {admin ? (
                <>
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
                </>
              ) : null}
            </div>
          }
        />

        <div className="phone-content">
          <div className="message-history-page" style={{ display: "grid", gap: 16 }}>
            <div className="message-history-card" style={{ position: "relative" }}>
              <div className="message-history-card-top">
                <Link
                  href={`/phone-items/me/${authorKey}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    color: "inherit",
                    minWidth: 0,
                  }}
                >
                  <img
                    src={authorAvatarUrl}
                    alt={authorName}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "999px",
                      objectFit: "cover",
                      flex: "0 0 auto",
                    }}
                  />
                  <span className="message-history-badge">{authorName}</span>
                </Link>

                <span className="message-history-heart">
                  {item.content_json?.isFavorite ? "♡" : "〰"}
                </span>
              </div>

              <div className="message-history-title-row">
                <span className="message-history-title">
                  {item.title?.trim() || "제목 없음"}
                </span>
                {!item.content_json?.isComplete ? (
                  <span className="message-history-status">[미완료]</span>
                ) : null}
              </div>

              <div className="message-history-meta-summary">
                {categoryLabel}
                {dateText ? ` · ${dateText}` : ""}
              </div>

              {summary ? (
                <div className="message-history-meta-source">{summary}</div>
              ) : null}

              {source ? (
                <div className="message-history-meta-source">{source}</div>
              ) : null}

              {body ? (
                <div
                  className="message-history-preview"
                  style={{
                    WebkitLineClamp: "unset",
                    display: "block",
                    overflow: "visible",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {body}
                </div>
              ) : null}
            </div>

            {imageUrls.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns:
                    imageUrls.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                }}
              >
                {imageUrls.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`moment-${index + 1}`}
                    style={{
                      width: "100%",
                      borderRadius: 18,
                      objectFit: "cover",
                      background: "#fff",
                      border: "1px solid rgba(220, 224, 232, 0.95)",
                    }}
                  />
                ))}
              </div>
            ) : null}

            {choiceOptions.length ? (
              <div className="message-history-card">
                <div className="message-history-title-row">
                  <span className="message-history-title">선택지</span>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {choiceOptions.map((option) => {
                    const active = selectedOptionId === option.id;

                    return (
                      <div
                        key={option.id}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: active
                            ? "1px solid rgba(162, 143, 211, 0.9)"
                            : "1px solid rgba(221, 216, 233, 0.95)",
                          background: active ? "rgba(162, 143, 211, 0.08)" : "#fff",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <span>{option.label}</span>
                        {option.isHistory ? (
                          <span className="moment-choice-option-badge">역사</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
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
                              lineHeight: 1.6,
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