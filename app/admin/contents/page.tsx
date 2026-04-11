import Link from "next/link";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    type?: string;
    character?: string;
    subtype?: string;
    published?: string;
    q?: string;
  }>;
};

type UnifiedItem = {
  id: string;
  type: "card" | "story" | "phone_item" | "event";
  title: string;
  slug: string;
  subtype?: string | null;
  rarity?: string | null;
  attribute?: string | null;
  releaseYear?: number | null;
  releaseDate?: string | null;
  isPublished?: boolean | null;
  summary?: string | null;
  characterKey?: string | null;
};

const CHARACTER_LABELS: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const TYPE_LABELS: Record<string, string> = {
  card: "카드",
  story: "스토리",
  phone_item: "휴대폰",
  event: "이벤트",
};

const STORY_SUBTYPE_LABELS: Record<string, string> = {
  card_story: "데이트",
  asmr: "너의 곁에",
  side_story: "외전",
  main_story: "메인스토리",
  behind_story: "막후의 장",
  xiyue_story: "서월국",
  myhome_story: "마이홈 스토리",
  company_project: "회사 프로젝트",
};

const PHONE_SUBTYPE_LABELS: Record<string, string> = {
  message: "메시지",
  moment: "모멘트",
  call: "전화",
  video_call: "영상통화",
  article: "기사",
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  drive: "추진력",
  judgment: "결단력",
  creativity: "창의력",
  affinity: "친화력",
};

