import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";

export const revalidate = 60;

export default async function Page() {
  const admin = await isAdmin();

  let query = supabase
    .from("stories")
    .select(
      "id, title, slug, release_year, release_date, primary_character_id, visibility"
    )
    .eq("subtype", "promo_video")
    .eq("is_published", true)
    .order(
      "release_date",
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    .order(
      "release_year",
      {
        ascending: false,
      }
    );

  if (!admin) {
    query =
      query.neq(
        "visibility",
        "private"
      );
  }

  const {
    data: rows,
    error,
  } = await query;

  const items =
    rows ?? [];

  const ids =
    items.map(
      (item: any) =>
        item.id
    );

  const characterIds =
    Array.from(
      new Set(
        items
          .map(
            (item: any) =>
              item.primary_character_id
          )
          .filter(Boolean)
      )
    );

  const [
    { data: mediaRows },
    { data: characterRows },
  ] =
    await Promise.all([
      ids.length
        ? supabase
            .from("media_assets")
            .select(
              "parent_id, media_type, usage_type, url, youtube_video_id, thumbnail_url, sort_order"
            )
            .eq(
              "parent_type",
              "story"
            )
            .in(
              "parent_id",
              ids
            )
            .order(
              "sort_order",
              {
                ascending: true,
              }
            )
        : Promise.resolve({
            data: [] as any[],
          }),

      characterIds.length
        ? supabase
            .from("characters")
            .select(
              "id, name_ko"
            )
            .in(
              "id",
              characterIds
            )
        : Promise.resolve({
            data: [] as any[],
          }),
    ]);

  const characterMap =
    new Map(
      (characterRows ?? [])
        .map(
          (item: any) => [
            item.id,
            item.name_ko,
          ]
        )
    );

  const mediaMap =
    new Map<
      string,
      any[]
    >();

  for (
    const media
    of mediaRows ?? []
  ) {
    const prev =
      mediaMap.get(
        media.parent_id
      ) ?? [];

    prev.push(media);

    mediaMap.set(
      media.parent_id,
      prev
    );
  }

  const getThumb =
    (storyId: string) => {
      const media =
        mediaMap.get(
          storyId
        ) ?? [];

      const cover =
        media.find(
          (item) =>
            item.media_type ===
              "image" &&
            item.usage_type ===
              "cover"
        );

      const gallery =
        media.find(
          (item) =>
            item.media_type ===
              "image" &&
            item.usage_type ===
              "story_gallery"
        );

      const video =
        media.find(
          (item) =>
            item.usage_type ===
              "pv_kr"
        ) ??
        media.find(
          (item) =>
            item.usage_type ===
              "pv_cn"
        );

      return (
        cover?.url ||
        gallery?.url ||
        video?.thumbnail_url ||
        (
          video?.youtube_video_id
            ? "https://img.youtube.com/vi/" +
              video.youtube_video_id +
              "/hqdefault.jpg"
            : ""
        )
      );
    };

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
            프로모션 영상과 관련 이미지를
            정리합니다.
          </p>
        </div>

        <div className="extra-pv-head-actions">

          {admin ? (
            <Link
              href="/admin/stories/new?sub=promo_video"
              className="extra-pv-admin-button"
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
            등록된 PV / 공식 영상이 없습니다.
          </strong>

          <p>
            관리자에서 스토리 카테고리를
            “PV / 공식 영상”으로 선택해
            등록하면 이곳에만 표시됩니다.
          </p>

        </section>
      ) : null}


      {items.length > 0 ? (
        <section className="extra-pv-grid">

          {items.map(
            (item: any) => {

              const thumb =
                getThumb(
                  item.id
                );

              const meta =
                [
                  item.release_date ||
                    (
                      item.release_year
                        ? String(
                            item.release_year
                          )
                        : ""
                    ),

                  characterMap.get(
                    item.primary_character_id
                  ) || "",
                ]
                  .filter(Boolean)
                  .join(" · ");

              return (
                <article
                  key={item.id}
                  className="extra-pv-card"
                >

                  <Link
                    href={
                      "/stories/" +
                      encodeURIComponent(
                        item.slug
                      )
                    }
                    className="extra-pv-card-link"
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

                      {meta ? (
                        <span>
                          {meta}
                        </span>
                      ) : null}

                    </div>

                  </Link>

                  {admin ? (
                    <Link
                      href={
                        "/admin/stories/" +
                        encodeURIComponent(
                          item.slug
                        ) +
                        "/edit"
                      }
                      className="extra-pv-edit-link"
                    >
                      수정
                    </Link>
                  ) : null}

                </article>
              );
            }
          )}

        </section>
      ) : null}

    </main>
  );
}
