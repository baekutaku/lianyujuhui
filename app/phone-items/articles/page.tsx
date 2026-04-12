import Link from "next/link";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";

type ArticleItemRow = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  is_published: boolean;
  content_json?: {
    sourceName?: string;
    sourceSlug?: string;
    iconUrl?: string;
  } | null;
};

type PublisherSummary = {
  slug: string;
  name: string;
  iconUrl: string;
  latestTitle: string;
  createdAt: string;
};

const ARTICLE_PUBLISHERS = [
  { slug: "news-preview", label: "뉴스 미리보기", icon: "/article/news-preview.png" },
  { slug: "bonjour-francais", label: "오늘의 불어", icon: "/article/bonjour-francais.png" },
  { slug: "ym-communication", label: "스캔들 공작소", icon: "/article/scandal-lab.png" },
  { slug: "romirro-diner", label: "연모식도락", icon: "/article/romirro-diner.png" },
  { slug: "entertainverse", label: "연예버스", icon: "/article/entertainverse.png" },
] as const;

export default async function PhoneArticlesPage() {
  const { data: items, error } = await supabase
    .from("phone_items")
    .select("id, slug, title, created_at, is_published, content_json")
    .eq("subtype", "article")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const articleItems = (items as ArticleItemRow[] | null) ?? [];
  const publisherMap = new Map<string, PublisherSummary>();

  for (const publisher of ARTICLE_PUBLISHERS) {
    publisherMap.set(publisher.slug, {
      slug: publisher.slug,
      name: publisher.label,
      iconUrl: publisher.icon,
      latestTitle: "",
      createdAt: "",
    });
  }

  for (const item of articleItems) {
    const sourceSlug = item.content_json?.sourceSlug?.trim() || "";
    if (!sourceSlug || !publisherMap.has(sourceSlug)) continue;

    const existing = publisherMap.get(sourceSlug)!;
    if (existing.createdAt && existing.createdAt >= item.created_at) continue;

    publisherMap.set(sourceSlug, {
      slug: sourceSlug,
      name: item.content_json?.sourceName?.trim() || existing.name,
      iconUrl: item.content_json?.iconUrl?.trim() || existing.iconUrl,
      latestTitle: item.title,
      createdAt: item.created_at,
    });
  }

  const publisherList = ARTICLE_PUBLISHERS.map((publisher) => {
    const data = publisherMap.get(publisher.slug)!;
    return {
      slug: data.slug,
      name: data.name,
      iconUrl: data.iconUrl,
      latestTitle: data.latestTitle || "등록된 기사가 없습니다.",
    };
  });

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
          {publisherList.map((publisher) => (
            <Link
              key={publisher.slug}
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
                src={publisher.iconUrl}
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
                    fontWeight: 500,
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
                  }}
                >
                  {publisher.latestTitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}