import Link from "next/link";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";

type PublisherRow = {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
  sort_order: number;
  is_active: boolean;
};

type PostRow = {
  id: string;
  publisher_id: string;
  title: string;
  body: string;
  created_at: string;
  is_published: boolean;
};

function getPreviewText(body: string) {
  const cleaned = body.replace(/\s+/g, " ").trim();
  return cleaned.length > 38 ? `${cleaned.slice(0, 38)}...` : cleaned;
}

export default async function PhoneArticlesPage() {
  const [{ data: publishers, error: publisherError }, { data: posts, error: postError }] =
    await Promise.all([
      supabase
        .from("phone_article_publishers")
        .select("id, name, slug, icon_url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),

      supabase
        .from("phone_article_posts")
        .select("id, publisher_id, title, body, created_at, is_published")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

  if (publisherError) throw new Error(publisherError.message);
  if (postError) throw new Error(postError.message);

  const publisherList = (publishers as PublisherRow[] | null) ?? [];
  const postList = (posts as PostRow[] | null) ?? [];

  const latestPostByPublisher = new Map<string, PostRow>();
  for (const post of postList) {
    if (!latestPostByPublisher.has(post.publisher_id)) {
      latestPostByPublisher.set(post.publisher_id, post);
    }
  }

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="핫이슈" subtitle="뉴스 목록" />
        <div
          className="phone-content"
          style={{
            padding: "0 0 12px",
            background:
              "linear-gradient(rgba(255,255,255,0.76), rgba(255,255,255,0.82)), url('/phone/article-bg.png') center/cover no-repeat",
          }}
        >
          {publisherList.map((publisher) => {
            const latest = latestPostByPublisher.get(publisher.id);

            return (
              <Link
                key={publisher.id}
                href={`/phone-items/articles/${publisher.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px minmax(0, 1fr)",
                  gap: 14,
                  alignItems: "center",
                  padding: "18px 18px",
                  textDecoration: "none",
                  color: "inherit",
                  borderBottom: "1px solid rgba(214, 206, 214, 0.8)",
                  background: "rgba(255,255,255,0.28)",
                }}
              >
                <img
                  src={publisher.icon_url || "/phone/article-default-icon.png"}
                  alt={publisher.name}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#615967",
                      marginBottom: 4,
                    }}
                  >
                    {publisher.name}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: "#8a8490",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 2,
                    }}
                  >
                    {latest?.title ?? "등록된 기사가 없습니다."}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#9c96a2",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {latest ? getPreviewText(latest.body) : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}