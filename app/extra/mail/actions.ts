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

  const mailDate =
    clean(
      formData.get(
        "mailDate"
      )
    );

  const originalText =
    clean(
      formData.get(
        "originalText"
      )
    );


  if (
    !characterKey ||
    !title ||
    !mailDate ||
    !originalText
  ) {
    throw new Error(
      "캐릭터, 날짜, 제목, 원문은 필수입니다."
    );
  }


  return {
    character_key:
      characterKey,

    title,

    mail_date:
      mailDate,

    original_text:
      originalText,

    translation_text:
      clean(
        formData.get(
          "translationText"
        )
      ) || null,

    occasion:
      clean(
        formData.get(
          "occasion"
        )
      ) || null,

    image_url:
      clean(
        formData.get(
          "imageUrl"
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
  mailId,
  type,
  slugs,
}: {
  mailId: string;

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
        "extra_mail_relations"
      )
      .delete()
      .eq(
        "mail_id",
        mailId
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
          mail_id:
            mailId,

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
        "extra_mail_relations"
      )
      .insert(rows);


  if (insertError) {
    throw new Error(
      insertError.message
    );
  }
}


async function syncIllustrations(
  mailId: string,
  ids: string[]
) {
  const {
    error: deleteError,
  } =
    await supabaseAdmin
      .from(
        "extra_mail_relations"
      )
      .delete()
      .eq(
        "mail_id",
        mailId
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
          mail_id:
            mailId,

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
        "extra_mail_relations"
      )
      .insert(rows);


  if (insertError) {
    throw new Error(
      insertError.message
    );
  }
}


async function syncAllRelations(
  mailId: string,
  formData: FormData
) {
  await syncSlugRelations({
    mailId,
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
    mailId,
    parseLines(
      formData.get(
        "linkedIllustrationIds"
      )
    )
  );


  await syncSlugRelations({
    mailId,
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
    mailId,
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


export async function createExtraMail(
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
        "extra_mail_items"
      )
      .insert(payload)
      .select(
        "id"
      )
      .single();


  if (
    error ||
    !data
  ) {
    throw new Error(
      error?.message ??
      "우편 등록 실패"
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
        "extra_mail_items"
      )
      .delete()
      .eq(
        "id",
        data.id
      );

    throw error;
  }


  revalidatePath(
    "/extra/mail"
  );


  redirect(
    "/extra/mail"
  );
}


export async function updateExtraMail(
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
      "우편 ID가 없습니다."
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
        "extra_mail_items"
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
    "/extra/mail"
  );


  redirect(
    "/extra/mail"
  );
}


export async function deleteExtraMail(
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
      "우편 ID가 없습니다."
    );
  }


  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "extra_mail_items"
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
    "/extra/mail"
  );


  redirect(
    "/extra/mail"
  );
}

