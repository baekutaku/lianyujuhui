import Link from "next/link";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
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

type CallRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  subtype: string;
  is_published: boolean | null;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
  } | null;
};

type CallItem = {
  id: string;
  slug: string;
  subtype: string;
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  title: string;
  createdAt: string;
};

export default async function CallsPage() {
  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, subtype, is_published, content_json")
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as CallRow[] | null) ?? [];

  const items: CallItem[] = rows
    .map((row) => {
      const characterKey = row.content_json?.characterKey?.trim() || "baiqi";
      const slug = row.slug?.trim() || "";
      if (!slug) return null;

      return {
  id: String(row.id),
  slug,
  subtype: row.subtype,
  characterKey,
  characterName:
    row.content_json?.characterName?.trim() ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음",
  avatarUrl:
    row.content_json?.avatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[characterKey] ||
    "/profile/baiqi.png",
  title: row.title?.trim() || "제목 없음",
  createdAt: row.created_at,
};
    })
    .filter(Boolean) as CallItem[];

  const latestBaiqi = items.find((item) => item.characterKey === "baiqi");

  const orderedItems = latestBaiqi
    ? [latestBaiqi, ...items.filter((item) => item.id !== latestBaiqi.id)]
    : items;

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="통화" subtitle="최근 통화" />
        <div className="phone-content">
          <div className="call-history-list">
            {orderedItems.map((item) => (
              <Link
                key={item.id}
                href={`/phone-items/calls/${item.characterKey}/${item.slug}`}
                className="call-history-item"
              >
                <img
                  src={item.avatarUrl}
                  alt={item.characterName}
                  className="phone-avatar"
                />

                <div className="call-main">
                  <div className="call-name">{item.characterName}</div>
                  <div className="call-title">{item.title}</div>
                </div>

<div className="call-action">
  <span className="material-symbols-rounded">
    {item.subtype === "video_call" ? "videocam" : "volume_up"}
  </span>
</div>
              </Link>
            ))}
          </div>
        </div>
        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}