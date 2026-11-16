import {
  NextResponse,
} from "next/server";

import {
  revalidatePath,
} from "next/cache";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


function clean(
  value:
    FormDataEntryValue |
    null
) {
  return String(
    value ?? ""
  ).trim();
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


function youtubeId(
  url: string
) {
  const match =
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
    );

  return (
    match?.[1] ??
    ""
  );
}


async function uniqueSlug(
  requested: string,
  excludeId?: string
) {
  const base =
    requested ||
    "touch-room";


  let query =
    supabaseAdmin
      .from(
        "extra_touch_room_items"
      )
      .select(
        "id, slug"
      )
      .like(
        "slug",
        `${base}%`
      );


  if (excludeId) {
    query =
      query.neq(
        "id",
        excludeId
      );
  }


  const {
    data,
    error,
  } =
    await query;


  if (error) {
    throw new Error(
      error.message
    );
  }


  const used =
    new Set(
      (data ?? []).map(
        (item: any) =>
          String(
            item.slug
          )
      )
    );


  if (!used.has(base)) {
    return base;
  }


  let index = 2;


  while (
    used.has(
      `${base}-${index}`
    )
  ) {
    index += 1;
  }


  return `${base}-${index}`;
}


async function buildPayload(
  formData: FormData,
  excludeId?: string
) {
  const characterKey =
    clean(
      formData.get(
        "characterKey"
      )
    );


  const title =
    clean(
      formData.get(
        "title"
      )
    );


  const videoUrl =
    clean(
      formData.get(
        "videoUrl"
      )
    );


  if (
    !characterKey ||
    !title ||
    !videoUrl
  ) {
    throw new Error(
      "캐릭터, 제목, 영상 URL은 필수입니다."
    );
  }


  const rawSlug =
    clean(
      formData.get(
        "slug"
      )
    );


  const baseSlug =
    slugify(
      rawSlug ||
      title
    ) ||
    "touch-room";


  const slug =
    await uniqueSlug(
      baseSlug,
      excludeId
    );


  const customThumbnail =
    clean(
      formData.get(
        "thumbnailUrl"
      )
    );


  const yt =
    youtubeId(
      videoUrl
    );


  return {
    character_key:
      characterKey,

    title,

    slug,

    release_date:
      clean(
        formData.get(
          "releaseDate"
        )
      ) || null,

    occasion:
      clean(
        formData.get(
          "occasion"
        )
      ) || null,

    video_url:
      videoUrl,

    thumbnail_url:
      customThumbnail ||
      (
        yt
          ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg`
          : null
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

    is_published:
      formData.get(
        "isPublished"
      ) === "on",

    updated_at:
      new Date()
        .toISOString(),
  };
}


function relationTable(
  type:
    | "card"
    | "story"
    | "event"
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

  return "events";
}


async function syncSlugRelation({
  itemId,
  type,
  slugs,
}: {
  itemId: string;

  type:
    | "card"
    | "story"
    | "event";

  slugs: string[];
}) {
  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "extra_touch_room_relations"
      )
      .delete()
      .eq(
        "touch_room_id",
        itemId
      )
      .eq(
        "target_type",
        type
      );


  if (deleteError) {
    throw new Error(
      deleteError.message
    );
  }


  if (!slugs.length) {
    return;
  }


  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        relationTable(type)
      )
      .select(
        "id, slug"
      )
      .in(
        "slug",
        slugs
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  const idMap =
    new Map(
      (data ?? []).map(
        (item: any) => [
          item.slug,
          item.id,
        ]
      )
    );


  const rows =
    slugs
      .map(
        (
          slug,
          index
        ) => ({
          touch_room_id:
            itemId,

          target_type:
            type,

          target_id:
            idMap.get(
              slug
            ),

          sort_order:
            index,
        })
      )
      .filter(
        (item) =>
          Boolean(
            item.target_id
          )
      );


  if (!rows.length) {
    return;
  }


  const {
    error: insertError,
  } =
    await supabaseAdmin
      .from(
        "extra_touch_room_relations"
      )
      .insert(rows);


  if (insertError) {
    throw new Error(
      insertError.message
    );
  }
}


async function syncIllustrations(
  itemId: string,
  ids: string[]
) {
  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "extra_touch_room_relations"
      )
      .delete()
      .eq(
        "touch_room_id",
        itemId
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


  if (!ids.length) {
    return;
  }


  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "illustrations"
      )
      .select("id")
      .in(
        "id",
        ids
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  const valid =
    new Set(
      (data ?? []).map(
        (item: any) =>
          item.id
      )
    );


  const rows =
    ids
      .filter(
        (id) =>
          valid.has(id)
      )
      .map(
        (
          id,
          index
        ) => ({
          touch_room_id:
            itemId,

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


  const {
    error: insertError,
  } =
    await supabaseAdmin
      .from(
        "extra_touch_room_relations"
      )
      .insert(rows);


  if (insertError) {
    throw new Error(
      insertError.message
    );
  }
}


async function syncRelations(
  itemId: string,
  formData: FormData
) {
  await syncSlugRelation({
    itemId,

    type:
      "card",

    slugs:
      parseLines(
        formData.get(
          "linkedCardSlugs"
        )
      ),
  });


  await syncIllustrations(
    itemId,

    parseLines(
      formData.get(
        "linkedIllustrationIds"
      )
    )
  );


  await syncSlugRelation({
    itemId,

    type:
      "story",

    slugs:
      parseLines(
        formData.get(
          "linkedStorySlugs"
        )
      ),
  });


  await syncSlugRelation({
    itemId,

    type:
      "event",

    slugs:
      parseLines(
        formData.get(
          "linkedEventSlugs"
        )
      ),
  });
}


function refreshPages(
  slug?: string
) {
  revalidatePath(
    "/extra/touch-room"
  );


  if (slug) {
    revalidatePath(
      `/extra/touch-room/${slug}`
    );
  }
}


export async function POST(
  request: Request
) {
  try {
    if (
      !(await isAdmin())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "관리자 권한이 필요합니다.",
        },
        {
          status: 401,
        }
      );
    }


    const formData =
      await request.formData();


    const payload =
      await buildPayload(
        formData
      );


    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "extra_touch_room_items"
        )
        .insert(payload)
        .select(
          "id, slug"
        )
        .single();


    if (
      error ||
      !data
    ) {
      throw new Error(
        error?.message ??
        "터치룸 음성 등록 실패"
      );
    }


    try {
      await syncRelations(
        data.id,
        formData
      );
    } catch (error) {
      await supabaseAdmin
        .from(
          "extra_touch_room_items"
        )
        .delete()
        .eq(
          "id",
          data.id
        );

      throw error;
    }


    refreshPages(
      data.slug
    );


    return NextResponse.json({
      ok: true,
      slug:
        data.slug,
    });

  } catch (error) {
    console.error(
      "[touch-room POST]",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "터치룸 음성 등록 실패",
      },
      {
        status: 500,
      }
    );
  }
}


export async function PATCH(
  request: Request
) {
  try {
    if (
      !(await isAdmin())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "관리자 권한이 필요합니다.",
        },
        {
          status: 401,
        }
      );
    }


    const formData =
      await request.formData();


    const id =
      clean(
        formData.get(
          "id"
        )
      );


    if (!id) {
      throw new Error(
        "터치룸 음성 ID가 없습니다."
      );
    }


    const oldSlug =
      clean(
        formData.get(
          "oldSlug"
        )
      );


    const payload =
      await buildPayload(
        formData,
        id
      );


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "extra_touch_room_items"
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


    await syncRelations(
      id,
      formData
    );


    refreshPages(
      oldSlug
    );

    refreshPages(
      payload.slug
    );


    return NextResponse.json({
      ok: true,
      slug:
        payload.slug,
    });

  } catch (error) {
    console.error(
      "[touch-room PATCH]",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "터치룸 음성 수정 실패",
      },
      {
        status: 500,
      }
    );
  }
}


export async function DELETE(
  request: Request
) {
  try {
    if (
      !(await isAdmin())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "관리자 권한이 필요합니다.",
        },
        {
          status: 401,
        }
      );
    }


    const url =
      new URL(
        request.url
      );


    const id =
      String(
        url.searchParams.get(
          "id"
        ) ?? ""
      ).trim();


    if (!id) {
      throw new Error(
        "터치룸 음성 ID가 없습니다."
      );
    }


    const {
      data: before,
    } =
      await supabaseAdmin
        .from(
          "extra_touch_room_items"
        )
        .select(
          "slug"
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "extra_touch_room_items"
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


    refreshPages(
      before?.slug
    );


    return NextResponse.json({
      ok: true,
    });

  } catch (error) {
    console.error(
      "[touch-room DELETE]",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "터치룸 음성 삭제 실패",
      },
      {
        status: 500,
      }
    );
  }
}
