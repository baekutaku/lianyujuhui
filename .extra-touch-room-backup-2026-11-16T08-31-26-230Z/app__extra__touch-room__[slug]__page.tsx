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


async function loadRelations(
  db: any,
  itemId: string
) {
  const {
    data: rows,
  } =
    await db
      .from(
        "extra_touch_room_relations"
      )
      .select(
        "target_type, target_id, sort_order"
      )
      .eq(
        "touch_room_id",
        itemId
      )
      .order(
        "sort_order",
        { ascending: true }
      );


  const relationRows =
    rows ?? [];


  async function loadType(
    type:
      | "card"
      | "illustration"
      | "story"
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
      type === "illustration"
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
    events,
  ] =
    await Promise.all([
      loadType("card"),
      loadType(
        "illustration"
      ),
      loadType("story"),
      loadType("event"),
    ]);


  return {
    cards,
    illustrations,
    stories,
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
    | "event";
}) {
  if (!items.length) {
    return null;
  }


  return (
    <section className="touch-room-related-section">

      <h2>
        {title}
      </h2>


      <div className="touch-room-related-grid">

        {items.map(
          (item) => {

            const href =
              type === "card"
                ? "/cards/" +
                  item.slug
                : type === "story"
                  ? "/stories/" +
                    item.slug
                  : "/events/" +
                    item.slug;


            return (
              <Link
                key={item.id}
                href={href}
                className="touch-room-related-card"
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
    <section className="touch-room-related-section">

      <h2>
        연결 카드 외 일러스트
      </h2>


      <div className="touch-room-illustration-grid">

        {items.map(
          (item) => (
            <Link
              key={item.id}
              href={
                "/illustrations/" +
                item.id +
                "?illustrations=1"
              }
              className="touch-room-illustration-card"
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
        "extra_touch_room_items"
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


  const {
    data: character,
  } =
    await db
      .from("characters")
      .select(
        "name_ko"
      )
      .eq(
        "key",
        item.character_key
      )
      .maybeSingle();


  const relations =
    await loadRelations(
      db,
      item.id
    );


  const yt =
    youtubeId(
      item.video_url
    );


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / TOUCH ROOM
          </p>

          <h1 className="extra-title">
            {item.title}
          </h1>

          <p className="extra-description">
            {[
              character?.name_ko ||
                item.character_key,

              item.occasion,

              item.release_date,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

        </div>


        <div className="touch-room-head-actions">

          {admin ? (
            <Link
              href={
                "/extra/touch-room/" +
                item.slug +
                "/edit"
              }
              className="primary-button"
            >
              수정
            </Link>
          ) : null}


          <Link
            href="/extra/touch-room"
            className="extra-back-link"
          >
            ← 목록
          </Link>

        </div>

      </header>


      <section className="touch-room-detail-main">

        <div className="touch-room-player-wrap">

          {yt ? (
            <iframe
              src={
                "https://www.youtube.com/embed/" +
                yt
              }
              title={item.title}
              allowFullScreen
            />
          ) : (
            <a
              href={
                item.video_url
              }
              target="_blank"
              rel="noreferrer"
              className="touch-room-external-video"
            >
              영상 열기
            </a>
          )}

        </div>


        <div className="touch-room-script-panel">

          {item.original_text ? (
            <article>

              <span className="extra-category-kicker">
                ORIGINAL
              </span>

              <p>
                {item.original_text}
              </p>

            </article>
          ) : null}


          {item.translation_text ? (
            <article>

              <span className="extra-category-kicker">
                TRANSLATION
              </span>

              <p>
                {
                  item.translation_text
                }
              </p>

            </article>
          ) : null}


          {!item.original_text &&
          !item.translation_text ? (
            <p className="touch-room-no-script">
              등록된 원문/번역이 없습니다.
            </p>
          ) : null}

        </div>

      </section>


      <div className="touch-room-relations">

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

      </div>

    </main>
  );
}
