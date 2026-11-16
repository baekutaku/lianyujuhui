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


function buildHref({
  q,
  character,
  sort,
}: {
  q?: string;
  character?: string;
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
    ? "/extra/mail?" +
      query
    : "/extra/mail";
}


function relationHref(
  type: string,
  item: any
) {
  if (
    type === "card"
  ) {
    return (
      "/cards/" +
      item.slug
    );
  }


  if (
    type === "illustration"
  ) {
    return (
      "/illustrations/" +
      item.id +
      "?illustrations=1"
    );
  }


  if (
    type === "story"
  ) {
    return (
      "/stories/" +
      item.slug
    );
  }


  if (
    type === "event"
  ) {
    return (
      "/events/" +
      item.slug
    );
  }


  return "#";
}


async function loadRelations(
  db: any,
  mailIds: string[]
) {
  const empty =
    new Map<
      string,
      any[]
    >();


  if (!mailIds.length) {
    return empty;
  }


  const {
    data: rows,
  } =
    await db
      .from(
        "extra_mail_relations"
      )
      .select(
        "mail_id, target_type, target_id, sort_order"
      )
      .in(
        "mail_id",
        mailIds
      )
      .order(
        "sort_order",
        { ascending: true }
      );


  const relationRows =
    rows ?? [];


  const byType =
    new Map<
      string,
      Set<string>
    >();


  for (
    const row
    of relationRows
  ) {
    const type =
      String(
        row.target_type
      );

    const set =
      byType.get(type) ??
      new Set<string>();

    set.add(
      String(
        row.target_id
      )
    );

    byType.set(
      type,
      set
    );
  }


  const targetMaps =
    new Map<
      string,
      Map<string, any>
    >();


  for (
    const [
      type,
      idsSet,
    ]
    of byType
  ) {
    const ids =
      [...idsSet];


    let table = "";
    let select = "";


    if (
      type === "card"
    ) {
      table = "cards";
      select =
        "id, title, slug";
    } else if (
      type ===
      "illustration"
    ) {
      table =
        "illustrations";
      select =
        "id, title";
    } else if (
      type === "story"
    ) {
      table = "stories";
      select =
        "id, title, slug";
    } else if (
      type === "event"
    ) {
      table = "events";
      select =
        "id, title, slug";
    } else {
      continue;
    }


    const {
      data,
    } =
      await db
        .from(table)
        .select(select)
        .in(
          "id",
          ids
        );


    targetMaps.set(
      type,
      new Map(
        (data ?? []).map(
          (item: any) => [
            item.id,
            item,
          ]
        )
      )
    );
  }


  const result =
    new Map<
      string,
      any[]
    >();


  for (
    const row
    of relationRows
  ) {
    const item =
      targetMaps
        .get(
          row.target_type
        )
        ?.get(
          row.target_id
        );


    if (!item) {
      continue;
    }


    const list =
      result.get(
        row.mail_id
      ) ?? [];


    list.push({
      ...item,
      targetType:
        row.target_type,
    });


    result.set(
      row.mail_id,
      list
    );
  }


  return result;
}


export default async function Page({
  searchParams,
}: {
  searchParams:
    Promise<{
      q?: string;
      character?: string;
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
        "extra_mail_items"
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


  let items =
    (
      rawItems ??
      []
    ) as any[];


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
          a.mail_date ??
          ""
        );

      const bDate =
        String(
          b.mail_date ??
          ""
        );


      return sort ===
        "oldest"
          ? aDate.localeCompare(
              bDate
            )
          : bDate.localeCompare(
              aDate
            );
    }
  );


  const relations =
    await loadRelations(
      db,
      items.map(
        (item) =>
          item.id
      )
    );


  const years =
    new Map<
      string,
      any[]
    >();


  for (
    const item
    of items
  ) {
    const year =
      String(
        item.mail_date ??
        ""
      ).slice(
        0,
        4
      ) || "기타";


    const list =
      years.get(year) ??
      [];


    list.push(item);


    years.set(
      year,
      list
    );
  }


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / MAIL
          </p>

          <h1 className="extra-title">
            우편
          </h1>

          <p className="extra-description">
            게임 내 우편을
            날짜와 원문 중심으로
            정리합니다.
          </p>

        </div>


        <div className="extra-mail-head-actions">

          {admin ? (
            <Link
              href="/extra/mail/new"
              className="primary-button"
            >
              우편 등록
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


      <section className="extra-mail-toolbar">

        <form
          method="get"
          action="/extra/mail"
          className="extra-mail-search-form"
        >

          <input
            type="hidden"
            name="sort"
            value={sort}
          />


          <div className="extra-mail-search-box">

            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="제목 · 원문 · 번역 검색"
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


          <button
            type="submit"
            className="extra-mail-search-submit"
          >
            검색
          </button>

        </form>


        <div className="extra-mail-sort-tabs">

          <Link
            href={
              buildHref({
                q,
                character,
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


      <div className="extra-mail-count">
        총 {items.length}통
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
            조건에 맞는 우편이 없습니다.
          </strong>

        </section>
      ) : null}


      <div className="extra-mail-years">

        {[...years.entries()]
          .map(
            ([
              year,
              yearItems,
            ]) => (
              <section
                key={year}
                className="extra-mail-year"
              >

                <div className="extra-mail-year-heading">

                  <h2>
                    {year}
                  </h2>

                  <span>
                    {yearItems.length}통
                  </span>

                </div>


                <div className="extra-mail-list">

                  {yearItems.map(
                    (item) => {

                      const date =
                        String(
                          item.mail_date
                        );


                      const shortDate =
                        date.slice(
                          5
                        ).replace(
                          "-",
                          "."
                        );


                      const linked =
                        relations.get(
                          item.id
                        ) ?? [];


                      return (
                        <details
                          key={
                            item.id
                          }
                          className="extra-mail-item"
                        >

                          <summary>

                            <span className="extra-mail-date">
                              {shortDate}
                            </span>


                            <div className="extra-mail-summary-main">

                              <strong>
                                {
                                  item.title
                                }
                              </strong>


                              <span>
                                {
                                  characterMap.get(
                                    item.character_key
                                  ) ??
                                  item.character_key
                                }

                                {item.occasion
                                  ? " · " +
                                    item.occasion
                                  : ""}
                              </span>

                            </div>


                            {admin ? (
                              <Link
                                href={
                                  "/extra/mail/" +
                                  item.id +
                                  "/edit"
                                }
                                className="mini-button"
                              >
                                수정
                              </Link>
                            ) : null}


                            <span className="extra-mail-more-label">
                              <span className="extra-mail-more-closed">
                                더보기
                              </span>

                              <span className="extra-mail-more-open">
                                접기
                              </span>

                              <span className="material-symbols-rounded extra-mail-chevron">
                                expand_more
                              </span>
                            </span>

                          </summary>


                          <div className="extra-mail-body">

                            <div className="extra-mail-text-block">

                              <span className="extra-category-kicker">
                                ORIGINAL
                              </span>

                              <p>
                                {
                                  item.original_text
                                }
                              </p>

                            </div>


                            {item.translation_text ? (
                              <div className="extra-mail-text-block">

                                <span className="extra-category-kicker">
                                  TRANSLATION
                                </span>

                                <p>
                                  {
                                    item.translation_text
                                  }
                                </p>

                              </div>
                            ) : null}


                            {item.image_url ? (
                              <img
                                src={
                                  item.image_url
                                }
                                alt=""
                                className="extra-mail-image"
                              />
                            ) : null}


                            {linked.length ? (
                              <div className="extra-mail-related">

                                <span className="extra-category-kicker">
                                  RELATED
                                </span>


                                <div className="extra-mail-related-list">

                                  {linked.map(
                                    (
                                      relation,
                                      index
                                    ) => (
                                      <Link
                                        key={
                                          relation.targetType +
                                          relation.id +
                                          index
                                        }
                                        href={
                                          relationHref(
                                            relation.targetType,
                                            relation
                                          )
                                        }
                                      >
                                        {
                                          relation.title ||
                                          "연결 콘텐츠"
                                        }
                                      </Link>
                                    )
                                  )}

                                </div>

                              </div>
                            ) : null}


                            {admin &&
                            !item.is_published ? (
                              <div className="extra-mail-private">
                                비공개
                              </div>
                            ) : null}

                          </div>

                        </details>
                      );
                    }
                  )}

                </div>

              </section>
            )
          )}

      </div>

    </main>
  );
}

