import Link
  from "next/link";

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

import {
  getPhoneItemHref,
} from "@/lib/utils/getPhoneItemHref";


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

  return match?.[1] ??
    "";
}


function bilibiliId(
  url: string
) {
  const match =
    url.match(
      /\b(BV[A-Za-z0-9]+)\b/i
    );

  return match?.[1] ??
    "";
}


function isDirectVideo(
  url: string
) {
  return /\.(mp4|webm|ogg)(?:$|[?#])/i
    .test(url);
}


function VideoBlock({
  video,
  index,
}: {
  video: any;
  index: number;
}) {

  const url =
    String(
      video?.url ??
      ""
    ).trim();


  if (!url) {
    return null;
  }


  const yt =
    youtubeId(url);

  const bili =
    bilibiliId(url);


  return (
    <article className="extra-pv-video-block">

      <div className="extra-pv-video-label">
        {
          video.server ||
          "VIDEO"
        }{" "}
        {index + 1}
      </div>


      {yt ? (
        <iframe
          src={
            "https://www.youtube.com/embed/" +
            yt
          }
          title={
            "PV video " +
            index
          }
          allowFullScreen
        />
      ) : bili ? (
        <iframe
          src={
            "https://player.bilibili.com/player.html?bvid=" +
            encodeURIComponent(
              bili
            ) +
            "&autoplay=0"
          }
          title={
            "PV video " +
            index
          }
          allowFullScreen
        />
      ) : isDirectVideo(
          url
        ) ? (
        <video
          controls
          preload="metadata"
          src={url}
        />
      ) : (
        <div className="extra-pv-external-video">

          <span className="material-symbols-rounded">
            play_circle
          </span>

          <div>

            <strong>
              {
                video.server ||
                "VIDEO"
              }
            </strong>

            <p>
              외부 사이트 영상
            </p>

          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            영상 열기
          </a>

        </div>
      )}

    </article>
  );
}


async function loadRelations(
  db: any,
  pvId: string
) {

  const {
    data: rows,
  } =
    await db
      .from(
        "extra_pv_relations"
      )
      .select(
        "target_type, target_id, sort_order"
      )
      .eq(
        "pv_id",
        pvId
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        }
      );


  const relationRows =
    rows ?? [];


  async function loadType(
    type:
      | "card"
      | "illustration"
      | "story"
      | "phone_item"
      | "event"
  ) {

    const selected =
      relationRows.filter(
        (row: any) =>
          row.target_type ===
          type
      );


    if (!selected.length) {
      return [];
    }


    const ids =
      selected.map(
        (row: any) =>
          row.target_id
      );


    let query;


    if (
      type ===
      "phone_item"
    ) {

      query =
        db
          .from(
            "phone_items"
          )
          .select(
            "id, title, slug, subtype, content_json"
          )
          .in(
            "id",
            ids
          );

    } else if (
      type ===
      "illustration"
    ) {

      query =
        db
          .from(
            "illustrations"
          )
          .select(
            "id, title, image_url"
          )
          .in(
            "id",
            ids
          );

    } else {

      const table =
        type === "card"
          ? "cards"
          : type === "story"
            ? "stories"
            : "events";


      query =
        db
          .from(table)
          .select(
            "id, title, slug"
          )
          .in(
            "id",
            ids
          );
    }


    const {
      data,
    } =
      await query;


    const map =
      new Map(
        (data ?? []).map(
          (item: any) => [
            item.id,
            item,
          ]
        )
      );


    return selected
      .map(
        (row: any) =>
          map.get(
            row.target_id
          )
      )
      .filter(Boolean);
  }


  const [
    cards,
    illustrations,
    stories,
    phoneItems,
    events,
  ] =
    await Promise.all([
      loadType("card"),
      loadType(
        "illustration"
      ),
      loadType("story"),
      loadType(
        "phone_item"
      ),
      loadType("event"),
    ]);


  return {
    cards,
    illustrations,
    stories,
    phoneItems,
    events,
  };
}


function RelationSection({
  title,
  items,
  type,
}: {
  title: string;
  items: any[];

  type:
    | "card"
    | "story"
    | "phone"
    | "event";
}) {

  if (!items.length) {
    return null;
  }


  return (
    <section className="extra-pv-related-section">

      <h2>
        {title}
      </h2>


      <div className="extra-pv-related-grid">

        {items.map(
          (item) => {

            let href = "#";


            if (
              type === "card"
            ) {
              href =
                "/cards/" +
                item.slug;
            }


            if (
              type === "story"
            ) {
              href =
                "/stories/" +
                item.slug;
            }


            if (
              type === "event"
            ) {
              href =
                "/events/" +
                item.slug;
            }


            if (
              type === "phone"
            ) {
              href =
                getPhoneItemHref(
                  item
                );
            }


            return (
              <Link
                key={item.id}
                href={href}
                className="extra-pv-related-card"
              >

                <strong>
                  {item.title}
                </strong>

                <span className="material-symbols-rounded">
                  arrow_forward
                </span>

              </Link>
            );
          }
        )}

      </div>

    </section>
  );
}


function IllustrationSection({
  items,
}: {
  items: any[];
}) {

  if (!items.length) {
    return null;
  }


  return (
    <section className="extra-pv-related-section">

      <h2>
        연결 카드 외 일러스트
      </h2>


      <div className="extra-pv-illustration-grid">

        {items.map(
          (item) => (

            <Link
              key={item.id}
              href={
                "/illustrations/" +
                item.id +
                "?illustrations=1"
              }
              className="extra-pv-illustration-card"
            >

              {item.image_url ? (
                <img
                  src={
                    item.image_url
                  }
                  alt={
                    item.title ||
                    ""
                  }
                />
              ) : null}


              <span>
                {
                  item.title ||
                  "제목 없음"
                }
              </span>

            </Link>
          )
        )}

      </div>

    </section>
  );
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
    slug,
  } =
    await params;


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
      .select("*")
      .eq(
        "slug",
        slug
      );


  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }


  const {
    data: item,
  } =
    await query
      .maybeSingle();


  if (!item) {
    notFound();
  }


  let videos =
    Array.isArray(
      item.videos
    )
      ? [...item.videos]
      : [];


  if (!videos.length) {

    if (
      item.video_cn_url
    ) {
      videos.push({
        server: "CN",
        url:
          item.video_cn_url,
      });
    }


    if (
      item.video_kr_url
    ) {
      videos.push({
        server: "KR",
        url:
          item.video_kr_url,
      });
    }
  }


  const relations =
    await loadRelations(
      db,
      item.id
    );


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV
          </p>

          <h1 className="extra-title">
            {item.title}
          </h1>

          <p className="extra-description">
            {[
              item.release_date,

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
                .join(" · "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

        </div>


        <div className="extra-pv-head-actions">

          {admin ? (
            <Link
              href={
                "/extra/pv/" +
                item.slug +
                "/edit"
              }
              className="primary-button"
            >
              수정
            </Link>
          ) : null}


          <Link
            href="/extra/pv"
            className="extra-back-link"
          >
            ← PV 목록
          </Link>

        </div>

      </header>


      {videos.length ? (
        <section className="extra-pv-video-grid">

          {videos.map(
            (
              video: any,
              index: number
            ) => (

              <VideoBlock
                key={
                  String(
                    video.url
                  ) +
                  index
                }
                video={video}
                index={index}
              />
            )
          )}

        </section>
      ) : null}


      {item.image_urls?.length ? (
        <section className="extra-pv-detail-gallery">

          {item.image_urls.map(
            (
              url: string,
              index: number
            ) => (
              <img
                key={
                  url +
                  index
                }
                src={url}
                alt=""
              />
            )
          )}

        </section>
      ) : null}


      {item.original_text ||
      item.translation_text ? (

        <section className="extra-pv-text-grid">

          {item.original_text ? (
            <article>

              <span className="extra-category-kicker">
                ORIGINAL
              </span>

              <div className="extra-pv-prose">
                {
                  item.original_text
                }
              </div>

            </article>
          ) : null}


          {item.translation_text ? (
            <article>

              <span className="extra-category-kicker">
                TRANSLATION
              </span>

              <div className="extra-pv-prose">
                {
                  item.translation_text
                }
              </div>

            </article>
          ) : null}

        </section>
      ) : null}


      <div className="extra-pv-relations">

        <RelationSection
          title="연결 스토리"
          items={
            relations.stories
          }
          type="story"
        />


        <RelationSection
          title="연결 카드"
          items={
            relations.cards
          }
          type="card"
        />


        <IllustrationSection
          items={
            relations.illustrations
          }
        />


        <RelationSection
          title="연결 이벤트"
          items={
            relations.events
          }
          type="event"
        />


        <RelationSection
          title="연결 휴대폰"
          items={
            relations.phoneItems
          }
          type="phone"
        />

      </div>

    </main>
  );
}
