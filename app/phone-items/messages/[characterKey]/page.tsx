import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageThreadView from "@/components/phone/message/MessageThreadView";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentViewerProfile } from "@/lib/phone/get-current-viewer-profile";
import {
  DEFAULT_AVATAR_MAP,
  DEFAULT_NAME_MAP,
  isKnownCharacter,
} from "@/lib/message-constants";

type PageProps = {
  params: Promise<{ characterKey: string }>;
  searchParams?: Promise<{ slug?: string }>;
};

export default async function CharacterMessagePage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabase();
  const { characterKey } = await params;
  const resolved = searchParams ? await searchParams : {};
  const viewerProfile = await getCurrentViewerProfile();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const rows = data ?? [];

  let item: (typeof rows)[number] | undefined;

  if (isKnownCharacter(characterKey)) {
    // 알려진 캐릭터: characterKey 매칭 후 가장 최신 1건
    item = rows.find(
      (row) => (row.content_json?.characterKey?.trim() ?? "npc") === characterKey
    );
  } else {
    // NPC: slug로 특정 문자 직접 조회 (searchParams로 slug 전달)
    const targetSlug = resolved.slug;
    if (targetSlug) {
      item = rows.find((row) => row.slug?.trim() === targetSlug);
    } else {
      // slug 없으면 같은 이름의 가장 최신 것
      item = rows.find(
        (row) => (row.content_json?.characterKey?.trim() ?? "npc") === characterKey
      );
    }
  }

  if (!item) notFound();

  const characterName =
    item.content_json?.characterName ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const avatarUrl =
    item.content_json?.avatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[characterKey] ||
    "/profile/npc.png";

  const entries = Array.isArray(item.content_json?.editorEntries)
    ? item.content_json.editorEntries
    : Array.isArray(item.content_json?.entries)
      ? item.content_json.entries
      : [];

  const otherProfileHref = `/phone-items/me/${characterKey}`;
  const myProfileHref = "/phone-items/me";

  // 히스토리 링크: known은 항상 있음, NPC도 히스토리 페이지로
  const historyHref = `/phone-items/messages/${characterKey}/history`;

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={item.title?.trim() || characterName}
          subtitle={characterName}
          backHref="/phone-items/messages"
          rightSlot={
            <Link
              href={historyHref}
              className="phone-topbar-icon-button phone-topbar-history-button"
              aria-label="대화기록"
              title="대화기록"
            >
              <span className="sr-only">대화기록</span>
            </Link>
          }
        />
        <div className="phone-content">
          <MessageThreadView
            avatarUrl={avatarUrl}
            myAvatarUrl={viewerProfile.avatarUrl}
            entries={entries}
            otherProfileHref={otherProfileHref}
            myProfileHref={myProfileHref}
          />
        </div>
        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}
