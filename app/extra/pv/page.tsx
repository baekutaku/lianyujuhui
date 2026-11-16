import Link from "next/link";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabase,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


const CHARACTER_NAMES:
  Record<string, string> = {
    baiqi: "백기",
    lizeyan: "이택언",
    zhouqiluo: "주기락",
    xumo: "허묵",
    lingxiao: "연시호",
  };


function youtubeId(
  url: string
) {
  const match =
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ?? "";
}


function buildHref({
  q,
  sort,
}: {
  q?: string;
  sort?: string;
}) {
  const params =
    new URLSearchParams();

  if (q?.trim()) {
    params.set(
      "q",
      q.trim()
    );
  }

  if (
    sort &&
    sort !== "latest"
  ) {
    params.set(
      "sort",
      sort
    );
  }

  const query =
    params.toString();

  return query
    ? `/extra/pv?${query}`
    : "/extra/pv";
}


export default async function Page({
  searchParams,
}: {
  searchParams:
    Promise<{
      q?: string;
      sort?: string;
    }>;
}) {
  const params =
    await searchParams;

  const q =
    String(
      params.q ?? ""
    ).trim();

  const sort =
    params.sort === "oldest"
      ? "oldest"
      : "latest";

  const ascending =
    sort === "oldest";


  const admin =
    await isAdmin();


  const db: any =
    admin
      ? supabaseAdmin
      : supabase;


  let query =
    db
      .from(
        "extra_pv_items"
      )
      .select(
        `
        id,
        title,
        slug,
        release_date,
        release_year,
        character_keys,
        videos,
        video_cn_url,
        video_kr_url,
        is_published,
        created_at
        `
      );


  /*
   * 일반 사용자는 공개 PV만 표시
   */
  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }


  /*
   * PV 검색
   * 현재는 제목 기준
   */
  if (q) {
    query =
      query.ilike(
        "title",
        `%${q}%`
      );
  }


  /*
   * 기본 = 출시일 최신순
   * 오래된순 선택 가능
   *
   * release_date 없는 항목은 뒤쪽으로.
   */
  query =
    query
      .order(
        "release_date",
        {
          ascending,
          nullsFirst: false,
        }
      )
      .order(
        "release_year",
        {
          ascending,
          nullsFirst: false,
        }
      )
      .order(
        "title",
        {
          ascending: true,
        }
      );


  const {
    data,
    error,
  } =
    await query;


  const items =
    [...(data ?? [])].sort(
      (a: any, b: any) => {
        const aDate =
          String(
            a.release_date ?? ""
          );

        const bDate =
          String(
            b.release_date ?? ""
          );


        if (
          aDate &&
          !bDate
        ) {
          return -1;
        }

        if (
          !aDate &&
          bDate
        ) {
          return 1;
        }


        if (
          aDate !== bDate
        ) {
          return sort === "oldest"
            ? aDate.localeCompare(
                bDate
              )
            : bDate.localeCompare(
                aDate
              );
        }


        return String(
          a.title ?? ""
        ).localeCompare(
          String(
            b.title ?? ""
          ),
          "ko"
        );
      }
    );


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV
          </p>

          <h1 className="extra-title">
            PV / 공식 영상
          </h1>

          <p className="extra-description">
            공식 PV, 티저,
            프로모션 영상을
            정리합니다.
          </p>

        </div>


        <div className="extra-pv-head-actions">

          {admin ? (
            <Link
              href="/extra/pv/new"
              className="primary-button"
            >
              PV 등록
            </Link>
          ) : null}


          <Link
            href="/extra"
            className="extra-back-link"
          >
            ← 기타
          </Link>

        </div>

      </header>


      {/* ================================================
          검색 + 정렬
      ================================================= */}

      <section className="extra-pv-toolbar">

        <form
          method="get"
          action="/extra/pv"
          className="extra-pv-search-form"
        >

          <input
            type="hidden"
            name="sort"
            value={sort}
          />


          <div className="extra-pv-search-box">

            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="PV 제목 검색"
            />

          </div>


          <button
            type="submit"
            className="extra-pv-search-submit"
          >
            검색
          </button>


          {q ? (
            <Link
              href={
                buildHref({
                  sort,
                })
              }
              className="extra-pv-search-reset"
            >
              초기화
            </Link>
          ) : null}

        </form>


        <div className="extra-pv-sort-tabs">

          <Link
            href={
              buildHref({
                q,
                sort: "latest",
              })
            }
            className={
              sort === "latest"
                ? "is-active"
                : ""
            }
          >
            최신순
          </Link>


          <Link
            href={
              buildHref({
                q,
                sort: "oldest",
              })
            }
            className={
              sort === "oldest"
                ? "is-active"
                : ""
            }
          >
            오래된순
          </Link>

        </div>

      </section>


      {q ? (
        <div className="extra-pv-search-summary">

          <strong>
            “{q}”
          </strong>

          <span>
            검색 결과 {items.length}개
          </span>

        </div>
      ) : null}


      {error ? (
        <div className="error-box">
          {error.message}
        </div>
      ) : null}


      {!error &&
      items.length === 0 ? (
        <section className="extra-empty-panel">

          <span className="extra-empty-icon">
            movie
          </span>

          <strong>
            {q
              ? "검색 결과가 없습니다."
              : "등록된 PV가 없습니다."}
          </strong>

          {q ? (
            <p>
              다른 검색어로
              다시 검색해 보세요.
            </p>
          ) : null}

        </section>
      ) : null}


      {items.length ? (
        <section className="extra-pv-grid">

          {items.map(
            (item: any) => {

              const videos =
                Array.isArray(
                  item.videos
                )
                  ? item.videos
                  : [];


              /*
               * 첫 번째 등록 영상이
               * 목록 썸네일 기준.
               */
              const firstVideo =
                videos[0] ??
                (
                  item.video_cn_url
                    ? {
                        server: "CN",
                        url:
                          item.video_cn_url,
                      }
                    : item.video_kr_url
                      ? {
                          server: "KR",
                          url:
                            item.video_kr_url,
                        }
                      : null
                );


              const firstUrl =
                String(
                  firstVideo?.url ??
                  ""
                );


              const yt =
                youtubeId(
                  firstUrl
                );


              const thumb =
                String(
                  firstVideo
                    ?.thumbnail_url ??
                  ""
                ).trim() ||
                (
                  yt
                    ? "https://img.youtube.com/vi/" +
                      yt +
                      "/hqdefault.jpg"
                    : ""
                );


              const characters =
                (
                  item.character_keys ??
                  []
                )
                  .map(
                    (
                      key: string
                    ) =>
                      CHARACTER_NAMES[
                        key
                      ] ?? key
                  )
                  .join(" · ");


              return (
                <Link
                  key={item.id}
                  href={
                    "/extra/pv/" +
                    item.slug
                  }
                  className="extra-pv-card"
                >

                  <div className="extra-pv-thumb">

                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                      />
                    ) : (
                      <span className="material-symbols-rounded">
                        movie
                      </span>
                    )}

                  </div>


                  <div className="extra-pv-card-body">

                    <span className="extra-category-kicker">
                      PV / OFFICIAL VIDEO
                    </span>


                    <strong>
                      {item.title}
                    </strong>


                    <span>
                      {[
                        item.release_date ||
                          item.release_year,

                        characters,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>


                    {admin &&
                    !item.is_published ? (
                      <em>
                        비공개
                      </em>
                    ) : null}

                  </div>

                </Link>
              );
            }
          )}

        </section>
      ) : null}

    </main>
  );
}
