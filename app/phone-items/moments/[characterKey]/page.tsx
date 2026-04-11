import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
};

type MomentPost = {
  body?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  quoteText?: string;
  createdAt?: string;
};

type MomentItem = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  summary: string | null;
  is_published: boolean | null;
  content_json?: {
    characterKey?: string;
    authorName?: string;
    authorAvatar?: string;
    authorLevel?: number;
    posts?: MomentPost[];
  } | null;
};

const CHARACTER_LABELS: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

function getPostImages(post: MomentPost) {
  if (Array.isArray(post.images)) return post.images.filter(Boolean);
  if (Array.isArray(post.imageUrls)) return post.imageUrls.filter(Boolean);
  if (post.imageUrl) return [post.imageUrl];
  return [];
}

export default async function CharacterMomentsPage({ params }: PageProps) {
  const { characterKey } = await params;
  const characterLabel = CHARACTER_LABELS[characterKey];

  if (!characterLabel) notFound();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, summary, is_published, content_json")
    .eq("is_published", true)
    .eq("subtype", "moment")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items =
    ((data as MomentItem[] | null) ?? []).filter(
      (item) => item.content_json?.characterKey === characterKey
    );

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Phone / Moments</div>
        <h1 className="page-title">{characterLabel} 모멘트</h1>
        <p className="page-desc">
          {characterLabel} 관련 모멘트 피드를 캐릭터 기준으로 모아봅니다.
        </p>
      </header>

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link href={`/characters/${characterKey}/phone`} className="nav-link">
          캐릭터 휴대폰 허브로
        </Link>

        <Link href={`/characters/${characterKey}`} className="nav-link">
          캐릭터 허브로
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-box">등록된 모멘트가 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {items.map((item) => {
            const authorName = item.content_json?.authorName || characterLabel;
            const authorAvatar = item.content_json?.authorAvatar || "";
            const authorLevel = item.content_json?.authorLevel;
            const posts = item.content_json?.posts ?? [];

            return (
              <article key={item.id} className="detail-panel">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "999px",
                        objectFit: "cover",
                        border: "1px solid rgba(167, 194, 215, 0.35)",
                        background: "rgba(255,255,255,0.7)",
                      }}
                    />
                  ) : null}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-sub)",
                        marginBottom: "4px",
                      }}
                    >
                      모멘트
                      {typeof authorLevel === "number"
                        ? ` · 호감도 ${authorLevel}`
                        : ""}
                    </div>

                    <h2
                      className="archive-card-title"
                      style={{ margin: 0, fontSize: "22px" }}
                    >
                      {authorName}
                    </h2>
                  </div>
                </div>

                <div className="meta-row" style={{ marginBottom: "16px" }}>
                  <span className="meta-pill">posts: {posts.length}</span>
                  <span className="meta-pill">slug: {item.slug}</span>
                </div>

                <div style={{ display: "grid", gap: "20px" }}>
                  {posts.map((post, index) => {
                    const images = getPostImages(post);

                    return (
                      <section
                        key={`${item.id}-${index}`}
                        style={{
                          padding: "18px",
                          borderRadius: "20px",
                          background: "rgba(255,255,255,0.58)",
                          border: "1px solid rgba(167, 194, 215, 0.25)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-soft)",
                            marginBottom: "10px",
                          }}
                        >
                          Post {index + 1}
                        </div>

                        {post.body ? (
                          <p
                            className="detail-text"
                            style={{
                              marginTop: 0,
                              marginBottom: images.length ? "14px" : "0",
                              whiteSpace: "pre-wrap",
                              fontSize: "15px",
                              lineHeight: 1.8,
                              color: "var(--text-main)",
                            }}
                          >
                            {post.body}
                          </p>
                        ) : null}

                        {post.quoteText ? (
                          <blockquote
                            style={{
                              margin: "0 0 14px",
                              padding: "12px 14px",
                              borderRadius: "14px",
                              background: "rgba(240, 247, 253, 0.9)",
                              border: "1px solid rgba(176, 203, 224, 0.3)",
                              color: "var(--text-sub)",
                            }}
                          >
                            {post.quoteText}
                          </blockquote>
                        ) : null}

                        {images.length > 0 ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                              gap: "12px",
                            }}
                          >
                            {images.map((src, imageIndex) => (
                              <img
                                key={`${item.id}-${index}-${imageIndex}`}
                                src={src}
                                alt={`${authorName} moment ${index + 1}`}
                                style={{
                                  width: "100%",
                                  aspectRatio: "1 / 1",
                                  objectFit: "cover",
                                  borderRadius: "18px",
                                  border: "1px solid rgba(167, 194, 215, 0.25)",
                                  background: "rgba(255,255,255,0.7)",
                                }}
                              />
                            ))}
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}