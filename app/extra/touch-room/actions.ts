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


async function requireAdmin() {
  if (
    !(await isAdmin())
  ) {
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


function buildPayload(
  formData: FormData
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


  const slug =
    rawSlug ||
    slugify(title) ||
    (
      "touch-room-" +
      Date.now()
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


  const thumbnailUrl =
    customThumbnail ||
    (
      yt
        ? "https://img.youtube.com/vi/" +
          yt +
          "/hqdefault.jpg"
        : null
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
      thumbnailUrl,

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


function tableFor(
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


async function syncSlugRelations({
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
        tableFor(type)
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


  const map =
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
            map.get(slug),

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


async function syncAllRelations(
  itemId: string,
  formData: FormData
) {
  await syncSlugRelations({
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


  await syncSlugRelations({
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


  await syncSlugRelations({
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


export async function createTouchRoomItem(
  formData: FormData
) {
  await requireAdmin();


  const payload =
    buildPayload(
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
    await syncAllRelations(
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


  revalidatePath(
    "/extra/touch-room"
  );


  redirect(
    "/extra/touch-room/" +
    data.slug
  );
}


export async function updateTouchRoomItem(
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
      "터치룸 음성 ID가 없습니다."
    );
  }


  const payload =
    buildPayload(
      formData
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


  await syncAllRelations(
    id,
    formData
  );


  revalidatePath(
    "/extra/touch-room"
  );


  if (oldSlug) {
    revalidatePath(
      "/extra/touch-room/" +
      oldSlug
    );
  }


  revalidatePath(
    "/extra/touch-room/" +
    payload.slug
  );


  redirect(
    "/extra/touch-room/" +
    payload.slug
  );
}


export async function deleteTouchRoomItem(
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
      "터치룸 음성 ID가 없습니다."
    );
  }


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


  revalidatePath(
    "/extra/touch-room"
  );


  redirect(
    "/extra/touch-room"
  );
}
