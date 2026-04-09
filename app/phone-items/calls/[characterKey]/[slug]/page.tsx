import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import CallDetail from "@/components/phone/call/CallDetail";

const CALL_DETAIL_MAP = {
  baiqi: {
    "honor-menu": {
      characterName: "백기",
      title: "명절 메뉴",
      coverImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop",
      youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      body: "명절 메뉴 관련 통화 더미 데이터",
    },
    "gift-of-flowers": {
      characterName: "백기",
      title: "뜻밖의 선물",
      coverImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop",
      youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      body: "뜻밖의 선물 관련 통화 더미 데이터",
    },
    peace: {
      characterName: "백기",
      title: "평온",
      coverImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop",
      youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      body: "평온 영상통화 더미 데이터",
    },
  },
  xumo: {
    seedling: {
      characterName: "허묵",
      title: "새싹",
      coverImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop",
      youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      body: "허묵 새싹 통화 더미 데이터",
    },
  },
} as const;

type PageProps = {
  params: Promise<{
    characterKey: string;
    slug: string;
  }>;
};

export default async function CallDetailPage({ params }: PageProps) {
  const { characterKey, slug } = await params;

  const characterGroup =
    CALL_DETAIL_MAP[characterKey as keyof typeof CALL_DETAIL_MAP];

  if (!characterGroup) notFound();

  const detail =
    characterGroup[slug as keyof typeof characterGroup];

  if (!detail) notFound();

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="통화중…" subtitle={detail.characterName} />
        <div className="phone-content">
          <CallDetail
            characterName={detail.characterName}
            title={detail.title}
            coverImage={detail.coverImage}
            youtubeEmbedUrl={detail.youtubeEmbedUrl}
            body={detail.body}
          />
        </div>
      </PhoneShell>
    </main>
  );
}