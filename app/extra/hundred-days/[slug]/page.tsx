import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabase,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


function safeDecode(
  value: string
) {
  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}


function shortDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return value
    .slice(5)
    .replace("-", ".");
}


function entryRank(
  type: string
) {
  if (type === "prologue") {
    return 0;
  }

  if (type === "day") {
    return 1;
  }

  return 2;
}


export default async function Page({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {
  const {
    slug: rawSlug,
  } =
    await params;

  const slug =
    safeDecode(
      rawSlug
    );

  const admin =
    await isAdmin();

  const db: any =
    admin
      ? supabaseAdmin
      : supabase;

  let seriesQuery =
    db
      .from(
        "extra_hundred_days_series"
      )
      .select("*")
      .in(
        "slug",
        Array.from(
          new Set([
            rawSlug,
            slug,
          ])
        )
      );

  if (!admin) {
    seriesQuery =
      seriesQuery.eq(
        "is_published",
        true
      );
  }

  const {
    data: series,
  } =
    await seriesQuery
      .maybeSingle();

  if (!series) {
    notFound();
  }


  let itemQuery =
    db
      .from(
        "extra_hundred_days_items"
      )
      .select("*")
      .eq(
        "series_id",
        series.id
      );

  if (!admin) {
    itemQuery =
      itemQuery.eq(
        "is_published",
        true
      );
  }

  const [
    { data: itemRows },
    { data: character },
  ] =
    await Promise.all([
      itemQuery,

      db
        .from("characters")
        .select(
          "name_ko"
        )
        .eq(
          "key",
          series.character_key
        )
        .maybeSingle(),
    ]);

  const items =
    [...(itemRows ?? [])];

  items.sort(
    (a: any, b: any) => {
      const rank =
        entryRank(
          a.entry_type
        ) -
        entryRank(
          b.entry_type
        );

      if (rank !== 0) {
        return rank;
      }

      if (
        a.entry_type ===
        "day"
      ) {
        return (
          Number(
            a.day_number ?? 0
          ) -
          Number(
            b.day_number ?? 0
          )
        );
      }

      return (
        Number(
          a.sort_order ?? 0
        ) -
        Number(
          b.sort_order ?? 0
        )
      );
    }
  );

  const prologue =
    items.find(
      (item: any) =>
        item.entry_type ===
        "prologue"
    );

  const mailItems =
    items.filter(
      (item: any) =>
        item.entry_type !==
        "prologue"
    );


  return (
    <main className="extra-page hundred-days-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / HUNDRED DAYS
          </p>

          <h1 className="extra-title">
            {
              series.title_ko ||
              series.title_cn
            }
          </h1>

          <p className="extra-description">
            {[
              series.year,
              series.title_cn,
              character?.name_ko ||
                series.character_key,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

        </div>


        <div className="hundred-days-head-actions">

          {admin ? (
            <>
              <Link
                href={
                  "/extra/hundred-days/" +
                  encodeURIComponent(
                    series.slug
                  ) +
                  "/new-item"
                }
                className="primary-button"
              >
                DAY 추가
              </Link>

              <Link
                href={
                  "/extra/hundred-days/" +
                  encodeURIComponent(
                    series.slug
                  ) +
                  "/edit"
                }
                className="mini-button"
              >
                시리즈 수정
              </Link>
            </>
          ) : null}


          <Link
            href="/extra/hundred-days"
            className="extra-back-link"
          >
            ← 목록
          </Link>

        </div>

      </header>


      {series.description ? (
        <p className="hundred-days-series-description">
          {series.description}
        </p>
      ) : null}


      {prologue ? (
        <section className="hundred-days-prologue">

          <div className="hundred-days-section-label">
            PRE STORY
          </div>

          <h2>
            {
              prologue.title ||
              "사전 이야기"
            }
          </h2>


          {prologue.original_text ? (
            <div className="hundred-days-story-text">

              <span className="extra-category-kicker">
                ORIGINAL
              </span>

              <p>
                {
                  prologue.original_text
                }
              </p>

            </div>
          ) : null}


          {prologue.translation_text ? (
            <div className="hundred-days-story-text">

              <span className="extra-category-kicker">
                TRANSLATION
              </span>

              <p>
                {
                  prologue.translation_text
                }
              </p>

            </div>
          ) : null}


          {admin ? (
            <Link
              href={
                "/extra/hundred-days/" +
                encodeURIComponent(
                  series.slug
                ) +
                "/items/" +
                prologue.id +
                "/edit"
              }
              className="mini-button"
            >
              사전 이야기 수정
            </Link>
          ) : null}

        </section>
      ) : null}


      <section className="hundred-days-mail-section">

        <div className="hundred-days-mail-list">

          {mailItems.map(
            (item: any) => {

              const meta =
                item.meta_json &&
                typeof item.meta_json ===
                  "object"
                  ? item.meta_json
                  : {};

              const isDay =
                item.entry_type ===
                "day";

              const label =
                isDay
                  ? "DAY " +
                    item.day_number
                  : item.title ||
                    "SPECIAL";

              const subMeta =
                [
                  shortDate(
                    item.release_date
                  ),

                  item.time_text,

                  meta.location,

                  meta.category,
                ]
                  .filter(Boolean)
                  .join(" · ");


              return (
                <details
                  key={item.id}
                  className="hundred-days-mail"
                >

                  <summary>

                    <span className="hundred-days-day-label">
                      {label}
                    </span>


                    <div className="hundred-days-mail-summary">

                      <strong>
                        {
                          item.title ||
                          meta.goal ||
                          (
                            isDay
                              ? "백일동반 기록"
                              : "특별 기록"
                          )
                        }
                      </strong>


                      {subMeta ? (
                        <span>
                          {subMeta}
                        </span>
                      ) : null}

                    </div>


                    {item.is_voice ? (
                      <span className="hundred-days-voice-badge">
                        VOICE
                      </span>
                    ) : null}


                    {admin ? (
                      <Link
                        href={
                          "/extra/hundred-days/" +
                          encodeURIComponent(
                            series.slug
                          ) +
                          "/items/" +
                          item.id +
                          "/edit"
                        }
                        className="mini-button"
                      >
                        수정
                      </Link>
                    ) : null}


                    <span className="material-symbols-rounded hundred-days-chevron">
                      expand_more
                    </span>

                  </summary>


                  <div className="hundred-days-mail-body">

                    {meta.goal ? (
                      <div className="hundred-days-meta-note">
                        <strong>
                          목표
                        </strong>
                        <span>
                          {meta.goal}
                        </span>
                      </div>
                    ) : null}


                    {meta.missed_goal ? (
                      <div className="hundred-days-meta-note">
                        <strong>
                          누락
                        </strong>
                        <span>
                          {
                            meta.missed_goal
                          }
                        </span>
                      </div>
                    ) : null}


                    {meta.detail_time ? (
                      <div className="hundred-days-meta-note">
                        <strong>
                          기록
                        </strong>
                        <span>
                          {
                            meta.detail_time
                          }
                        </span>
                      </div>
                    ) : null}


                    {item.is_voice &&
                    item.media_url ? (
                      <div className="hundred-days-voice-player">

                        <span className="material-symbols-rounded">
                          graphic_eq
                        </span>

                        {item.media_type ===
                        "audio" ? (
                          <audio
                            controls
                            src={
                              item.media_url
                            }
                          />
                        ) : (
                          <a
                            href={
                              item.media_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            음성 재생
                          </a>
                        )}

                      </div>
                    ) : null}


                    {item.original_text ? (
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
                    ) : null}


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
                        className="hundred-days-image"
                      />
                    ) : null}


                    {meta.note ? (
                      <div className="hundred-days-meta-note">
                        <strong>
                          NOTE
                        </strong>
                        <span>
                          {meta.note}
                        </span>
                      </div>
                    ) : null}

                  </div>

                </details>
              );
            }
          )}

        </div>

      </section>

    </main>
  );
}
