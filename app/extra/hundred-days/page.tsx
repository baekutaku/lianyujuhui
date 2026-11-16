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


export default async function Page({
  searchParams,
}: {
  searchParams:
    Promise<{
      character?: string;
    }>;
}) {
  const params =
    await searchParams;

  const admin =
    await isAdmin();

  const db: any =
    admin
      ? supabaseAdmin
      : supabase;

  const character =
    String(
      params.character ??
      "baiqi"
    );

  let query =
    db
      .from(
        "extra_hundred_days_series"
      )
      .select("*");

  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }

  if (
    character !== "all"
  ) {
    query =
      query.eq(
        "character_key",
        character
      );
  }

  const [
    { data: seriesRows },
    { data: characters },
  ] =
    await Promise.all([
      query
        .order(
          "year",
          {
            ascending: false,
          }
        )
        .order(
          "title_cn",
          {
            ascending: true,
          }
        ),

      db
        .from("characters")
        .select(
          "key, name_ko"
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),
    ]);

  const characterMap =
    new Map(
      (characters ?? [])
        .map(
          (row: any) => [
            row.key,
            row.name_ko ||
              row.key,
          ]
        )
    );

  const rows =
    seriesRows ?? [];


  return (
    <main className="extra-page hundred-days-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / HUNDRED DAYS
          </p>

          <h1 className="extra-title">
            백일동반
          </h1>

          <p className="extra-description">
            연도별 백일동반 기록을
            사전 이야기와 DAY 0~100
            중심으로 정리합니다.
          </p>

        </div>


        <div className="hundred-days-head-actions">

          {admin ? (
            <Link
              href="/extra/hundred-days/new"
              className="primary-button"
            >
              시리즈 등록
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


      <form
        method="get"
        className="hundred-days-filter"
      >

        <select
          name="character"
          defaultValue={
            character
          }
        >
          <option value="all">
            전체 캐릭터
          </option>

          {(characters ?? [])
            .map(
              (row: any) => (
                <option
                  key={row.key}
                  value={row.key}
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
          className="mini-button"
        >
          보기
        </button>

      </form>


      {rows.length === 0 ? (
        <section className="extra-empty-panel">
          <strong>
            등록된 백일동반 시리즈가 없습니다.
          </strong>
        </section>
      ) : (
        <section className="hundred-days-series-grid">

          {rows.map(
            (item: any) => (
              <Link
                key={item.id}
                href={
                  "/extra/hundred-days/" +
                  encodeURIComponent(
                    item.slug
                  )
                }
                className="hundred-days-series-card"
              >

                {item.thumbnail_url ? (
                  <img
                    src={
                      item.thumbnail_url
                    }
                    alt=""
                  />
                ) : (
                  <div className="hundred-days-series-placeholder">
                    <span className="material-symbols-rounded">
                      history_edu
                    </span>
                  </div>
                )}


                <div className="hundred-days-series-body">

                  <span className="hundred-days-series-year">
                    {item.year}
                  </span>


                  <strong>
                    {
                      item.title_ko ||
                      item.title_cn
                    }
                  </strong>


                  {item.title_ko ? (
                    <span>
                      {item.title_cn}
                    </span>
                  ) : null}


                  <small>
                    {
                      characterMap.get(
                        item.character_key
                      ) ??
                      item.character_key
                    }
                  </small>

                </div>

              </Link>
            )
          )}

        </section>
      )}

    </main>
  );
}
