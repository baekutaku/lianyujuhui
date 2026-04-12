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

type ArticleItemRow = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  content_json?: {
    sourceName?: string;
    sourceSlug?: string;
    imageUrl?: string;
  } | null;
};

export default async function PhoneArticleHistoryPage({ params }: PageProps) {
  const { publisherSlug } = await params;

  const { data: items, error } = await supabase
    .from("phone_items")
    .select("id, slug, title, created_at, content_json")
    .eq("subtype", "article")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const articleItems = ((items as ArticleItemRow[] | null) ?? []).filter(
    (item) => (item.content_json?.sourceSlug?.trim() || "news") === publisherSlug
  );

  if (articleItems.length === 0) notFound();

  const publisherName =
    articleItems[0]?.content_json?.sourceName?.trim() || "핫이슈";

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={publisherName}
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
            {articleItems.map((item) => (
<Link
  key={item.id}
  href={`/phone-items/articles/${publisherSlug}/${item.slug}`}
  style={{
    display: "block",
    textDecoration: "none",
    color: "inherit",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(231, 225, 232, 0.9)",
    padding: 10,
  }}
>
  {item.content_json?.imageUrl ? (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <img
        src={item.content_json.imageUrl}
        alt={item.title}
        style={{
          width: "100%",
          display: "block",
          aspectRatio: "16 / 5.2",
          objectFit: "cover",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          fontSize: 12,
          padding: "4px 8px",
          background: "rgba(90,90,90,0.5)",
          color: "white",
        }}
      >
        전체보기
      </span>
    </div>
  ) : null}

  <div
    style={{
      fontSize: 16,
      lineHeight: 1.6,
      color: "#66606b",
      padding: "0 4px 2px",
    }}
  >
    {item.title}
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