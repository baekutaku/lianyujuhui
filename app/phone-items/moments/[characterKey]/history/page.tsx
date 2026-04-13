import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import DeletePhoneItemButton from "@/components/admin/phone-items/DeletePhoneItemButton";
import { deletePhoneItem } from "@/app/admin/actions";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import {
  MOMENT_CATEGORY_LABEL_MAP,
  normalizeMomentCategory,
} from "@/lib/phone/moment-filters";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "나",
  other: "기타",
};

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    category?: string;
    year?: string;
  }>;
};

type MomentRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  release_year?: number | null;
  is_published?: boolean | null;
  content_json?: {
    authorKey?: string;
    authorName?: string;
    authorAvatarUrl?: string;
    momentCategory?: string;
    momentCategoryLabel?: string;
    momentYear?: number | string;
    momentDateText?: string;
    momentBody?: string;
    momentSummary?: string;
    momentSource?: string;
    isFavorite?: boolean;
    isComplete?: boolean;
  } | null;
};

type CategoryKey = "all" | "daily" | "card" | "story";

type MomentHistoryItem = {
  id: string;
  slug: string;
  authorKey: string;
  authorName: string;
  authorAvatarUrl: string;
  title: string;
  categoryKey: CategoryKey;
  categoryLabel: string;
  yearText: string;
  dateText: string;
  summary: string;
  source: string;
  preview: string;
  isFavorite: boolean;
  isComplete: boolean;
};

const CATEGORY_KEYS: CategoryKey[] = ["all", "daily", "card", "story"];

function safeNormalizeCategory(value?: string): CategoryKey {
  const normalized = normalizeMomentCategory(value);
  if (normalized === "daily" || normalized === "card" || normalized === "story") {
    return normalized;
  }
  return "all";
}

function getPreview(row: MomentRow) {
  const body = row.content_json?.momentBody?.trim();
  const summary = row.content_json?.momentSummary?.trim();
  const title = row.title?.trim();

  return body || summary || title || "내용 없음";
}

