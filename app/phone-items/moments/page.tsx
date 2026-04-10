import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MomentFeed from "@/components/phone/moment/MomentFeed";
import { supabase } from "@/lib/supabase/server";

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
  mc: "유연",
};

export default async function MomentsPage() {
  const { data: items, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, content_json, is_published")
    .eq("subtype", "moment")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="phone-page">
        <PhoneShell>
          <PhoneTopBar title="모멘트" />
          <div className="phone-content">
            <div className="phone-empty">모멘트를 불러오지 못했습니다.</div>
          </div>
          <PhoneTabNav currentPath="/phone-items/moments" />
        </PhoneShell>
      </main>
    );
  }

  const feedItems =
    items?.flatMap((item) => {
      const json = item.content_json ?? {};

      // update 로직에서 posts 배열로 저장된 경우도 처리
      if (Array.isArray(json.posts) && json.posts.length > 0) {
        return json.posts.map((post: any, index: number) => {
          const key = post.characterKey ?? json.characterKey ?? "baiqi";
          const images = Array.isArray(post.images) ? post.images : [];

          return {
            id: `${item.id}-${index}`,
            characterKey: key,
            authorName:
              post.authorName ??
              json.authorName ??
              DEFAULT_CHARACTER_NAME_MAP[key] ??
              "이름 없음",
            authorAvatar:
              post.authorAvatar?.trim() ||
              json.authorAvatar?.trim() ||
              DEFAULT_AVATAR_MAP[key] ||
              "/profile/baiqi.png",
            authorLevel: post.authorLevel ?? json.authorLevel ?? undefined,
            body: post.body ?? "",
            imageUrl: images[0] ?? undefined,
            quoteText: post.quoteText ?? undefined,
          };
        });
      }

      // create 로직에서 개별 row로 저장된 경우 처리
      const key = json.characterKey ?? "baiqi";
      const images = Array.isArray(json.images) ? json.images : [];

      return [
        {
          id: item.id,
          characterKey: key,
          authorName:
            json.authorName ??
            DEFAULT_CHARACTER_NAME_MAP[key] ??
            "이름 없음",
          authorAvatar:
            json.authorAvatar?.trim() ||
            DEFAULT_AVATAR_MAP[key] ||
            "/profile/baiqi.png",
          authorLevel: json.authorLevel ?? undefined,
          body: json.body ?? item.title ?? "",
          imageUrl: images[0] ?? undefined,
          quoteText: json.quoteText ?? undefined,
        },
      ];
    }) ?? [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title="모멘트"
          rightSlot={<a className="phone-topbar-button">모멘트 작성</a>}
        />
        <div className="phone-content">
          {feedItems.length > 0 ? (
            <MomentFeed items={feedItems} />
          ) : (
            <div className="phone-empty">등록된 모멘트가 없습니다.</div>
          )}
        </div>
        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}