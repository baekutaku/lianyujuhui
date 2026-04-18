import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageThreadView from "@/components/phone/message/MessageThreadView";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";

type ThreadEntries = Parameters<typeof MessageThreadView>[0]["entries"];

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
    slug: string;
  }>;
};

type MessageThreadRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  is_published?: boolean | null;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
    entries?: unknown[];
    editorEntries?: unknown[];
  } | null;
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
  const { characterKey, slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug).trim();
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .eq("slug", slug)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) notFound();

  const rows = (data as MessageThreadRow[] | null) ?? [];

  const item =
    rows.find(
      (row) => (row.content_json?.characterKey ?? "baiqi") === characterKey
    ) ?? null;

  if (!item) notFound();

  const characterName =
    item.content_json?.characterName ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const avatarUrl =
    item.content_json?.avatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[characterKey] ||
    "/profile/baiqi.png";

  const entries: ThreadEntries = Array.isArray(item.content_json?.editorEntries)
    ? (item.content_json.editorEntries as ThreadEntries)
    : Array.isArray(item.content_json?.entries)
      ? (item.content_json.entries as ThreadEntries)
      : [];

  const otherProfileHref = `/phone-items/me/${characterKey}`;
  const myProfileHref = "/phone-items/me";

  const smallAdminIconStyle = {
    width: 24,
    height: 24,
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#f7eef7",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    opacity: 0.78,
    flex: "0 0 auto",
  } as const;

return (
  <main className="phone-page phone-page-message-thread">
    <PhoneShell>
   <PhoneTopBar
  title={item.title?.trim() || characterName}
  subtitle={characterName}
  backHref="/phone-items/messages"
  variant="message"
  artMode="after"
          rightSlot={
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {admin ? (
                <>
                  <Link
                    href={`/admin/phone-items/${item.id}/edit`}
                    aria-label="수정"
                    title="수정"
                    style={smallAdminIconStyle}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 14, lineHeight: 1 }}
                    >
                      edit
                    </span>
                  </Link>

                  <Link
                    href="/admin/phone-items"
                    aria-label="휴대폰 관리"
                    title="휴대폰 관리"
                    style={smallAdminIconStyle}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 14, lineHeight: 1 }}
                    >
                      settings
                    </span>
                  </Link>
                </>
              ) : null}

             <Link
  href={`/phone-items/messages/${characterKey}/history`}
  className="phone-topbar-icon-button phone-topbar-history-button"
  aria-label="대화기록"
  title="대화기록"
>
  <span className="sr-only">대화기록</span>
</Link>
            </div>
          }
        />

        <div className="phone-content">
        <MessageThreadView
          avatarUrl={avatarUrl}
          entries={entries}
          otherProfileHref={otherProfileHref}
          myProfileHref={myProfileHref}
        />
      </div>

        {/* <PhoneTabNav currentPath="/phone-items/messages" /> */}
      </PhoneShell>
    </main>
  );
}