function getYearText(row: MomentRow) {
  const raw = row.content_json?.momentYear ?? row.release_year;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

function getDateText(row: MomentRow) {
  const raw = row.content_json?.momentDateText?.trim();
  if (raw) return raw;

  const createdAt = row.created_at?.trim();
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default async function CharacterMomentHistoryPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCategory = safeNormalizeCategory(resolvedSearchParams?.category);
  const selectedYear = (resolvedSearchParams?.year || "").trim();
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, release_year, is_published, content_json")
    .eq("subtype", "moment")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    notFound();
  }

  const rows = ((data as MomentRow[] | null) ?? []).filter((row) => {
    const authorKey = row.content_json?.authorKey?.trim() || "other";
    return authorKey === characterKey;
  });

  if (!rows.length) {
    notFound();
  }

  const authorName =
    rows[0]?.content_json?.authorName?.trim() ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const allItems: MomentHistoryItem[] = rows
    .map((row) => {
      const slug = row.slug?.trim() || "";
      if (!slug) return null;

      const categoryKey = safeNormalizeCategory(row.content_json?.momentCategory);
      const yearText = getYearText(row);
      const dateText = getDateText(row);

      return {
        id: String(row.id),
        slug,
        authorKey: row.content_json?.authorKey?.trim() || characterKey,
        authorName:
          row.content_json?.authorName?.trim() ||
          DEFAULT_NAME_MAP[characterKey] ||
          authorName,
        authorAvatarUrl:
          row.content_json?.authorAvatarUrl?.trim() ||
          DEFAULT_AVATAR_MAP[characterKey] ||
          "/profile/npc.png",
        title: row.title?.trim() || "제목 없음",
        categoryKey,
        categoryLabel:
          row.content_json?.momentCategoryLabel?.trim() ||
          MOMENT_CATEGORY_LABEL_MAP[categoryKey] ||
          "일상",
        yearText,
        dateText,
        summary: row.content_json?.momentSummary?.trim() || "",
        source: row.content_json?.momentSource?.trim() || "",
        preview: getPreview(row),
        isFavorite: Boolean(row.content_json?.isFavorite ?? false),
        isComplete: Boolean(row.content_json?.isComplete ?? true),
      };
    })
    .filter(Boolean) as MomentHistoryItem[];

  const availableYears = Array.from(
    new Set(allItems.map((item) => item.yearText).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredItems = allItems.filter((item) => {
    const categoryMatched =
      selectedCategory === "all" ? true : item.categoryKey === selectedCategory;

    const yearMatched = selectedYear ? item.yearText === selectedYear : true;

    return categoryMatched && yearMatched;
  });

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${authorName} · 모멘트`}
          subtitle={`${filteredItems.length}개`}
          backHref={`/phone-items/moments/${characterKey}`}
          rightSlot={
            admin ? (
              <div className="history-top-admin">
                <Link
                  href={`/admin/phone-items/new?subtype=moment&authorKey=${characterKey}`}
                  className="history-top-admin-btn"
                  aria-label="모멘트 추가"
                  title="모멘트 추가"
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
                const label =
                  categoryKey === "all"
                    ? "전체"
                    : MOMENT_CATEGORY_LABEL_MAP[categoryKey] || categoryKey;

                const href =
                  categoryKey === "all"
                    ? selectedYear
                      ? `/phone-items/moments/${characterKey}/history?year=${selectedYear}`
                      : `/phone-items/moments/${characterKey}/history`
                    : selectedYear
                      ? `/phone-items/moments/${characterKey}/history?category=${categoryKey}&year=${selectedYear}`
                      : `/phone-items/moments/${characterKey}/history?category=${categoryKey}`;

                return (
                  <Link
                    key={categoryKey}
                    href={href}
                    className={`message-history-chip ${
                      selectedCategory === categoryKey ? "active" : ""
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {availableYears.length ? (
              <div
                className="message-history-filter-row"
                style={{ marginTop: 10, flexWrap: "wrap" }}
              >
                <Link
                  href={
                    selectedCategory === "all"
                      ? `/phone-items/moments/${characterKey}/history`
                      : `/phone-items/moments/${characterKey}/history?category=${selectedCategory}`
                  }
                  className={`message-history-chip ${selectedYear ? "" : "active"}`}
                >
                  전체연도
                </Link>

                {availableYears.map((year) => {
                  const href =
                    selectedCategory === "all"
                      ? `/phone-items/moments/${characterKey}/history?year=${year}`
                      : `/phone-items/moments/${characterKey}/history?category=${selectedCategory}&year=${year}`;

                  return (
                    <Link
                      key={year}
                      href={href}
                      className={`message-history-chip ${
                        selectedYear === year ? "active" : ""
                      }`}
                    >
                      {year}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div className="message-history-grid" style={{ marginTop: 16 }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="message-history-card"
                  style={{ position: "relative" }}
                >
                  <div className="message-history-card-top">
                    <Link
                      href={`/phone-items/me/${item.authorKey}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        textDecoration: "none",
                        color: "inherit",
                        minWidth: 0,
                      }}
                    >
                      <img
                        src={item.authorAvatarUrl}
                        alt={item.authorName}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "999px",
                          objectFit: "cover",
                          flex: "0 0 auto",
                        }}
                      />
                      <span className="message-history-badge">{item.authorName}</span>
                    </Link>

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
                            confirmMessage="이 모멘트를 삭제할까요?"
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
                    href={`/phone-items/moments/${item.slug}`}
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

                    <div className="message-history-meta-summary">
                      {item.categoryLabel}
                      {item.yearText ? ` · ${item.yearText}` : ""}
                      {item.dateText ? ` · ${item.dateText}` : ""}
                    </div>

                    {item.summary ? (
                      <div className="message-history-meta-source">{item.summary}</div>
                    ) : null}

                    {item.source ? (
                      <div className="message-history-meta-source">{item.source}</div>
                    ) : null}

                    <div className="message-history-preview">{item.preview}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}