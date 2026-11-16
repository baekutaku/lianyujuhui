"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


type VideoItem = {
  server:
    | "CN"
    | "KR"
    | "OTHER";

  url: string;

  thumbnail_url?:
    string | null;
};


async function requireAdmin() {
  const admin =
    await isAdmin();

  if (!admin) {
    throw new Error(
      "관리자 권한이 필요합니다."
    );
  }
}


function clean(
  value:
    FormDataEntryValue |
    null
) {
  return String(
    value ?? ""
  ).trim();
}


function slugify(
  value: string
) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[^a-z0-9가-힣]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      120
    );
}


function parseLines(
  value:
    FormDataEntryValue |
    null
) {
  return Array.from(
    new Set(
      clean(value)
        .split(/\r?\n/)
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}


function parseVideos(
  formData: FormData
): VideoItem[] {

  const raw =
    clean(
      formData.get(
        "videosJson"
      )
    );


  if (!raw) {
    return [];
  }


  let parsed: unknown;


  try {
    parsed =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "영상 목록 형식이 올바르지 않습니다."
    );
  }


  if (!Array.isArray(parsed)) {
    return [];
  }


  return parsed
    .map<VideoItem>(
      (item: any) => ({
        server:
          item?.server === "KR"
            ? "KR"
            : item?.server === "OTHER"
              ? "OTHER"
              : "CN",

        url:
          String(
            item?.url ??
            ""
          ).trim(),
      })
    )
    .filter(
      (item) =>
        /^https?:\/\//i
          .test(item.url)
    );
}


function decodeHtml(
  value: string
) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}


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


async function resolveVideoThumbnail(
  url: string
) {
  const yt =
    youtubeId(url);


  if (yt) {
    return (
      "https://img.youtube.com/vi/" +
      yt +
      "/hqdefault.jpg"
    );
  }


  try {
    const response =
      await fetch(
        url,
        {
          redirect:
            "follow",

          cache:
            "no-store",

          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/157 Safari/537.36",

            accept:
              "text/html,application/xhtml+xml",
          },
        }
      );


    if (!response.ok) {
      return null;
    }


    const contentType =
      response.headers
        .get(
          "content-type"
        ) ?? "";


    if (
      !contentType.includes(
        "text/html"
      )
    ) {
      return null;
    }


    const html =
      await response.text();


    const patterns = [
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i,
    ];


    for (
      const pattern
      of patterns
    ) {
      const match =
        html.match(pattern);


      const image =
        String(
          match?.[1] ??
          ""
        ).trim();


      if (image) {
        return decodeHtml(
          image
        );
      }
    }

  } catch {
    /* 웨이보가 서버 요청을 막으면
       썸네일 없이 처리 */
  }


  return null;
}


async function enrichVideoThumbnails(
  videos: VideoItem[]
) {
  const output:
    VideoItem[] = [];


  for (
    const video
    of videos
  ) {
    output.push({
      ...video,

      thumbnail_url:
        await resolveVideoThumbnail(
          video.url
        ),
    });
  }


  return output;
}


function getTargetTable(
  type: string
) {
  if (
    type === "card"
  ) {
    return "cards";
  }

  if (
    type === "story"
  ) {
    return "stories";
  }

  if (
    type === "phone_item"
  ) {
    return "phone_items";
  }

  if (
    type === "event"
  ) {
    return "events";
  }

  throw new Error(
    "지원하지 않는 relation type: " +
    type
  );
}


async function syncPvRelations({
  pvId,
  targetType,
  slugs,
}: {
  pvId: string;

  targetType:
    | "card"
    | "story"
    | "phone_item"
    | "event";

  slugs: string[];
}) {

  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .delete()
      .eq(
        "pv_id",
        pvId
      )
      .eq(
        "target_type",
        targetType
      );


  if (deleteError) {
    throw new Error(
      deleteError.message
    );
  }


  if (!slugs.length) {
    return;
  }


  const table =
    getTargetTable(
      targetType
    );


  const {
    data: targets,
    error: lookupError,
  } =
    await supabaseAdmin
      .from(table)
      .select(
        "id, slug"
      )
      .in(
        "slug",
        slugs
      );


  if (lookupError) {
    throw new Error(
      lookupError.message
    );
  }


  const idMap =
    new Map(
      (targets ?? []).map(
        (item: any) => [
          item.slug,
          item.id,
        ]
      )
    );


  const rows =
    slugs
      .map(
        (slug, index) => ({
          pv_id:
            pvId,

          target_type:
            targetType,

          target_id:
            idMap.get(slug),

          sort_order:
            index,
        })
      )
      .filter(
        (row) =>
          Boolean(
            row.target_id
          )
      );


  if (!rows.length) {
    return;
  }


  const { error } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .insert(rows);


  if (error) {
    throw new Error(
      error.message
    );
  }
}


