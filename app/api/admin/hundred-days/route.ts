import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/utils/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";


function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}


function nullable(value: FormDataEntryValue | null) {
  const text = clean(value);
  return text || null;
}


function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}


async function uniqueSlug(
  requested: string,
  fallback: string,
  excludeId?: string
) {
  let base =
    slugify(requested) ||
    slugify(fallback) ||
    "hundred-days";

  let query = supabaseAdmin
    .from("extra_hundred_days_series")
    .select("id, slug")
    .like("slug", base + "%");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;

  const used =
    new Set(
      (data ?? []).map((row: any) =>
        String(row.slug)
      )
    );

  if (!used.has(base)) {
    return base;
  }

  let n = 2;

  while (used.has(base + "-" + n)) {
    n += 1;
  }

  return base + "-" + n;
}


async function seriesPayload(
  formData: FormData,
  excludeId?: string
) {
  const characterKey =
    clean(formData.get("characterKey")) ||
    "baiqi";

  const year =
    Number(
      clean(formData.get("year"))
    );

  const titleKo =
    clean(formData.get("titleKo"));

  const titleCn =
    clean(formData.get("titleCn"));

  if (!year || !titleCn) {
    throw new Error(
      "연도와 중문명은 필수입니다."
    );
  }

  const slug =
    await uniqueSlug(
      clean(formData.get("slug")),
      characterKey + "-" +
        year + "-" +
        (titleCn || titleKo),
      excludeId
    );

  return {
    character_key: characterKey,
    year,

    title_ko:
      titleKo || null,

    title_cn:
      titleCn,

    slug,

    series_type:
      clean(formData.get("seriesType")) ||
      "custom",

    start_date:
      nullable(
        formData.get("startDate")
      ),

    end_date:
      nullable(
        formData.get("endDate")
      ),

    description:
      nullable(
        formData.get("description")
      ),

    thumbnail_url:
      nullable(
        formData.get("thumbnailUrl")
      ),

    is_published:
      formData.get("isPublished") === "on",

    updated_at:
      new Date().toISOString(),
  };
}


function itemPayload(
  formData: FormData
) {
  const seriesId =
    clean(
      formData.get("seriesId")
    );

  const entryType =
    clean(
      formData.get("entryType")
    ) || "day";

  if (!seriesId) {
    throw new Error(
      "시리즈 ID가 없습니다."
    );
  }

  let dayNumber: number | null =
    null;

  if (entryType === "day") {
    dayNumber =
      Number(
        clean(
          formData.get("dayNumber")
        )
      );

    if (
      !Number.isInteger(dayNumber) ||
      dayNumber < 0 ||
      dayNumber > 100
    ) {
      throw new Error(
        "DAY는 0~100 사이여야 합니다."
      );
    }
  }

  const meta: Record<string, string> =
    {};

  const metaFields = [
    ["location", "location"],
    ["category", "category"],
    ["goal", "goal"],
    ["detailTime", "detail_time"],
    ["missedGoal", "missed_goal"],
    ["note", "note"],
  ] as const;

  for (
    const [field, key]
    of metaFields
  ) {
    const value =
      clean(
        formData.get(field)
      );

    if (value) {
      meta[key] = value;
    }
  }

  const mediaType =
    clean(
      formData.get("mediaType")
    ) || "none";

  let sortOrder =
    Number(
      clean(
        formData.get("sortOrder")
      )
    );

  if (!Number.isFinite(sortOrder)) {
    sortOrder =
      entryType === "prologue"
        ? -1000
        : entryType === "special"
          ? 1000
          : dayNumber ?? 0;
  }

  return {
    series_id: seriesId,

    entry_type:
      entryType,

    day_number:
      dayNumber,

    release_date:
      nullable(
        formData.get("releaseDate")
      ),

    time_text:
      nullable(
        formData.get("timeText")
      ),

    title:
      nullable(
        formData.get("title")
      ),

    original_text:
      nullable(
        formData.get("originalText")
      ),

    translation_text:
      nullable(
        formData.get("translationText")
      ),

    is_voice:
      formData.get("isVoice") === "on",

    media_type:
      mediaType,

    media_url:
      mediaType === "none"
        ? null
        : nullable(
            formData.get("mediaUrl")
          ),

    image_url:
      nullable(
        formData.get("imageUrl")
      ),

    thumbnail_url:
      nullable(
        formData.get("thumbnailUrl")
      ),

    meta_json:
      meta,

    sort_order:
      sortOrder,

    is_published:
      formData.get("isPublished") === "on",

    updated_at:
      new Date().toISOString(),
  };
}


