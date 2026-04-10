import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import ArticleDetail from "@/components/phone/article/ArticleDetail";
import { ARTICLE_DETAIL_MAP } from "@/lib/phone-items";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ArticleDetailEntry =
  (typeof ARTICLE_DETAIL_MAP)[keyof typeof ARTICLE_DETAIL_MAP];

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const detail = ARTICLE_DETAIL_MAP[
    slug as keyof typeof ARTICLE_DETAIL_MAP
  ] as ArticleDetailEntry | undefined;

  if (!detail) notFound();

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title={detail.sourceName ?? "핫이슈"} />
        <div className="phone-content">
          <ArticleDetail
            title={detail.title}
            author={detail.author}
            sourceName={detail.sourceName}
            imageUrl={detail.imageUrl}
            body={detail.body}
          />
        </div>
        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}