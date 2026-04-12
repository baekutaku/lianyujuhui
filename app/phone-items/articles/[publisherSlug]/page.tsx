import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    publisherSlug: string;
  }>;
};

type PublisherRow = {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export default async function PhoneArticleHistoryPage({ params }: PageProps) {
  const { publisherSlug } = await params;

  const { data: publisher, error: publisherError } = await supabase
    .from("phone_article_publishers")
    .select("id, name, slug, icon_url")
    .eq("slug", publisherSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (publisherError) throw new Error(publisherError.message);
  if (!publisher) notFound();

  const { data: posts, error: postError } = await supabase
    .from("phone_article_posts")
    .select("id, title, slug, image_url, is_published, sort_order, created_at")
    .eq("publisher_id", publisher.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (postError) throw new Error(postError.message);

  const publisherRow = publisher as PublisherRow;
  const postList = (posts as PostRow[] | null) ?? [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={publisherRow.name}
          subtitle="히스토리"
          backHref="/phone-items/articles"
        />
        <div
          className="phone-content"
          style={{
            padding: "18px 16px 24px",
            background:
              "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.82)), url('/phone/article-bg.png') center/cover no-repeat",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            {postList.map((post) => (
              <Link
                key={post.id}
                href={`/phone-items/articles/${publisherRow.slug}/${post.slug}`}
                style={{
                  display: "block",
                  padding: 14,
                  borderRadius: 0,
                  textDecoration: "none",
                  color: "inherit",
                  background: "rgba(255,255,255,0.82)",
                  boxShadow: "0 6px 18px rgba(191, 181, 191, 0.16)",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: "#66606b",
                    marginBottom: 12,
                  }}
                >
                  {post.title}
                </div>

                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    style={{
                      width: "100%",
                      display: "block",
                      aspectRatio: "16 / 8",
                      objectFit: "cover",
                      marginBottom: 12,
                    }}
                  />
                ) : null}

                <div
                  style={{
                    fontSize: 15,
                    color: "#8d8792",
                  }}
                >
                  상세보기
                </div>
              </Link>
            ))}
          </div>
        </div>
        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}