const RARITY_LABELS: Record<string, string> = {
  nh: "NH",
  n: "N",
  r: "R",
  sr: "SR",
  er: "ER",
  ser: "SER",
  ssr: "SSR",
  sp: "SP",
  ur: "UR",
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getSubtypeLabel(item: UnifiedItem) {
  if (item.type === "story") {
    return STORY_SUBTYPE_LABELS[item.subtype ?? ""] ?? item.subtype ?? "-";
  }
  if (item.type === "phone_item") {
    return PHONE_SUBTYPE_LABELS[item.subtype ?? ""] ?? item.subtype ?? "-";
  }
  return item.subtype ?? "-";
}

function getEditHref(item: UnifiedItem) {
  if (item.type === "card") return `/admin/cards/${item.slug}/edit`;
  if (item.type === "story") return `/admin/stories/${item.slug}/edit`;
  if (item.type === "phone_item") return `/admin/phone-items/${item.slug}/edit`;
  if (item.type === "event") return `/admin/events/${item.slug}/edit`;
  return "/admin";
}

function getPublicHref(item: UnifiedItem) {
  if (item.type === "card") return `/cards/${item.slug}`;
  if (item.type === "story") return `/stories/${item.slug}`;
  if (item.type === "event") return `/events/${item.slug}`;

  if (item.type === "phone_item") {
    if (item.subtype === "message") {
      const characterKey = item.characterKey || "baiqi";
      return `/phone-items/messages/${characterKey}/${item.slug}`;
    }
    if (item.subtype === "moment") {
      const characterKey = item.characterKey || "baiqi";
      return `/phone-items/moments/${characterKey}`;
    }
    if (item.subtype === "call" || item.subtype === "video_call") {
      const characterKey = item.characterKey || "baiqi";
      return `/phone-items/calls/${characterKey}/${item.slug}`;
    }
    if (item.subtype === "article") {
      return `/phone-items/articles/${item.slug}`;
    }
  }

  return "/";
}

export default async function AdminContentsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const typeFilter = params.type ?? "all";
  const characterFilter = params.character ?? "all";
  const subtypeFilter = params.subtype ?? "all";
  const publishedFilter = params.published ?? "all";
  const q = params.q?.trim() ?? "";

  const [
    { data: characters },
    { data: cards, error: cardsError },
    { data: stories, error: storiesError },
    { data: phoneItems, error: phoneItemsError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    supabase.from("characters").select("id, key"),
    supabase
      .from("cards")
      .select(
        "id, title, slug, rarity, attribute, release_year, release_date, summary, is_published, primary_character_id"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("stories")
      .select(
        "id, title, slug, subtype, release_year, release_date, summary, is_published, primary_character_id"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("phone_items")
      .select(
        "id, title, slug, subtype, summary, is_published, release_year, release_date, content_json"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select(
        "id, title, slug, subtype, release_year, start_date, summary, is_published, primary_character_id"
      )
      .order("created_at", { ascending: false }),
  ]);

  if (cardsError) throw new Error(cardsError.message);
  if (storiesError) throw new Error(storiesError.message);
  if (phoneItemsError) throw new Error(phoneItemsError.message);
  if (eventsError) throw new Error(eventsError.message);

  const characterMap = new Map(
    (characters ?? []).map((character) => [character.id, character.key])
  );

  const unified: UnifiedItem[] = [
    ...((cards ?? []).map((item) => ({
      id: item.id,
      type: "card" as const,
      title: item.title,
      slug: item.slug,
      rarity: item.rarity,
      attribute: item.attribute,
      releaseYear: item.release_year,
      releaseDate: item.release_date,
      isPublished: item.is_published,
      summary: item.summary,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    })) ?? []),

    ...((stories ?? []).map((item) => ({
      id: item.id,
      type: "story" as const,
      title: item.title,
      slug: item.slug,
      subtype: item.subtype,
      releaseYear: item.release_year,
      releaseDate: item.release_date,
      isPublished: item.is_published,
      summary: item.summary,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    })) ?? []),

    ...((phoneItems ?? []).map((item) => ({
      id: item.id,
      type: "phone_item" as const,
      title: item.title,
      slug: item.slug,
      subtype: item.subtype,
      releaseYear: item.release_year,
      releaseDate: item.release_date,
      isPublished: item.is_published,
      summary: item.summary,
      characterKey: item.content_json?.characterKey ?? null,
    })) ?? []),

    ...((events ?? []).map((item) => ({
      id: item.id,
      type: "event" as const,
      title: item.title,
      slug: item.slug,
      subtype: item.subtype,
      releaseYear: item.release_year,
      releaseDate: item.start_date,
      isPublished: item.is_published,
      summary: item.summary,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
    })) ?? []),
  ];

  const filtered = unified.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCharacter =
      characterFilter === "all" || item.characterKey === characterFilter;
    const matchesSubtype =
      subtypeFilter === "all" || item.subtype === subtypeFilter;
    const matchesPublished =
      publishedFilter === "all" ||
      (publishedFilter === "true" && item.isPublished === true) ||
      (publishedFilter === "false" && item.isPublished === false);

    const searchText = normalize(
      [
        item.title,
        item.slug,
        item.summary,
        item.subtype,
        item.rarity,
        item.attribute,
        item.characterKey,
      ].join(" ")
    );
    const matchesQuery = !q || searchText.includes(normalize(q));

    return (
      matchesType &&
      matchesCharacter &&
      matchesSubtype &&
      matchesPublished &&
      matchesQuery
    );
  });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Contents</div>
        <h1 className="page-title">통합 콘텐츠 관리</h1>
        <p className="page-desc">
          카드, 스토리, 휴대폰, 이벤트를 캐릭터와 타입 기준으로 한 화면에서 찾습니다.
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
        <Link href="/admin" className="nav-link">
          관리자 홈
        </Link>
        <Link href="/admin/cards" className="nav-link">
          카드 관리
        </Link>
        <Link href="/admin/stories" className="nav-link">
          스토리 관리
        </Link>
        <Link href="/admin/phone-items" className="nav-link">
          휴대폰 관리
        </Link>
        <Link href="/admin/events" className="nav-link">
          이벤트 관리
        </Link>
      </div>

      <section className="form-panel" style={{ marginBottom: "24px" }}>
        <form method="get">
          <div className="form-grid">
            <label className="form-field">
              <span>콘텐츠 타입</span>
              <select name="type" defaultValue={typeFilter}>
                <option value="all">전체</option>
                <option value="card">카드</option>
                <option value="story">스토리</option>
                <option value="phone_item">휴대폰</option>
                <option value="event">이벤트</option>
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
              <span>세부 유형</span>
              <input
                type="text"
                name="subtype"
                defaultValue={subtypeFilter === "all" ? "" : subtypeFilter}
                placeholder="예: main_story, moment, call"
              />
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
                placeholder="제목, slug, 요약, subtype, rarity, attribute 검색"
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

            <Link href="/admin/contents" className="nav-link">
              초기화
            </Link>
          </div>
        </form>
      </section>

      {filtered.length === 0 ? (
        <div className="empty-box">조건에 맞는 콘텐츠가 없습니다.</div>
      ) : (
        <>
          <div
            style={{
              marginBottom: "16px",
              color: "var(--text-sub)",
              fontSize: "14px",
            }}
          >
            총 {filtered.length}개
          </div>

          <ul className="list-grid">
            {filtered.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <div className="archive-card">
                  <h2 className="archive-card-title">{item.title}</h2>

                  <div className="meta-row" style={{ marginBottom: "14px" }}>
                    <span className="meta-pill">
                      type: {TYPE_LABELS[item.type]}
                    </span>

                    <span className="meta-pill">
                      character:{" "}
                      {CHARACTER_LABELS[item.characterKey ?? ""] ??
                        item.characterKey ??
                        "-"}
                    </span>

                    {item.subtype ? (
                      <span className="meta-pill">
                        subtype: {getSubtypeLabel(item)}
                      </span>
                    ) : null}

                    {item.rarity ? (
                      <span className="meta-pill">
                        rarity: {RARITY_LABELS[item.rarity] ?? item.rarity}
                      </span>
                    ) : null}

                    {item.attribute ? (
                      <span className="meta-pill">
                        attribute:{" "}
                        {ATTRIBUTE_LABELS[item.attribute] ?? item.attribute}
                      </span>
                    ) : null}

                    <span className="meta-pill">
                      published: {item.isPublished ? "true" : "false"}
                    </span>

                    {item.releaseYear ? (
                      <span className="meta-pill">year: {item.releaseYear}</span>
                    ) : null}

                    {item.releaseDate ? (
                      <span className="meta-pill">date: {item.releaseDate}</span>
                    ) : null}

                    <span className="meta-pill">slug: {item.slug}</span>
                  </div>

                  {item.summary ? (
                    <p
                      className="detail-text"
                      style={{
                        marginTop: 0,
                        marginBottom: "16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}
                    >
                      {item.summary}
                    </p>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Link href={getEditHref(item)} className="primary-button" style={{ marginTop: 0 }}>
                      수정하기
                    </Link>

                    <Link href={getPublicHref(item)} className="nav-link">
                      공개 페이지 보기
                    </Link>

                    {item.characterKey ? (
                      <Link
                        href={`/characters/${item.characterKey}`}
                        className="nav-link"
                      >
                        캐릭터 허브
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}