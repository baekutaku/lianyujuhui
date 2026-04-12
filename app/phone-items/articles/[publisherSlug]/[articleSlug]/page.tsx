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

type PublisherRow = {
  id: string;
  name: string;
  slug: string;
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  image_url: string;
  body: string;
  subscriber_count: number;
  like_count: number;
  related_story_slug?: string | null;
  related_story_label?: string | null;
};

type CommentRow = {
  id: string;
  avatar_url: string;
  nickname: string;
  content: string;
  like_count: number;
};

export default async function PhoneArticleDetailPage({ params }: PageProps) {
  const { publisherSlug, articleSlug } = await params;

  const { data: publisher, error: publisherError } = await supabase
    .from("phone_article_publishers")
    .select("id, name, slug")
    .eq("slug", publisherSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (publisherError) throw new Error(publisherError.message);
  if (!publisher) notFound();

  const { data: post, error: postError } = await supabase
    .from("phone_article_posts")
    .select(
      "id, title, slug, author_name, image_url, body, subscriber_count, like_count, related_story_slug, related_story_label"
    )
    .eq("publisher_id", publisher.id)
    .eq("slug", articleSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (postError) throw new Error(postError.message);
  if (!post) notFound();

  const { data: comments, error: commentError } = await supabase
    .from("phone_article_comments")
    .select("id, avatar_url, nickname, content, like_count")
    .eq("post_id", post.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (commentError) throw new Error(commentError.message);

  const publisherRow = publisher as PublisherRow;
  const postRow = post as PostRow;
  const commentList = (comments as CommentRow[] | null) ?? [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={publisherRow.name}
          subtitle="기사 상세"
          backHref={`/phone-items/articles/${publisherRow.slug}`}
          rightSlot={
            <Link
              href={`/phone-items/articles/${publisherRow.slug}`}
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
            padding: "18px 16px 24px",
            background:
              "linear-gradient(rgba(255,255,255,0.68), rgba(255,255,255,0.82)), url('/phone/article-bg.png') center/cover no-repeat",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.82)",
              padding: 14,
              boxShadow: "0 6px 18px rgba(191, 181, 191, 0.16)",
              marginBottom: 16,
            }}
          >
            <h1
              style={{
                fontSize: 17,
                fontWeight: 500,
                lineHeight: 1.45,
                color: "#64606a",
                margin: "0 0 12px",
              }}
            >
              {postRow.title}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
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
              <span>{postRow.author_name || "편집부"}</span>
            </div>

            {postRow.image_url ? (
              <img
                src={postRow.image_url}
                alt={postRow.title}
                style={{
                  width: "100%",
                  display: "block",
                  aspectRatio: "16 / 8",
                  objectFit: "cover",
                  marginBottom: 14,
                }}
              />
            ) : null}

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "#6d6872",
                whiteSpace: "pre-wrap",
              }}
            >
              {postRow.body}
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
                marginTop: 18,
                fontSize: 14,
                color: "#7d7783",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                구독 {postRow.subscriber_count ?? 0}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-rounded">thumb_up</span>
                {postRow.like_count ?? 0}
              </span>
            </div>

            {postRow.related_story_slug ? (
              <div style={{ marginTop: 18 }}>
                <Link
                  href={`/stories/${postRow.related_story_slug}`}
                  className="primary-button"
                  style={{
                    marginTop: 0,
                    textDecoration: "none",
                    display: "inline-flex",
                  }}
                >
                  {postRow.related_story_label?.trim() || "관련 스토리 보기"}
                </Link>
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

              <div style={{ display: "grid", gap: 12 }}>
                {commentList.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "48px minmax(0, 1fr) auto",
                      gap: 12,
                      alignItems: "start",
                    }}
                  >
                    <img
                      src={comment.avatar_url || "/profile/mc.png"}
                      alt={comment.nickname}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          color: "#f09b9b",
                          marginBottom: 4,
                        }}
                      >
                        {comment.nickname}
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: "#736e78",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {comment.content}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 14,
                        color: "#8a8390",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span className="material-symbols-rounded">thumb_up</span>
                      {comment.like_count}
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