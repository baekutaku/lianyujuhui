import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  daily: "일상",
  companion: "동반",
  card_story: "카드",
  main_story: "메인스토리",
};

const CATEGORY_KEYS = ["all", "daily", "companion", "card_story", "main_story"] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    category?: string;
  }>;
};

type HistoryItem = {
  id: string;
  title: string;
  slug: string;
  preview: string;
  groupLabel: string;
  categoryKey: string;
  metaSummary: string;
  metaSource: string;
  isComplete: boolean;
  isFavorite: boolean;
};

export default async function MessageHistoryPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCategory = normalizeCategory(resolvedSearchParams?.category);

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    notFound();
  }

  const rows = (data ?? []).filter((row) => {
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
  const preview =
    row.content_json?.preview?.trim() ||
    extractPreview(row.content_json?.editorEntries) ||
    extractPreview(row.content_json?.entries) ||
    "미리보기가 없습니다.";

  const categoryKey =
    row.content_json?.historyCategory?.trim() || "daily";

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
  (selectedCategory === "all"
    ? allItems
    : allItems.filter((item) => item.categoryKey === selectedCategory)
  ).filter((item) => item.slug);

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${characterName} · 대화기록`}
          subtitle={`${items.length}개`}
          backHref={`/phone-items/messages/${characterKey}`}
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
                <Link
                  key={item.id}
href={`/phone-items/messages/${characterKey}/${item.slug}`}
                  className="message-history-card"
                >
                  <div className="message-history-card-top">
                    <span className="message-history-badge">
                      {item.groupLabel}
                    </span>
                    {item.isFavorite ? (
                      <span className="message-history-heart">♡</span>
                    ) : (
                      <span className="message-history-steam">〰</span>
                    )}
                  </div>

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
              ))}
            </div>
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}

function normalizeCategory(value?: string): CategoryKey {
  if (
    value === "daily" ||
    value === "companion" ||
    value === "card_story" ||
    value === "main_story"
  ) {
    return value;
  }

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

    if (type === "choice") {
      const options = (entry as { options?: unknown[] }).options;
      if (!Array.isArray(options) || !options.length) continue;

      const first = options[0];

      if (typeof first === "string" && first.trim()) {
        return first.trim();
      }

      if (
        first &&
        typeof first === "object" &&
        "label" in first &&
        typeof (first as { label?: string }).label === "string"
      ) {
        return (first as { label: string }).label.trim();
      }
    }

    if (type === "system") {
      const text = String((entry as { text?: string }).text ?? "").trim();
      if (text) return text;
    }
  }

  return "";
}