import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import { supabase } from "@/lib/supabase/server";
import CallDetail from "@/components/phone/call/CallDetail";

type PageProps = {
  params: Promise<{
    characterKey: string;
    slug: string;
  }>;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
};

const DEFAULT_CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

export default async function CallDetailPage({ params }: PageProps) {
  const { characterKey, slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);

  const { data: item, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, embed_url, content_json, is_published")
    .eq("slug", slug)
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .maybeSingle();

  if (error || !item) notFound();

  const savedCharacterKey = item.content_json?.characterKey ?? "";
  if (savedCharacterKey && savedCharacterKey !== characterKey) {
    notFound();
  }

  const resolvedCharacterKey = savedCharacterKey || characterKey;
  const resolvedCharacterName =
    item.content_json?.characterName ||
    DEFAULT_CHARACTER_NAME_MAP[resolvedCharacterKey] ||
    "이름 없음";

  const resolvedCover =
    item.content_json?.coverImage?.trim() ||
    DEFAULT_AVATAR_MAP[resolvedCharacterKey] ||
    "/profile/baiqi.png";

 const translationHtml = item.content_json?.translationHtml ?? "";
  const memoHtml = item.content_json?.memoHtml ?? "";
  const youtubeUrlCn = item.content_json?.youtubeUrlCn ?? item.embed_url ?? "";
  const youtubeUrlKr = item.content_json?.youtubeUrlKr ?? "";

return (
  <main className="phone-page phone-call-detail-page">
    <div className="call-detail-layout">
      <PhoneShell>
        <CallDetail
          characterName={resolvedCharacterName}
          title={item.title}
          coverImage={resolvedCover}
          youtubeEmbedUrl={youtubeUrlCn}
          youtubeEmbedUrlKr={youtubeUrlKr}
          body={item.content_json?.body ?? ""}
        />
      </PhoneShell>

      {translationHtml || memoHtml ? (
        <aside className="call-detail-side">
          {translationHtml ? (
            <section className="call-detail-rich call-detail-translation">
              <div className="call-detail-rich-title">번역</div>
              <div
                className="call-detail-rich-body"
                dangerouslySetInnerHTML={{ __html: translationHtml }}
              />
            </section>
          ) : null}

          {memoHtml ? (
            <section className="call-detail-rich call-detail-memo">
              <div className="call-detail-rich-title">작업 기록</div>
              <div
                className="call-detail-rich-body call-detail-memo-body"
                dangerouslySetInnerHTML={{ __html: memoHtml }}
              />
            </section>
          ) : null}
        </aside>
      ) : null}
    </div>
  </main>
);
}