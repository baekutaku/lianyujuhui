import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import CallHistoryList from "@/components/phone/call/CallHistoryList";
import { supabase } from "@/lib/supabase/server";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const DEFAULT_CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

export default async function CallsPage() {
  const { data: items, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, content_json, is_published")
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="phone-page">
        <PhoneShell>
          <PhoneTopBar title="통화 기록" />
          <div className="phone-content">
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          </div>
          <PhoneTabNav currentPath="/phone-items/calls" />
        </PhoneShell>
      </main>
    );
  }

  const mapped =
    items?.map((item) => {
      const characterKey = item.content_json?.characterKey ?? "baiqi";

      return {
        slug: safeDecode(item.slug),
        characterKey,
        characterName:
          item.content_json?.characterName ??
          DEFAULT_CHARACTER_NAME_MAP[characterKey] ??
          "이름 없음",
        avatarUrl: item.content_json?.avatarUrl ?? "",
        level: item.content_json?.level ?? undefined,
        title: item.title,
        isVideo: item.subtype === "video_call",
      };
    }) ?? [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="통화 기록" />
        <div className="phone-content">
          <CallHistoryList items={mapped} />
        </div>
        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}