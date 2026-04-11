import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageThreadView from "@/components/phone/message/MessageThreadView";
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
    threadKey: string;
  }>;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CharacterMessageThreadPage({
  params,
}: PageProps) {
  const { characterKey, threadKey: rawThreadKey } = await params;
  const threadKey = safeDecode(rawThreadKey).trim();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const rows = data ?? [];

  const item =
    rows.find((row) => {
      const rowCharacterKey = row.content_json?.characterKey ?? "baiqi";
      const rowThreadKey = (row.content_json?.threadKey ?? "").trim();
      const rowSlug = (row.slug ?? "").trim();

      return (
        rowCharacterKey === characterKey &&
        (rowThreadKey === threadKey || rowSlug === threadKey)
      );
    }) ||
    rows.find((row) => {
      const rowSlug = (row.slug ?? "").trim();
      return rowSlug === threadKey;
    });

  if (!item) notFound();

  const characterName =
    DEFAULT_NAME_MAP[characterKey] ||
    item.content_json?.characterName ||
    "이름 없음";

  const avatarUrl =
    DEFAULT_AVATAR_MAP[characterKey] ||
    item.content_json?.avatarUrl?.trim() ||
    "/profile/baiqi.png";

  const entries = Array.isArray(item.content_json?.editorEntries)
    ? item.content_json.editorEntries
    : Array.isArray(item.content_json?.entries)
      ? item.content_json.entries
      : [];

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={item.title?.trim() || characterName}
          subtitle={characterName}
          backHref="/phone-items/messages"
          rightSlot={
            <Link
              href={`/phone-items/messages/${characterKey}/history`}
              className="phone-topbar-icon-button"
              aria-label="대화기록"
              title="대화기록"
            >
              <span className="material-symbols-rounded">history</span>
            </Link>
          }
        />

        <div className="phone-content">
          <MessageThreadView avatarUrl={avatarUrl} entries={entries} />
        </div>

        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}