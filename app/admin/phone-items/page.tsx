import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { deletePhoneItem } from "@/app/admin/actions";

type PageProps = {
  searchParams?: Promise<{
    subtype?: string;
    character?: string;
    category?: string;
    published?: string;
    q?: string;
  }>;
};

type PhoneItemRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  release_year: number | null;
  release_date: string | null;
  is_published: boolean | null;
  summary?: string | null;
  content_json?: any;
};

const CHARACTER_LABELS: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const CATEGORY_LABELS: Record<string, string> = {
  daily: "일상",
  companion: "동반",
  card_story: "카드",
  main_story: "메인스토리",
  tangle: "얽힘",
};

function getPublicPhoneItemHref(item: {
  slug: string;
  subtype: string;
  content_json?: any;
}) {
if (item.subtype === "message") {
  const characterKey = item.content_json?.characterKey || "baiqi";
  return `/phone-items/messages/${characterKey}/${item.slug}`;
}

  if (item.subtype === "moment") {
    const characterKey = item.content_json?.characterKey || "baiqi";
    return `/phone-items/moments/${characterKey}`;
  }

  if (item.subtype === "call" || item.subtype === "video_call") {
    const characterKey = item.content_json?.characterKey;
    return characterKey
      ? `/phone-items/calls/${characterKey}/${item.slug}`
      : `/phone-items/calls`;
  }

if (item.subtype === "article") {
  const publisherSlug = item.content_json?.sourceSlug;
  return publisherSlug
    ? `/phone-items/articles/${publisherSlug}/${item.slug}`
    : `/phone-items/articles`;
}

  return `/phone-items`;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function buildSearchText(item: PhoneItemRow) {
  const preview =
    item.content_json?.preview ||
    item.content_json?.historySummary ||
    item.content_json?.body ||
    item.content_json?.sourceName ||
    "";

  const extra = [
    item.title,
    item.slug,
    item.summary,
    item.content_json?.threadKey,
    item.content_json?.characterName,
    item.content_json?.characterKey,
    item.content_json?.historyCategory,
    preview,
  ]
    .filter(Boolean)
    .join(" ");

  return normalize(extra);
}

export default async function AdminPhoneItemsPage({
  searchParams,
}: PageProps) {
  const params = (await searchParams) ?? {};

  const subtypeFilter = params.subtype ?? "all";
  const characterFilter = params.character ?? "all";
  const categoryFilter = params.category ?? "all";
  const publishedFilter = params.published ?? "all";
  const q = params.q?.trim() ?? "";

  const { data: phoneItems, error } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, subtype, release_year, release_date, is_published, summary, content_json"
    )
    .order("created_at", { ascending: false });

  const filteredItems =
    (phoneItems as PhoneItemRow[] | null)?.filter((item) => {
      const characterKey = item.content_json?.characterKey ?? "";
      const historyCategory = item.content_json?.historyCategory ?? "";

      const matchesSubtype =
        subtypeFilter === "all" || item.subtype === subtypeFilter;
      const matchesCharacter =
        characterFilter === "all" || characterKey === characterFilter;
      const matchesCategory =
        categoryFilter === "all" || historyCategory === categoryFilter;
      const matchesPublished =
        publishedFilter === "all" ||
        (publishedFilter === "true" && item.is_published === true) ||
        (publishedFilter === "false" && item.is_published === false);
      const matchesQuery =
        !q || buildSearchText(item).includes(normalize(q));

      return (
        matchesSubtype &&
        matchesCharacter &&
        matchesCategory &&
        matchesPublished &&
        matchesQuery
      );
    }) ?? [];

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items</div>
        <h1 className="page-title">휴대폰 콘텐츠 관리</h1>
        <p className="page-desc">
          문자, 모멘트, 전화, 영상통화, 기사 콘텐츠를 한 화면에서 필터링하고 수정합니다.
        </p>
      </header>

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/admin/phone-items/new" className="primary-button">
          새 휴대폰 콘텐츠 등록
        </Link>

        <Link
          href="/phone-items"
          className="nav-link"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          공개 휴대폰 목록 보기
        </Link>
      </div>

      <section className="form-panel" style={{ marginBottom: "24px" }}>
        <form method="get">
          <div className="form-grid">
            <label className="form-field">
              <span>타입</span>
              <select name="subtype" defaultValue={subtypeFilter}>
                <option value="all">전체</option>
                <option value="message">메시지</option>
                <option value="moment">모멘트</option>
                <option value="call">전화</option>
                <option value="video_call">영상통화</option>
                <option value="article">기사</option>
              </select>
            </label>

            <label className="form-field">
              <span>캐릭터</span>
              <select name="character" defaultValue={characterFilter}>
                <option value="all">전체</option>
                {Object.entries(CHARACTER_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>카테고리</span>
              <select name="category" defaultValue={categoryFilter}>
                <option value="all">전체</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>공개 여부</span>
              <select name="published" defaultValue={publishedFilter}>
                <option value="all">전체</option>
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </select>
            </label>

            <label className="form-field form-field-full">
              <span>검색</span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="제목, slug, preview, 기록 요약, 캐릭터명 검색"
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <button type="submit" className="primary-button">
              필터 적용
            </button>

            <Link href="/admin/phone-items" className="nav-link">
              초기화
            </Link>
          </div>
        </form>
      </section>

      {error && (
        <pre className="error-box">{JSON.stringify(error, null, 2)}</pre>
      )}

      {!filteredItems || filteredItems.length === 0 ? (
        <div className="empty-box">조건에 맞는 휴대폰 콘텐츠가 없습니다.</div>
      ) : (
        <>
          <div
            style={{
              marginBottom: "16px",
              color: "var(--text-sub)",
              fontSize: "14px",
            }}
          >
            총 {filteredItems.length}개
          </div>

          <ul className="list-grid">
            {filteredItems.map((item) => {
              const characterKey = item.content_json?.characterKey ?? "";
              const historyCategory = item.content_json?.historyCategory ?? "";
              const preview =
                item.content_json?.preview ||
                item.content_json?.historySummary ||
                item.content_json?.body ||
                item.summary ||
                "";

              return (
                <li key={item.id}>
                  <div className="archive-card">
                    <h2 className="archive-card-title">{item.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "14px" }}>
                      <span className="meta-pill">type: {item.subtype}</span>
                      <span className="meta-pill">
                        character:{" "}
                        {CHARACTER_LABELS[characterKey] ?? characterKey ?? "-"}
                      </span>
                      <span className="meta-pill">
                        category:{" "}
                        {CATEGORY_LABELS[historyCategory] ??
                          historyCategory ??
                          "-"}
                      </span>
                      <span className="meta-pill">
                        published: {item.is_published ? "true" : "false"}
                      </span>
                      <span className="meta-pill">
                        year: {item.release_year ?? "-"}
                      </span>
                      <span className="meta-pill">slug: {item.slug}</span>
                      {item.release_date ? (
                        <span className="meta-pill">date: {item.release_date}</span>
                      ) : null}
                    </div>

                    {preview ? (
                      <p
                        className="detail-text"
                        style={{
                          marginTop: 0,
                          marginBottom: "16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }}
                      >
                        {preview}
                      </p>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                       href={`/admin/phone-items/${item.id}/edit`}
                        className="primary-button"
                        style={{ marginTop: 0 }}
                      >
                        수정하기
                      </Link>

                      <Link
                        href={getPublicPhoneItemHref(item)}
                        className="nav-link"
                      >
                        공개 페이지 보기
                      </Link>

                      {characterKey ? (
                        <Link
                          href={`/characters/${characterKey}`}
                          className="nav-link"
                        >
                          캐릭터 허브
                        </Link>
                      ) : null}

                      <form action={deletePhoneItem}>
                        <input type="hidden" name="phoneItemId" value={item.id} />
                        <button
                          type="submit"
                          className="nav-link"
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          삭제하기
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}