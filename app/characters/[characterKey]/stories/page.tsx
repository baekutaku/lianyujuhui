import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    subtype?: string;
    q?: string;
  }>;
};

type StoryRow = {
  id: string;
  title: string;
  slug: string;
  subtype: string | null;
  release_year: number | null;
  release_date: string | null;
  summary: string | null;
  is_published: boolean | null;
};

const CHARACTER_LABELS: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
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

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export default async function CharacterStoriesPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const filters = (await searchParams) ?? {};

  const characterLabel = CHARACTER_LABELS[characterKey];
  if (!characterLabel) notFound();

  const subtypeFilter = filters.subtype ?? "all";
  const q = filters.q?.trim() ?? "";

  const { data: character } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .eq("key", characterKey)
    .maybeSingle();

  if (!character) notFound();

  const { data: stories, error } = await supabase
    .from("stories")
    .select(
      "id, title, slug, subtype, release_year, release_date, summary, is_published"
    )
    .eq("primary_character_id", character.id)
    .eq("is_published", true)
    .order("release_year", { ascending: false })
    .order("release_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const filteredStories =
    ((stories as StoryRow[] | null) ?? []).filter((story) => {
      const matchesSubtype =
        subtypeFilter === "all" || story.subtype === subtypeFilter;

      const searchText = normalize(
        [story.title, story.slug, story.summary, story.subtype].join(" ")
      );
      const matchesQuery = !q || searchText.includes(normalize(q));

      return matchesSubtype && matchesQuery;
    }) ?? [];

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Character / Stories</div>
        <h1 className="page-title">{characterLabel} 스토리</h1>
        <p className="page-desc">
          {characterLabel} 스토리 목록을 캐릭터 기준으로 정리합니다.
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
        <Link href={`/characters/${characterKey}`} className="nav-link">
          캐릭터 허브로
        </Link>

        <Link href={`/characters/${characterKey}/cards`} className="nav-link">
          카드 보기
        </Link>

        <Link href={`/characters/${characterKey}/phone`} className="nav-link">
          휴대폰 보기
        </Link>
      </div>

      <section className="form-panel" style={{ marginBottom: "24px" }}>
        <form method="get">
          <div className="form-grid">
            <label className="form-field">
              <span>스토리 유형</span>
              <select name="subtype" defaultValue={subtypeFilter}>
                <option value="all">전체</option>
                {Object.entries(STORY_SUBTYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field form-field-full">
              <span>검색</span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="제목, slug, 요약 검색"
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

            <Link
              href={`/characters/${characterKey}/stories`}
              className="nav-link"
            >
              초기화
            </Link>
          </div>
        </form>
      </section>

      {filteredStories.length === 0 ? (
        <div className="empty-box">조건에 맞는 스토리가 없습니다.</div>
      ) : (
        <>
          <div
            style={{
              marginBottom: "16px",
              color: "var(--text-sub)",
              fontSize: "14px",
            }}
          >
            총 {filteredStories.length}개
          </div>

          <ul className="list-grid">
            {filteredStories.map((story) => (
              <li key={story.id}>
                <Link
                  href={`/stories/${story.slug}`}
                  className="archive-card-link"
                >
                  <div className="archive-card">
                    <h2 className="archive-card-title">{story.title}</h2>

                    <div className="meta-row" style={{ marginBottom: "14px" }}>
                      <span className="meta-pill">
                        subtype:{" "}
                        {STORY_SUBTYPE_LABELS[story.subtype ?? ""] ??
                          story.subtype ??
                          "-"}
                      </span>
                      <span className="meta-pill">
                        year: {story.release_year ?? "-"}
                      </span>
                      {story.release_date ? (
                        <span className="meta-pill">
                          date: {story.release_date}
                        </span>
                      ) : null}
                      <span className="meta-pill">slug: {story.slug}</span>
                    </div>

                    {story.summary ? (
                      <p
                        className="detail-text"
                        style={{
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }}
                      >
                        {story.summary}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}