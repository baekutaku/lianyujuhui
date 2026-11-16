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

const CHARACTER_LABELS: Record<string, string> = {
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
  searchParams?: Promise<{ sort?: string }>;
};

type PhoneCallRow = {
  id: string;
  title: string | null;
  slug: string | null;
  subtype: string;
  created_at: string;
  release_year?: number | null;
  release_date?: string | null;
  is_published?: boolean | null;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
  } | null;
};


type SortMode = "release" | "recent";

function normalizeSortMode(value?: string): SortMode {
  return value === "recent" ? "recent" : "release";
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compareByPhoneDate(
  a: { release_year?: number | null; release_date?: string | null; created_at: string },
  b: { release_year?: number | null; release_date?: string | null; created_at: string },
  sortMode: SortMode
) {
  if (sortMode === "recent") {
    return dateValue(b.created_at) - dateValue(a.created_at);
  }
  const yearDiff = (b.release_year ?? 0) - (a.release_year ?? 0);
  if (yearDiff !== 0) return yearDiff;
  const releaseDateDiff = dateValue(b.release_date) - dateValue(a.release_date);
  if (releaseDateDiff !== 0) return releaseDateDiff;
  return dateValue(b.created_at) - dateValue(a.created_at);
}

export default async function CharacterCallsPage({ params, searchParams }: PageProps) {
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedSort = normalizeSortMode(resolvedSearchParams.sort);
  const characterLabel = CHARACTER_LABELS[characterKey];

  if (!characterLabel) notFound();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, created_at, release_year, release_date, is_published, content_json")
    .eq("is_published", true)
    .in("subtype", ["call", "video_call"])
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="phone-page">
        <PhoneShell>
          <PhoneTopBar
            title={characterLabel}
            subtitle="최근 통화"
            backHref="/phone-items/calls"
          />
          <div className="phone-content">
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          </div>
          <PhoneTabNav currentPath="/phone-items/calls" />
        </PhoneShell>
      </main>
    );
  }

  const rows = ((data as PhoneCallRow[] | null) ?? [])
    .filter((item) => item.content_json?.characterKey === characterKey)
    .sort((a, b) => compareByPhoneDate(a, b, selectedSort));

  if (!rows.length) notFound();

  const items = rows
    .map((item) => {
      const slug = item.slug?.trim() || "";
      if (!slug) return null;

      return {
        id: String(item.id),
        slug,
        characterKey,
        characterName:
          item.content_json?.characterName?.trim() ||
          DEFAULT_NAME_MAP[characterKey] ||
          characterLabel,
        avatarUrl:
          item.content_json?.avatarUrl?.trim() ||
          DEFAULT_AVATAR_MAP[characterKey] ||
          "/profile/baiqi.png",
        title: item.title?.trim() || "통화 기록",
        isVideo: item.subtype === "video_call",
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      slug: string;
      characterKey: string;
      characterName: string;
      avatarUrl: string;
      title: string;
      isVideo?: boolean;
    }>;

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${characterLabel} · 통화기록`}
          subtitle={`${items.length}개`}
          backHref="/phone-items/calls"
          rightSlot={
            <Link
              href={`/phone-items/calls/${characterKey}/history/history`}
              className="phone-topbar-icon-button"
              aria-label="통화 히스토리"
              title="통화 히스토리"
            >
              <span className="material-symbols-rounded">more_horiz</span>
            </Link>
          }
        />

        <div className="phone-content">
          <div className="message-history-filter-row" style={{ marginBottom: 12 }}>
            <Link href={`/phone-items/calls/${characterKey}/history`} className={`message-history-chip ${selectedSort === "release" ? "active" : ""}`}>
              출시순
            </Link>
            <Link href={`/phone-items/calls/${characterKey}/history?sort=recent`} className={`message-history-chip ${selectedSort === "recent" ? "active" : ""}`}>
              최근 등록순
            </Link>
          </div>

          <div className="call-history-list">
            {items.map((item) => (
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
                    {item.isVideo ? "videocam" : "volume_up"}
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