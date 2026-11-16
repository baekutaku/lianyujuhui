"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/utils/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

function clean(
  value: FormDataEntryValue | null
) {
  return String(value ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[^a-z0-9가-힣]+/g,
      "-"
    )
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function buildPayload(
  formData: FormData
) {
  const title =
    clean(formData.get("title"));

  if (!title) {
    throw new Error(
      "제목을 입력해 주세요."
    );
  }

  const releaseDate =
    clean(
      formData.get("releaseDate")
    );

  const rawSlug =
    clean(formData.get("slug"));

  const slug =
    rawSlug ||
    slugify(title) ||
    `pv-${Date.now()}`;

  const imageUrls =
    clean(
      formData.get("imageUrls")
    )
      .split(/\r?\n/)
      .map((value) =>
        value.trim()
      )
      .filter(Boolean);

  const characterKeys =
    formData
      .getAll("characterKeys")
      .map((value) =>
        String(value).trim()
      )
      .filter(Boolean);

  return {
    title,
    slug,

    release_date:
      releaseDate || null,

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
      characterKeys,

    video_cn_url:
      clean(
        formData.get(
          "videoCnUrl"
        )
      ) || null,

    video_kr_url:
      clean(
        formData.get(
          "videoKrUrl"
        )
      ) || null,

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

    image_urls:
      imageUrls,

    related_event_slug:
      clean(
        formData.get(
          "relatedEventSlug"
        )
      ) || null,

    is_published:
      formData.get(
        "isPublished"
      ) === "on",

    updated_at:
      new Date().toISOString(),
  };
}

export async function createExtraPv(
  formData: FormData
) {
  await requireAdmin();

  const data =
    buildPayload(formData);

  const { error } =
    await supabaseAdmin
      .from("extra_pv_items")
      .insert(data);

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

export async function updateExtraPv(
  formData: FormData
) {
  await requireAdmin();

  const id =
    clean(
      formData.get("id")
    );

  const oldSlug =
    clean(
      formData.get("oldSlug")
    );

  if (!id) {
    throw new Error(
      "PV id가 없습니다."
    );
  }

  const data =
    buildPayload(formData);

  const { error } =
    await supabaseAdmin
      .from("extra_pv_items")
      .update(data)
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath(
    "/extra/pv"
  );

  if (oldSlug) {
    revalidatePath(
      `/extra/pv/${oldSlug}`
    );
  }

  revalidatePath(
    `/extra/pv/${data.slug}`
  );

  redirect(
    `/extra/pv/${data.slug}`
  );
}

export async function deleteExtraPv(
  formData: FormData
) {
  await requireAdmin();

  const id =
    clean(
      formData.get("id")
    );

  if (!id) {
    throw new Error(
      "PV id가 없습니다."
    );
  }

  const { error } =
    await supabaseAdmin
      .from("extra_pv_items")
      .delete()
      .eq("id", id);

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