async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error(
      "관리자 권한이 필요합니다."
    );
  }
}


export async function POST(
  request: Request
) {
  try {
    await requireAdmin();

    const formData =
      await request.formData();

    const kind =
      clean(
        formData.get("kind")
      );

    if (kind === "series") {
      const payload =
        await seriesPayload(
          formData
        );

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "extra_hundred_days_series"
          )
          .insert(payload)
          .select("id, slug")
          .single();

      if (error || !data) {
        throw new Error(
          error?.message ??
          "시리즈 등록 실패"
        );
      }

      revalidatePath(
        "/extra/hundred-days"
      );

      return NextResponse.json({
        ok: true,
        id: data.id,
        slug: data.slug,
      });
    }


    if (kind === "item") {
      const payload =
        itemPayload(
          formData
        );

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "extra_hundred_days_items"
          )
          .insert(payload)
          .select("id")
          .single();

      if (error || !data) {
        throw new Error(
          error?.message ??
          "항목 등록 실패"
        );
      }

      const seriesSlug =
        clean(
          formData.get(
            "seriesSlug"
          )
        );

      revalidatePath(
        "/extra/hundred-days"
      );

      if (seriesSlug) {
        revalidatePath(
          "/extra/hundred-days/" +
          seriesSlug
        );
      }

      return NextResponse.json({
        ok: true,
        id: data.id,
        slug: seriesSlug,
      });
    }


    throw new Error(
      "잘못된 요청입니다."
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "저장 실패",
      },
      {
        status: 400,
      }
    );
  }
}


export async function PATCH(
  request: Request
) {
  try {
    await requireAdmin();

    const formData =
      await request.formData();

    const kind =
      clean(
        formData.get("kind")
      );

    const id =
      clean(
        formData.get("id")
      );

    if (!id) {
      throw new Error(
        "ID가 없습니다."
      );
    }


    if (kind === "series") {
      const payload =
        await seriesPayload(
          formData,
          id
        );

      const {
        error,
      } =
        await supabaseAdmin
          .from(
            "extra_hundred_days_series"
          )
          .update(payload)
          .eq("id", id);

      if (error) {
        throw new Error(
          error.message
        );
      }

      revalidatePath(
        "/extra/hundred-days"
      );

      revalidatePath(
        "/extra/hundred-days/" +
        payload.slug
      );

      return NextResponse.json({
        ok: true,
        id,
        slug:
          payload.slug,
      });
    }


    if (kind === "item") {
      const payload =
        itemPayload(
          formData
        );

      const {
        error,
      } =
        await supabaseAdmin
          .from(
            "extra_hundred_days_items"
          )
          .update(payload)
          .eq("id", id);

      if (error) {
        throw new Error(
          error.message
        );
      }

      const seriesSlug =
        clean(
          formData.get(
            "seriesSlug"
          )
        );

      revalidatePath(
        "/extra/hundred-days"
      );

      if (seriesSlug) {
        revalidatePath(
          "/extra/hundred-days/" +
          seriesSlug
        );
      }

      return NextResponse.json({
        ok: true,
        id,
        slug: seriesSlug,
      });
    }


    throw new Error(
      "잘못된 요청입니다."
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "수정 실패",
      },
      {
        status: 400,
      }
    );
  }
}


export async function DELETE(
  request: Request
) {
  try {
    await requireAdmin();

    const url =
      new URL(request.url);

    const kind =
      url.searchParams.get(
        "kind"
      ) ?? "";

    const id =
      url.searchParams.get(
        "id"
      ) ?? "";

    if (!id) {
      throw new Error(
        "ID가 없습니다."
      );
    }

    const table =
      kind === "series"
        ? "extra_hundred_days_series"
        : "extra_hundred_days_items";

    const {
      error,
    } =
      await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", id);

    if (error) {
      throw new Error(
        error.message
      );
    }

    revalidatePath(
      "/extra/hundred-days"
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "삭제 실패",
      },
      {
        status: 400,
      }
    );
  }
}
