import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";
import { supabase } from "@/lib/supabase/server";
import { deletePhoneItem } from "@/app/admin/actions";
import { isAdmin } from "@/lib/utils/admin-auth";
import {
  CALL_HISTORY_CATEGORIES,
  CALL_HISTORY_CATEGORY_LABEL_MAP,
} from "@/lib/phone/call-history";

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

type CategoryKey =
  | "all"
  | "story"
  | "card"
  | "birthday"
  | "event"
  | "anniversary";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    category?: string;
  }>;
};

type PhoneCallRow = {
  id: string;
  title: string | null;
  slug: string | null;
  subtype: string;
  created_at: string;
  is_published?: boolean | null;
  content_json?: {
    characterKey?: string;
    characterName?: string;
    avatarUrl?: string;
    historyCategory?: string;
    historyCategoryLabel?: string;
    historySummary?: string;
    historySource?: string;
    body?: string;
    isFavorite?: boolean;
    isComplete?: boolean;
  } | null;
};

type HistoryItem = {
  id: string;
  title: string;
  slug: string;
  categoryKey: CategoryKey;
  groupLabel: string;
  metaSummary: string;
  metaSource: string;
  preview: string;
  isFavorite: boolean;
  isComplete: boolean;
  characterKey: string;
  isVideo: boolean;
};

function normalizeCategory(value?: string): CategoryKey {
  if (
    value === "story" ||
    value === "card" ||
    value === "birthday" ||
    value === "event" ||
    value === "anniversary"
  ) {
    return value;
  }

  return "all";
}

function extractPreview(row: PhoneCallRow) {
  return (
    row.content_json?.body?.trim() ||
    row.content_json?.historySummary?.trim() ||
    row.title?.trim() ||
    "미리보기가 없습니다."
  );
}

export default async function CharacterCallArchivePage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCategory = normalizeCategory(resolvedSearchParams?.category);

  const characterLabel = CHARACTER_LABELS[characterKey];
  if (!characterLabel) notFound();

  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, subtype, content_json, is_published")
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    notFound();
  }

  const rows = ((data as PhoneCallRow[] | null) ?? []).filter((row) => {
    return (row.content_json?.characterKey ?? "baiqi") === characterKey;
  });

  if (!rows.length) {
    notFound();
  }

  const characterName =
    rows[0]?.content_json?.characterName ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const allItems: HistoryItem[] = rows.map((row) => {
    const slug = row.slug?.trim() || "";
    const categoryKey = normalizeCategory(row.content_json?.historyCategory);

    return {
      id: String(row.id),
      title: row.title?.trim() || "제목 없음",
      slug,
      categoryKey,
      groupLabel:
        row.content_json?.historyCategoryLabel?.trim() ||
        CALL_HISTORY_CATEGORY_LABEL_MAP[categoryKey] ||
        "스토리",
      metaSummary: row.content_json?.historySummary?.trim() || "",
      metaSource: row.content_json?.historySource?.trim() || "",
      preview: extractPreview(row),
      isFavorite: Boolean(row.content_json?.isFavorite ?? false),
      isComplete: Boolean(row.content_json?.isComplete ?? true),
      characterKey,
      isVideo: row.subtype === "video_call",
    };
  });

  const items =
    selectedCategory === "all"
      ? allItems
      : allItems.filter((item) => item.categoryKey === selectedCategory);

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${characterName} · 통화기록`}
          subtitle={`${items.length}개`}
          backHref={`/phone-items/calls/${characterKey}/history`}
          rightSlot={
            admin ? (
              <div className="history-top-admin">
                <Link
                  href={`/admin/phone-items/new?subtype=call&characterKey=${characterKey}`}
                  className="history-top-admin-btn"
                  aria-label="통화 추가"
                  title="통화 추가"
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
          <div className="message-history-page">
            <div className="message-history-filter-row">
              {CALL_HISTORY_CATEGORIES.map((category) => {
                const active = selectedCategory === category.value;
                const href =
                  category.value === "all"
                    ? `/phone-items/calls/${characterKey}/history/history`
                    : `/phone-items/calls/${characterKey}/history/history?category=${category.value}`;

                return (
                  <Link
                    key={category.value}
                    href={href}
                    className={`message-history-chip ${active ? "active" : ""}`}
                  >
                    {category.label}
                  </Link>
                );
              })}
            </div>

            <div className="message-history-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="message-history-card"
                  style={{ position: "relative" }}
                >
                  <div className="message-history-card-top">
                    <span className="message-history-badge">{item.groupLabel}</span>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {admin ? (
                        <>
                          <Link
                            href={`/admin/phone-items/${item.id}/edit`}
                            className="call-inline-admin-btn"
                            aria-label="수정"
                            title="수정"
                          >
                            <span className="material-symbols-rounded">edit</span>
                          </Link>

                          <form action={deletePhoneItem}>
                            <input type="hidden" name="phoneItemId" value={item.id} />
                            <DeletePhoneItemButton
                              label="삭제"
                              confirmMessage="이 통화를 삭제할까요?"
                              className="call-inline-admin-btn"
                              icon="delete"
                            />
                          </form>
                        </>
                      ) : item.isFavorite ? (
                        <span className="message-history-heart">♡</span>
                      ) : (
                        <span className="message-history-steam">〰</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/phone-items/calls/${item.characterKey}/${item.slug}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "contents",
                    }}
                  >
                    <div className="message-history-title-row">
                      <span className="message-history-title">{item.title}</span>
                      {!item.isComplete ? (
                        <span className="message-history-status">[미완료]</span>
                      ) : null}
                    </div>

                    {item.metaSummary ? (
                      <div className="message-history-meta-summary">
                        {item.metaSummary}
                      </div>
                    ) : null}

                    {item.metaSource ? (
                      <div className="message-history-meta-source">
                        {item.metaSource}
                      </div>
                    ) : null}

                    <div className="message-history-preview">{item.preview}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}