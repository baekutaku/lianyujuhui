import Link
  from "next/link";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabase,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


function youtubeId(
  url: string
) {
  const match =
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ??
    "";
}


function buildHref({
  q,
  character,
  occasion,
  sort,
}: {
  q?: string;
  character?: string;
  occasion?: string;
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
    character &&
    character !== "all"
  ) {
    params.set(
      "character",
      character
    );
  }


  if (
    occasion &&
    occasion !== "all"
  ) {
    params.set(
      "occasion",
      occasion
    );
  }


  if (
    sort === "oldest"
  ) {
    params.set(
      "sort",
      "oldest"
    );
  }


  const query =
    params.toString();


  return query
    ? "/extra/touch-room?" +
      query
    : "/extra/touch-room";
}


export default async function Page({
  searchParams,
}: {
  searchParams:
    Promise<{
      q?: string;
      character?: string;
      occasion?: string;
      sort?: string;
    }>;
}) {
  const params =
    await searchParams;


  const q =
    String(
      params.q ?? ""
    ).trim();


  const character =
    String(
      params.character ??
      "all"
    );


  const occasion =
    String(
      params.occasion ??
      "all"
    );


  const sort =
    params.sort ===
    "oldest"
      ? "oldest"
      : "latest";


  const admin =
    await isAdmin();


  const db: any =
    admin
      ? supabaseAdmin
      : supabase;


  let query =
    db
      .from(
        "extra_touch_room_items"
      )
      .select("*");


  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }


  const [
    {
      data: rawItems,
      error,
    },
    {
      data:
        characterRows,
    },
  ] =
    await Promise.all([

      query,

      db
        .from("characters")
        .select(
          "key, name_ko, sort_order"
        )
        .order(
          "sort_order",
          { ascending: true }
        ),
    ]);


  const characterMap =
    new Map(
      (
        characterRows ??
        []
      ).map(
        (item: any) => [
          item.key,
          item.name_ko ||
          item.key,
        ]
      )
    );


  const allItems =
    (
      rawItems ??
      []
    ) as any[];


  const occasions =
    Array.from(
      new Set(
        allItems
          .map(
            (item) =>
              String(
                item.occasion ??
                ""
              ).trim()
          )
          .filter(Boolean)
      )
    )
      .sort(
        (a, b) =>
          a.localeCompare(
            b,
            "ko"
          )
      );


  let items =
    [...allItems];


  if (
    character !== "all"
  ) {
    items =
      items.filter(
        (item) =>
          item.character_key ===
          character
      );
  }


  if (
    occasion !== "all"
  ) {
    items =
      items.filter(
        (item) =>
          item.occasion ===
          occasion
      );
  }


  if (q) {
    const needle =
      q.toLocaleLowerCase();


    items =
      items.filter(
        (item) =>
          [
            item.title,
            item.original_text,
            item.translation_text,
            item.occasion,
            characterMap.get(
              item.character_key
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(
              needle
            )
      );
  }


  items.sort(
    (a, b) => {
      const aDate =
        String(
          a.release_date ??
          ""
        );

      const bDate =
        String(
          b.release_date ??
          ""
        );


      if (
        aDate !== bDate
      ) {
        return sort ===
          "oldest"
            ? aDate.localeCompare(
                bDate
              )
            : bDate.localeCompare(
                aDate
              );
      }


      return String(
        a.title ??
        ""
      ).localeCompare(
        String(
          b.title ??
          ""
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
            EXTRA / TOUCH ROOM
          </p>

          <h1 className="extra-title">
            터치룸 음성
          </h1>

          <p className="extra-description">
            터치룸 음성을
            YouTube Shorts 영상과
            원문 · 번역으로 정리합니다.
          </p>

        </div>


        <div className="touch-room-head-actions">

          {admin ? (
            <Link
              href="/extra/touch-room/new"
              className="primary-button"
            >
              음성 등록
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


      <section className="touch-room-toolbar">

        <form
          method="get"
          action="/extra/touch-room"
          className="touch-room-search-form"
        >

          <input
            type="hidden"
            name="sort"
            value={sort}
          />


          <div className="touch-room-search-box">

            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="제목 · 대사 검색"
            />

          </div>


          <select
            name="character"
            defaultValue={
              character
            }
          >
            <option value="all">
              전체 캐릭터
            </option>

            {(characterRows ?? [])
              .map(
                (row: any) => (
                  <option
                    key={
                      row.key
                    }
                    value={
                      row.key
                    }
                  >
                    {
                      row.name_ko ||
                      row.key
                    }
                  </option>
                )
              )}
          </select>


          <select
            name="occasion"
            defaultValue={
              occasion
            }
          >
            <option value="all">
              전체 분류
            </option>

            {occasions.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              )
            )}
          </select>


          <button
            type="submit"
            className="touch-room-search-submit"
          >
            검색
          </button>

        </form>


        <div className="touch-room-sort-tabs">

          <Link
            href={
              buildHref({
                q,
                character,
                occasion,
                sort:
                  "latest",
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
                character,
                occasion,
                sort:
                  "oldest",
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


      <div className="touch-room-count">
        총 {items.length}개
      </div>


      {error ? (
        <div className="error-box">
          {error.message}
        </div>
      ) : null}


      {!error &&
      items.length === 0 ? (
        <section className="extra-empty-panel">

          <strong>
            조건에 맞는 터치룸 음성이 없습니다.
          </strong>

        </section>
      ) : null}


      {items.length ? (
        <section className="touch-room-grid">

          {items.map(
            (item) => {

              const yt =
                youtubeId(
                  String(
                    item.video_url ??
                    ""
                  )
                );


              const thumb =
                item.thumbnail_url ||
                (
                  yt
                    ? "https://img.youtube.com/vi/" +
                      yt +
                      "/hqdefault.jpg"
                    : ""
                );


              return (
                <Link
                  key={item.id}
                  href={
                    "/extra/touch-room/" +
                    item.slug
                  }
                  className="touch-room-card"
                >

                  <div className="touch-room-card-thumb">

                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                      />
                    ) : (
                      <span className="material-symbols-rounded">
                        play_circle
                      </span>
                    )}


                    <span className="touch-room-play-mark material-symbols-rounded">
                      play_arrow
                    </span>

                  </div>


                  <div className="touch-room-card-body">

                    <strong>
                      {item.title}
                    </strong>


                    <span>
                      {[
                        characterMap.get(
                          item.character_key
                        ) ??
                          item.character_key,

                        item.occasion,

                        item.release_date,
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
