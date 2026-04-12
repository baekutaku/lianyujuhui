// app/phone-items/calls/[characterKey]/history/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
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

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
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

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CallHistoryPage({ params }: PageProps) {
  const { characterKey: rawCharacterKey } = await params;
  const characterKey = safeDecode(rawCharacterKey).trim();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, subtype, is_published, content_json")
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const rows = ((data as CallRow[] | null) ?? []).filter((row) => {
    return (row.content_json?.characterKey ?? "baiqi") === characterKey;
  });

  if (!rows.length) notFound();

  const characterName =
    rows[0]?.content_json?.characterName?.trim() ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${characterName} · 통화기록`}
          subtitle={`${rows.length}개`}
          backHref="/phone-items/calls"
        />

        <div className="phone-content">
          <div className="call-history-list">
            {rows.map((row) => {
              const slug = row.slug?.trim() || "";
              if (!slug) return null;

              const avatarUrl =
                row.content_json?.avatarUrl?.trim() ||
                DEFAULT_AVATAR_MAP[characterKey] ||
                "/profile/baiqi.png";

              return (
                <Link
                  key={row.id}
                  href={`/phone-items/calls/${characterKey}/${slug}`}
                  className="call-history-item"
                >
                  <img
                    src={avatarUrl}
                    alt={characterName}
                    className="phone-avatar"
                  />

                  <div className="call-main">
                    <div className="call-name">{characterName}</div>
                    <div className="call-title">
                      {row.title?.trim() || "제목 없음"}
                    </div>
                  </div>

                  <div className="call-action">
                    <span className="material-symbols-rounded">call</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}