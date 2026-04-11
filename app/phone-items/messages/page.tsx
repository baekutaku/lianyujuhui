import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageInboxList from "@/components/phone/message/MessageInboxList";
import { supabase } from "@/lib/supabase/server";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

type InboxItem = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  preview: string;
  threadKey: string;
  createdAt: string;
};

export default async function MessagesPage() {
  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, preview_text, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="phone-page">
        <PhoneShell>
          <PhoneTopBar title="메시지" />
          <div className="phone-content">
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          </div>
          <PhoneTabNav currentPath="/phone-items/messages" />
        </PhoneShell>
      </main>
    );
  }

  const latestByCharacter = new Map<string, InboxItem>();

  for (const item of data ?? []) {
    const characterKey = item.content_json?.characterKey || "baiqi";
    if (latestByCharacter.has(characterKey)) continue;

    const threadKey =
      item.content_json?.threadKey?.trim() ||
      item.slug?.trim() ||
      "";

    if (!threadKey) continue;

    latestByCharacter.set(characterKey, {
      characterKey,
      characterName:
        item.content_json?.characterName ||
        DEFAULT_NAME_MAP[characterKey] ||
        "이름 없음",
      avatarUrl:
        item.content_json?.avatarUrl?.trim() ||
        DEFAULT_AVATAR_MAP[characterKey] ||
        "",
      level:
        typeof item.content_json?.level === "number"
          ? item.content_json.level
          : undefined,
      preview:
        item.content_json?.preview ||
        item.preview_text ||
        item.title ||
        "",
      threadKey,
      createdAt: item.created_at,
    });
  }

  const items = Array.from(latestByCharacter.values()).sort((a, b) => {
    if (a.characterKey === "baiqi" && b.characterKey !== "baiqi") return -1;
    if (a.characterKey !== "baiqi" && b.characterKey === "baiqi") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="메시지" />
        <div className="phone-content">
          <MessageInboxList items={items} />
        </div>
        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}