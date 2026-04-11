import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import CallHistoryList from "@/components/phone/call/CallHistoryList";
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

type PhoneCallRow = {
  id: string;
  title: string | null;
  slug: string | null;
  subtype: string;
  created_at: string;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
    level?: number;
  } | null;
};

type CallItem = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  slug: string;
  title: string;
  isVideo?: boolean;
  createdAt: string;
};

export default async function CallsPage() {
  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, created_at, content_json")
    .eq("is_published", true)
    .in("subtype", ["call", "video_call"])
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="phone-page">
        <PhoneShell>
          <PhoneTopBar title="음성" subtitle="최근 통화" />
          <div className="phone-content">
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          </div>
          <PhoneTabNav currentPath="/phone-items/calls" />
        </PhoneShell>
      </main>
    );
  }

  const rows = (data as PhoneCallRow[] | null) ?? [];
  const latestByCharacter = new Map<string, CallItem>();

  for (const item of rows) {
    const characterKey = item.content_json?.characterKey?.trim() || "baiqi";
    if (latestByCharacter.has(characterKey)) continue;

    const slug = item.slug?.trim() || "";
    if (!slug) continue;

    latestByCharacter.set(characterKey, {
      characterKey,
      characterName:
        item.content_json?.characterName?.trim() ||
        DEFAULT_NAME_MAP[characterKey] ||
        "이름 없음",
      avatarUrl:
        item.content_json?.avatarUrl?.trim() ||
        DEFAULT_AVATAR_MAP[characterKey] ||
        "/profile/baiqi.png",
      level:
        typeof item.content_json?.level === "number"
          ? item.content_json.level
          : undefined,
      slug,
      title: item.title?.trim() || "통화 기록",
      isVideo: item.subtype === "video_call",
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
        <PhoneTopBar title="음성" subtitle="최근 통화" />
        <div className="phone-content">
          <CallHistoryList items={items} />
        </div>
        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}