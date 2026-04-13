import Link from "next/link";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageInboxList from "@/components/phone/message/MessageInboxList";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";

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

const MAIN_CHARACTER_ORDER = [
  "baiqi",
  "lizeyan",
  "zhouqiluo",
  "xumo",
  "lingxiao",
] as const;

type PhoneItemRow = {
  id: string;
  title: string | null;
  slug: string | null;
  preview_text?: string | null;
  created_at: string;
  is_published: boolean | null;
  content_json?: {
    threadKey?: string;
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
    level?: number;
    preview?: string;
    historySummary?: string;
    entries?: unknown[];
    editorEntries?: unknown[];
  } | null;
};

type InboxItem = {
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  level?: number;
  preview: string;
  slug: string;
  createdAt: string;
};

function getPreview(item: PhoneItemRow) {
  const json = item.content_json ?? {};

  if (typeof json.preview === "string" && json.preview.trim()) {
    return json.preview;
  }

  if (typeof item.preview_text === "string" && item.preview_text.trim()) {
    return item.preview_text;
  }

  if (typeof json.historySummary === "string" && json.historySummary.trim()) {
    return json.historySummary;
  }

  if (typeof item.title === "string" && item.title.trim()) {
    return item.title;
  }

  return "메시지 기록";
}

function isMainCharacter(characterKey: string) {
  return MAIN_CHARACTER_ORDER.includes(
    characterKey as (typeof MAIN_CHARACTER_ORDER)[number]
  );
}

function getCharacterPriority(characterKey: string) {
  if (characterKey === "baiqi") return 0;

  if (
    characterKey === "lizeyan" ||
    characterKey === "zhouqiluo" ||
    characterKey === "xumo" ||
    characterKey === "lingxiao"
  ) {
    return 1;
  }

  return 2;
}

function getGroupingKey(item: PhoneItemRow) {
  const characterKey = item.content_json?.characterKey?.trim() || "npc";
  const slug = item.slug?.trim() || "";
  const threadKey = item.content_json?.threadKey?.trim() || "";

  if (isMainCharacter(characterKey)) {
    return `main:${characterKey}`;
  }

  return `etc:${threadKey || slug || item.id}`;
}

export default async function MessagesPage() {
  const admin = await isAdmin();

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
          <PhoneTopBar
            title="메시지"
            subtitle="최근 대화"
            rightSlot={
              admin ? (
                <div className="history-top-admin">
                  <Link
                    href="/admin/phone-items/new?subtype=message"
                    className="history-top-admin-btn"
                    aria-label="메시지 추가"
                    title="메시지 추가"
                  >
                    <span className="material-symbols-rounded">add</span>
                  </Link>

                  <Link
                    href="/admin/phone-items"
                    className="history-top-admin-btn"
                    aria-label="휴대폰 관리"
                    title="휴대폰 관리"
                  >
                    <span className="material-symbols-rounded">settings</span>
                  </Link>
                </div>
              ) : null
            }
          />
          <div className="phone-content">
            <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
          </div>
          <PhoneTabNav currentPath="/phone-items/messages" />
        </PhoneShell>
      </main>
    );
  }

  const rows = (data as PhoneItemRow[] | null) ?? [];
  const latestByGroup = new Map<string, InboxItem>();

  for (const item of rows) {
    const characterKey = item.content_json?.characterKey?.trim() || "npc";
    const slug = item.slug?.trim() || "";
    if (!slug) continue;

    const groupKey = getGroupingKey(item);
    if (latestByGroup.has(groupKey)) continue;

    latestByGroup.set(groupKey, {
      characterKey,
      characterName:
        item.content_json?.characterName?.trim() ||
        DEFAULT_NAME_MAP[characterKey] ||
        "기타",
      avatarUrl:
        item.content_json?.avatarUrl?.trim() ||
        DEFAULT_AVATAR_MAP[characterKey] ||
        "/profile/npc.png",
      level:
        typeof item.content_json?.level === "number"
          ? item.content_json.level
          : undefined,
      preview: getPreview(item),
      slug,
      createdAt: item.created_at,
    });
  }

  const items = Array.from(latestByGroup.values()).sort((a, b) => {
    const priorityDiff =
      getCharacterPriority(a.characterKey) - getCharacterPriority(b.characterKey);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title="메시지"
          subtitle="최근 대화"
          rightSlot={
            admin ? (
              <div className="history-top-admin">
                <Link
                  href="/admin/phone-items/new?subtype=message"
                  className="history-top-admin-btn"
                  aria-label="메시지 추가"
                  title="메시지 추가"
                >
                  <span className="material-symbols-rounded">add</span>
                </Link>

                <Link
                  href="/admin/phone-items"
                  className="history-top-admin-btn"
                  aria-label="휴대폰 관리"
                  title="휴대폰 관리"
                >
                  <span className="material-symbols-rounded">settings</span>
                </Link>
              </div>
            ) : null
          }
        />
        <div className="phone-content">
          <MessageInboxList items={items} />
        </div>
        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}