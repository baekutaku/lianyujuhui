import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import MomentPostDetail from "@/components/phone/moment/MomentPostDetail";
import ArticleDetail from "@/components/phone/article/ArticleDetail";
import CallDetail from "@/components/phone/call/CallDetail";
import { PHONE_DETAIL_MAP } from "@/lib/phone-items";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PhoneItemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = PHONE_DETAIL_MAP[slug as keyof typeof PHONE_DETAIL_MAP];

  if (!detail) notFound();

  return (
    <main className="phone-detail-page">
      <PhoneShell>
        <div className="phone-shell-inner">
          {"type" in detail && (detail.type === "call" || detail.type === "video_call") ? (
            <>
              <PhoneTopBar title="통화중…" subtitle={detail.characterName} />
              <CallDetail
                characterName={detail.characterName}
                title={detail.title}
                coverImage={detail.coverImage}
                youtubeEmbedUrl={detail.youtubeEmbedUrl}
                body={detail.body}
              />
            </>
          ) : null}

          {"type" in detail && detail.type === "article" ? (
            <>
              <PhoneTopBar title={detail.sourceName ?? "핫이슈"} />
              <ArticleDetail
                title={detail.title}
                author={detail.author}
                sourceName={detail.sourceName}
                imageUrl={detail.imageUrl}
                body={detail.body}
              />
            </>
          ) : null}

          {"type" in detail && detail.type === "moment" ? (
            <>
              <PhoneTopBar title={detail.authorName} subtitle="모멘트" />
              <MomentPostDetail
                authorName={detail.authorName}
                authorAvatar={detail.authorAvatar}
                authorLevel={detail.authorLevel}
                body={detail.body}
                imageUrl={detail.imageUrl}
                quoteText={detail.quoteText}
              />
            </>
          ) : null}
        </div>
      </PhoneShell>
    </main>
  );
}