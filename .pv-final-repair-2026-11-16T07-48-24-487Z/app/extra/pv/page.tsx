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

const CHARACTER_NAMES:
  Record<string, string> = {
    baiqi: "백기",
    lizeyan: "이택언",
    zhouqiluo: "주기락",
    xumo: "허묵",
    lingxiao: "연시호",
  };

function youtubeId(
  url?: string | null
) {
  if (!url) return "";

  const match =
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ?? "";
}

export default async function Page() {
  const admin =
    await isAdmin();

  const db =
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
        video_cn_url,
        video_kr_url,
        image_urls,
        is_published,
        created_at
        `
      )
      .order(
        "release_date",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }

  const {
    data,
    error,
  } =
    await query;

  const items =
    data ?? [];

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
            프로모션 영상과
            관련 이미지를 정리합니다.
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
            등록된 PV가 없습니다.
          </strong>

          <p>
            관리자라면 위의
            PV 등록 버튼에서
            추가할 수 있습니다.
          </p>

        </section>
      ) : null}


      {items.length ? (
        <section className="extra-pv-grid">

          {items.map(
            (item: any) => {

              const videoId =
                youtubeId(
                  item.video_kr_url
                ) ||
                youtubeId(
                  item.video_cn_url
                );

              const thumb =
                item.image_urls?.[0] ||
                (
                  videoId
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : ""
                );

              const characters =
                (
                  item.character_keys ??
                  []
                )
                  .map(
                    (key: string) =>
                      CHARACTER_NAMES[
                        key
                      ] ?? key
                  )
                  .join(" · ");

              return (
                <Link
                  key={item.id}
                  href={
                    `/extra/pv/${item.slug}`
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
