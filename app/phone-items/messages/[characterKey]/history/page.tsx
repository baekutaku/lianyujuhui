import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";
import { deletePhoneItem } from "@/app/admin/actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import {
  DEFAULT_NAME_MAP,
  isKnownCharacter,
} from "@/lib/message-constants";

const CATEGORY_KEYS = ["all", "daily", "companion", "card_story", "main_story"] as const;
const CATEGORY_LABEL_MAP: Record<string, string> = {
  daily: "일상",
  companion: "동반",
  card_story: "카드",
  main_story: "메인스토리",
};
type CategoryKey = (typeof CATEGORY_KEYS)[number];

type PageProps = {
  params: Promise<{ characterKey: string }>;
  searchParams?: Promise<{ category?: string }>;
};

type MessageHistoryRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  is_published?: boolean | null;
  content_json?: {
    threadKey?: string;
    characterKey?: string;
    characterName?: string;
    historyCategory?: string;
    historyCategoryLabel?: string;
    historySummary?: string;
    historySource?: string;
    preview?: string;
    entries?: unknown[];
    editorEntries?: unknown[];
    isComplete?: boolean;
    isFavorite?: boolean;
  } | null;
};

function normalizeCategory(value?: string): CategoryKey {
  if (
    value === "daily" ||
    value === "companion" ||
    value === "card_story" ||
    value === "main_story"
  )
    return value;
  return "all";
}

function extractPreview(entries: unknown): string {
  if (!Array.isArray(entries)) return "";
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const type = (entry as { type?: string }).type;
    if (type === "text") {
      const text = String((entry as { text?: string }).text ?? "").trim();
      if (text) return text;
    }
    if (type === "system") {
      const text = String((entry as { text?: string }).text ?? "").trim();
      if (text) return text;
    }
  }
  return "";
}

export default async function MessageHistoryPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabase();
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCategory = normalizeCategory(resolvedSearchParams?.category);
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const allRows = (data as MessageHistoryRow[] | null) ?? [];

  let rows: MessageHistoryRow[];

  if (isKnownCharacter(characterKey)) {
    // 알려진 캐릭터: characterKey 매칭
    rows = allRows.filter(
      (row) => (row.content_json?.characterKey?.trim() ?? "npc") === characterKey
    );
  } else {
    // NPC: characterKey 자체가 NPC 식별자 (slug 혹은 임의 키)
    // characterName이 같은 것들을 모두 묶음
    // 우선 characterKey로 1건 찾아서 이름 확인 후 같은 이름 전부 수집
    const sample = allRows.find(
      (row) => (row.content_json?.characterKey?.trim() ?? "npc") === characterKey
    );
    if (sample) {
      const npcName = sample.content_json?.characterName?.trim() || characterKey;
      rows = allRows.filter(
        (row) => (row.content_json?.characterName?.trim() || "") === npcName
      );
    } else {
      rows = [];
    }
  }

  if (!rows.length) notFound();

  const characterName =
    rows[0]?.content_json?.characterName ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const allItems = rows.map((row) => {
    const preview =
      row.content_json?.preview?.trim() ||
      extractPreview(row.content_json?.editorEntries) ||
      extractPreview(row.content_json?.entries) ||
      "미리보기가 없습니다.";
    const categoryKey = row.content_json?.historyCategory?.trim() || "daily";
    return {
      id: String(row.id),
      title: row.title?.trim() || "제목 없음",
      slug: row.slug?.trim() || "",
      preview,
      categoryKey,
      groupLabel:
        row.content_json?.historyCategoryLabel?.trim() ||
        CATEGORY_LABEL_MAP[categoryKey] ||
        "일상",
      metaSummary: row.content_json?.historySummary?.trim() || "",
      metaSource: row.content_json?.historySource?.trim() || "",
      isComplete: Boolean(row.content_json?.isComplete ?? true),
      isFavorite: Boolean(row.content_json?.isFavorite ?? false),
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
          title={`${characterName} · 대화기록`}
          subtitle={`${items.length}개`}
          backHref={`/phone-items/messages/${characterKey}`}
          rightSlot={
            admin ? (
              <div className="history-top-admin">
                <Link
                  href={`/admin/phone-items/new?subtype=message&characterKey=${characterKey}`}
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
          <div className="message-history-page">
            <div className="message-history-filter-row">
              {CATEGORY_KEYS.map((categoryKey) => {
                const active = selectedCategory === categoryKey;
                const label =
                  categoryKey === "all"
                    ? "전체"
                    : CATEGORY_LABEL_MAP[categoryKey] || categoryKey;
                const href =
                  categoryKey === "all"
                    ? `/phone-items/messages/${characterKey}/history`
                    : `/phone-items/messages/${characterKey}/history?category=${categoryKey}`;
                return (
                  <Link
                    key={categoryKey}
                    href={href}
                    className={`message-history-chip ${active ? "active" : ""}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="message-history-grid">
              {items.map((item) => (
                <div key={item.id} className="message-history-card" style={{ position: "relative" }}>
                  <div className="message-history-card-top">
                    <span className="message-history-badge">{item.groupLabel}</span>
                    {admin ? (
                      <div className="call-inline-admin">
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
                            confirmMessage="이 메시지를 삭제할까요?"
                            className="call-inline-admin-btn"
                            icon="delete"
                          />
                        </form>
                      </div>
                    ) : item.isFavorite ? (
                      <span className="message-history-heart">♡</span>
                    ) : (
                      <span className="message-history-steam">〰</span>
                    )}
                  </div>

                  <Link
                    href={`/phone-items/messages/${characterKey}/${item.slug}`}
                    style={{ textDecoration: "none", color: "inherit", display: "contents" }}
                  >
                    <div className="message-history-title-row">
                      <span className="message-history-title">{item.title}</span>
                      {!item.isComplete ? (
                        <span className="message-history-status">[미완료]</span>
                      ) : null}
                    </div>
                    {item.metaSummary ? (
                      <div className="message-history-meta-summary">{item.metaSummary}</div>
                    ) : null}
                    {item.metaSource ? (
                      <div className="message-history-meta-source">{item.metaSource}</div>
                    ) : null}
                    <div className="message-history-preview">{item.preview}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}
