import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    publisherSlug: string;
    articleSlug: string;
  }>;
};

type ArticleComment = {
  avatarUrl?: string;
  nickname?: string;
  content?: string;
  likeCount?: number;
};

type ArticleItemRow = {
  id: string;
  slug: string;
  title: string;
  preview_text?: string | null;
  is_published?: boolean | null;
  content_json?: {
    sourceName?: string;
    sourceSlug?: string;
    author?: string;
    imageUrl?: string;
    body?: string;
    subscriberCount?: number;
    likeCount?: number;
    relatedStorySlug?: string;
    relatedStoryLabel?: string;
    relatedEventSlug?: string;
    relatedEventLabel?: string;
    comments?: ArticleComment[];
  } | null;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PhoneArticleDetailPage({ params }: PageProps) {
  const {
    publisherSlug: rawPublisherSlug,
    articleSlug: rawArticleSlug,
  } = await params;

  const publisherSlug = safeDecode(rawPublisherSlug).trim();
  const articleSlug = safeDecode(rawArticleSlug).trim();

  const { data: item, error } = await supabase
    .from("phone_items")
    .select("id, slug, title, preview_text, is_published, content_json")
    .eq("subtype", "article")
    .eq("is_published", true)
    .eq("slug", articleSlug)
    .maybeSingle();

  if (error || !item) notFound();

  const postRow = item as ArticleItemRow;
  const rowPublisherSlug = postRow.content_json?.sourceSlug?.trim() || "";

  if (rowPublisherSlug !== publisherSlug) {
    notFound();
  }

  const publisherName = postRow.content_json?.sourceName?.trim() || "핫이슈";
  const authorName = postRow.content_json?.author?.trim() || "편집부";
  const imageUrl = postRow.content_json?.imageUrl?.trim() || "";
  const body =
    postRow.content_json?.body?.trim() ||
    postRow.preview_text?.trim() ||
    "";
  const subscriberCount = postRow.content_json?.subscriberCount ?? 0;
  const likeCount = postRow.content_json?.likeCount ?? 0;

  const relatedStorySlug = postRow.content_json?.relatedStorySlug?.trim() || "";
  const relatedStoryLabel =
    postRow.content_json?.relatedStoryLabel?.trim() || "";

  const relatedEventSlug = postRow.content_json?.relatedEventSlug?.trim() || "";
  const relatedEventLabel =
    postRow.content_json?.relatedEventLabel?.trim() || "";

  const hasStoryButton = Boolean(relatedStorySlug || relatedStoryLabel);
  const hasEventButton = Boolean(relatedEventSlug || relatedEventLabel);

  const commentList = Array.isArray(postRow.content_json?.comments)
    ? postRow.content_json.comments
    : [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={publisherName}
          subtitle="기사 상세"
          backHref={`/phone-items/articles/${publisherSlug}`}
          rightSlot={
            <Link
              href={`/phone-items/articles/${publisherSlug}`}
              className="phone-topbar-icon-button"
              aria-label="히스토리"
              title="히스토리"
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "rgba(122, 204, 178, 0.85)",
                  color: "white",
                }}
              >
                히스토리
              </span>
            </Link>
          }
        />

        <div
          className="phone-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "18px 16px 24px",
            background:
              "linear-gradient(rgba(255,255,255,0.68), rgba(255,255,255,0.82)), url('/phone/article-bg.png') center/cover no-repeat",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              padding: "14px 14px 12px",
              border: "1px solid rgba(230, 224, 231, 0.9)",
              boxShadow: "none",
              marginBottom: 14,
            }}
          >
            <h1
              style={{
                fontSize: 21,
                fontWeight: 500,
                lineHeight: 1.55,
                color: "#64606a",
                margin: "0 0 10px",
              }}
            >
              {postRow.title}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "#8d8792",
                fontSize: 14,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "#ef8f8f",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                작성자
              </span>
              <span>{authorName}</span>
            </div>

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={postRow.title}
                style={{
                  width: "100%",
                  display: "block",
                  aspectRatio: "16 / 5.2",
                  objectFit: "cover",
                  marginBottom: 12,
                }}
              />
            ) : null}

            <div
              style={{
fontSize: 16,
lineHeight: 1.8,
                color: "#6d6872",
                whiteSpace: "pre-wrap",
              }}
            >
              {body}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                marginTop: 14,
                fontSize: 15,
                color: "#7d7783",
              }}
            >
              <span>구독 {subscriberCount}</span>
              <span
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  }}
>
  <span
    className="material-symbols-rounded"
    style={{ fontSize: 20, color: "#ef8f8f" }}
  >
    thumb_up
  </span>
  {likeCount}
</span>
            </div>

            {hasStoryButton || hasEventButton ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {hasStoryButton ? (
                  relatedStorySlug ? (
                    <Link
                      href={`/stories/${relatedStorySlug}`}
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 500,
                        textDecoration: "none",
                        color: "#9b8894",
                      }}
                    >
                      #{relatedStoryLabel || "관련스토리"}
                    </Link>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 500,
                        color: "#b2a5ad",
                        pointerEvents: "none",
                      }}
                    >
                      #{relatedStoryLabel || "관련스토리"}
                    </span>
                  )
                ) : null}

                {hasEventButton ? (
                  relatedEventSlug ? (
                    <Link
                      href={`/events/${relatedEventSlug}`}
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 500,
                        textDecoration: "none",
                        color: "#9b8894",
                      }}
                    >
                      #{relatedEventLabel || "관련이벤트"}
                    </Link>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 500,
                        color: "#b2a5ad",
                        pointerEvents: "none",
                      }}
                    >
                      #{relatedEventLabel || "관련이벤트"}
                    </span>
                  )
                ) : null}
              </div>
            ) : null}
          </div>

          {commentList.length > 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.45)",
                paddingTop: 10,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                  color: "#7e7782",
                }}
              >
                <div style={{ height: 1, background: "rgba(188, 178, 188, 0.6)" }} />
                <div style={{ fontSize: 16, fontWeight: 700 }}>베스트 댓글</div>
                <div style={{ height: 1, background: "rgba(188, 178, 188, 0.6)" }} />
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {commentList.map((comment, index) => (
                  <div
                    key={`${comment.nickname || "comment"}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px minmax(0, 1fr) auto",
                      gap: 10,
                      alignItems: "start",
                    }}
                  >
                    <img
                      src={comment.avatarUrl || "/profile/mc.png"}
                      alt={comment.nickname || "익명"}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          color: "#ef9aa0",
                          marginBottom: 3,
                        }}
                      >
                        {comment.nickname || "익명"}
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: 1.55,
                          color: "#736e78",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {comment.content || ""}
                      </div>
                    </div>

<div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 16,
    color: "#8a8390",
    whiteSpace: "nowrap",
  }}
>
  <span
    className="material-symbols-rounded"
    style={{ fontSize: 18, color: "#ef8f8f" }}
  >
    thumb_up
  </span>
  {comment.likeCount ?? 0}
</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}