async function syncPvIllustrations(
  pvId: string,
  ids: string[]
) {
  const cleanIds =
    Array.from(
      new Set(
        ids
          .map(
            (id) =>
              id.trim()
          )
          .filter(Boolean)
      )
    );


  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .delete()
      .eq(
        "pv_id",
        pvId
      )
      .eq(
        "target_type",
        "illustration"
      );


  if (deleteError) {
    throw new Error(
      deleteError.message
    );
  }


  if (!cleanIds.length) {
    return;
  }


  const {
    data,
    error: lookupError,
  } =
    await supabaseAdmin
      .from(
        "illustrations"
      )
      .select("id")
      .in(
        "id",
        cleanIds
      );


  if (lookupError) {
    throw new Error(
      lookupError.message
    );
  }


  const valid =
    new Set(
      (data ?? [])
        .map(
          (item: any) =>
            item.id
        )
    );


  const rows =
    cleanIds
      .filter(
        (id) =>
          valid.has(id)
      )
      .map(
        (id, index) => ({
          pv_id:
            pvId,

          target_type:
            "illustration",

          target_id:
            id,

          sort_order:
            index,
        })
      );


  if (!rows.length) {
    return;
  }


  const { error } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .insert(rows);


  if (error) {
    throw new Error(
      error.message
    );
  }
}


async function syncAllRelations(
  pvId: string,
  formData: FormData
) {

  await syncPvRelations({
    pvId,

    targetType:
      "card",

    slugs:
      parseLines(
        formData.get(
          "linkedCardSlugs"
        )
      ),
  });


  await syncPvIllustrations(
    pvId,

    parseLines(
      formData.get(
        "linkedIllustrationIds"
      )
    )
  );


  await syncPvRelations({
    pvId,

    targetType:
      "story",

    slugs:
      parseLines(
        formData.get(
          "linkedStorySlugs"
        )
      ),
  });


  await syncPvRelations({
    pvId,

    targetType:
      "phone_item",

    slugs:
      parseLines(
        formData.get(
          "linkedPhoneItemSlugs"
        )
      ),
  });


  await syncPvRelations({
    pvId,

    targetType:
      "event",

    slugs:
      parseLines(
        formData.get(
          "linkedEventSlugs"
        )
      ),
  });
}


async function buildPayload(
  formData: FormData
) {

  const title =
    clean(
      formData.get(
        "title"
      )
    );


  if (!title) {
    throw new Error(
      "제목을 입력해 주세요."
    );
  }


  const releaseDate =
    clean(
      formData.get(
        "releaseDate"
      )
    );


  const rawSlug =
    clean(
      formData.get(
        "slug"
      )
    );


  const slug =
    rawSlug ||
    slugify(title) ||
    (
      "pv-" +
      Date.now()
    );


  const videos =
    await enrichVideoThumbnails(
      parseVideos(
        formData
      )
    );


  const firstCn =
    videos.find(
      (item) =>
        item.server ===
        "CN"
    )?.url ?? null;


  const firstKr =
    videos.find(
      (item) =>
        item.server ===
        "KR"
    )?.url ?? null;


  return {
    title,
    slug,

    release_date:
      releaseDate ||
      null,

    release_year:
      releaseDate
        ? Number(
            releaseDate.slice(
              0,
              4
            )
          )
        : null,

    character_keys:
      formData
        .getAll(
          "characterKeys"
        )
        .map(
          (value) =>
            String(
              value
            ).trim()
        )
        .filter(Boolean),

    videos,

    /* 기존 데이터 호환 */
    video_cn_url:
      firstCn,

    video_kr_url:
      firstKr,

    image_urls:
      parseLines(
        formData.get(
          "imageUrls"
        )
      ),

    original_text:
      clean(
        formData.get(
          "originalText"
        )
      ) || null,

    translation_text:
      clean(
        formData.get(
          "translationText"
        )
      ) || null,

    related_event_slug:
      null,

    is_published:
      formData.get(
        "isPublished"
      ) === "on",

    updated_at:
      new Date()
        .toISOString(),
  };
}


export async function createExtraPv(
  formData: FormData
) {

  await requireAdmin();


  const payload =
    await buildPayload(
      formData
    );


  const {
    data: inserted,
    error,
  } =
    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .insert(payload)
      .select(
        "id, slug"
      )
      .single();


  if (
    error ||
    !inserted
  ) {
    throw new Error(
      error?.message ??
      "PV 생성 실패"
    );
  }


  try {
    await syncAllRelations(
      inserted.id,
      formData
    );
  } catch (error) {

    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .delete()
      .eq(
        "id",
        inserted.id
      );

    throw error;
  }


  revalidatePath(
    "/extra/pv"
  );


  redirect(
    "/extra/pv/" +
    inserted.slug
  );
}


export async function updateExtraPv(
  formData: FormData
) {

  await requireAdmin();


  const id =
    clean(
      formData.get(
        "id"
      )
    );


  const oldSlug =
    clean(
      formData.get(
        "oldSlug"
      )
    );


  if (!id) {
    throw new Error(
      "PV id가 없습니다."
    );
  }


  const payload =
    await buildPayload(
      formData
    );


  const { error } =
    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .update(payload)
      .eq(
        "id",
        id
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  await syncAllRelations(
    id,
    formData
  );


  revalidatePath(
    "/extra/pv"
  );


  if (oldSlug) {
    revalidatePath(
      "/extra/pv/" +
      oldSlug
    );
  }


  revalidatePath(
    "/extra/pv/" +
    payload.slug
  );


  redirect(
    "/extra/pv/" +
    payload.slug
  );
}


export async function deleteExtraPv(
  formData: FormData
) {

  await requireAdmin();


  const id =
    clean(
      formData.get(
        "id"
      )
    );


  if (!id) {
    throw new Error(
      "PV id가 없습니다."
    );
  }


  const { error } =
    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  revalidatePath(
    "/extra/pv"
  );


  redirect(
    "/extra/pv"
  );
}

