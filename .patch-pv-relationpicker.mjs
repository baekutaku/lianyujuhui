import fs from "node:fs";
import path from "node:path";

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `.pv-relations-backup-${stamp}`;

fs.mkdirSync(backup, { recursive: true });

for (const file of [
  "app/extra/pv/actions.ts",
  "app/extra/pv/new/page.tsx",
  "app/extra/pv/[slug]/edit/page.tsx",
  "components/extra/pv/PvForm.tsx",
]) {
  if (!fs.existsSync(file)) continue;

  const target = path.join(backup, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

/* =========================================================
   1. PV 전용 relation table
========================================================= */

write(
  "supabase/migrations/20261116075000_extra_pv_relations.sql",
`create table if not exists public.extra_pv_relations (
  id uuid primary key default gen_random_uuid(),

  pv_id uuid not null
    references public.extra_pv_items(id)
    on delete cascade,

  target_type text not null
    check (
      target_type in (
        'card',
        'story',
        'phone_item',
        'event'
      )
    ),

  target_id uuid not null,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  unique (
    pv_id,
    target_type,
    target_id
  )
);

create index if not exists
  extra_pv_relations_pv_idx
  on public.extra_pv_relations (
    pv_id,
    target_type,
    sort_order
  );

alter table public.extra_pv_relations
  enable row level security;

drop policy if exists
  "extra pv relations public read"
  on public.extra_pv_relations;

create policy
  "extra pv relations public read"
  on public.extra_pv_relations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.extra_pv_items pv
      where pv.id = pv_id
        and pv.is_published = true
    )
  );
`
);


/* =========================================================
   2. Relation candidate loader
========================================================= */

write(
  "lib/extra/pv/relation-data.ts",
`import { supabaseAdmin } from "@/lib/supabase/admin";

import type {
  RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

export type PvRelationPools = {
  cardCandidates: RelationCandidate[];
  storyCandidates: RelationCandidate[];
  phoneCandidates: RelationCandidate[];
  eventCandidates: RelationCandidate[];

  initialCards?: RelationCandidate[];
  initialStories?: RelationCandidate[];
  initialPhoneItems?: RelationCandidate[];
  initialEvents?: RelationCandidate[];
};

export async function loadPvRelationCandidates():
  Promise<PvRelationPools> {

  const [
    { data: characters },
    { data: cards },
    { data: stories },
    { data: phoneItems },
    { data: events },
  ] =
    await Promise.all([
      supabaseAdmin
        .from("characters")
        .select(
          "id, key"
        ),

      supabaseAdmin
        .from("cards")
        .select(
          "id, title, slug, primary_character_id, card_category"
        )
        .order(
          "release_year",
          { ascending: false }
        ),

      supabaseAdmin
        .from("stories")
        .select(
          "id, title, slug, subtype, primary_character_id"
        )
        .order(
          "release_year",
          { ascending: false }
        ),

      supabaseAdmin
        .from("phone_items")
        .select(
          "id, title, slug, subtype, content_json"
        )
        .order(
          "release_year",
          { ascending: false }
        ),

      supabaseAdmin
        .from("events")
        .select(
          "id, title, slug, subtype, primary_character_id"
        )
        .order(
          "release_year",
          { ascending: false }
        ),
    ]);

  const characterMap =
    new Map(
      (characters ?? []).map(
        (item: any) => [
          item.id,
          item.key,
        ]
      )
    );

  const cardCandidates:
    RelationCandidate[] =
      (cards ?? []).map(
        (item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,

          characterKey:
            characterMap.get(
              item.primary_character_id
            ) ?? null,

          category:
            item.card_category ??
            null,
        })
      );

  const storyCandidates:
    RelationCandidate[] =
      (stories ?? []).map(
        (item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,

          subtype:
            item.subtype ??
            null,

          characterKey:
            characterMap.get(
              item.primary_character_id
            ) ?? null,
        })
      );

  const phoneCandidates:
    RelationCandidate[] =
      (phoneItems ?? []).map(
        (item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,

          subtype:
            item.subtype ??
            null,

          characterKey:
            item.content_json
              ?.characterKey ??
            null,

          category:
            item.content_json
              ?.historyCategory ??
            item.content_json
              ?.momentCategory ??
            null,
        })
      );

  const eventCandidates:
    RelationCandidate[] =
      (events ?? []).map(
        (item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,

          subtype:
            item.subtype ??
            null,

          characterKey:
            characterMap.get(
              item.primary_character_id
            ) ?? null,
        })
      );

  return {
    cardCandidates,
    storyCandidates,
    phoneCandidates,
    eventCandidates,
  };
}


export async function loadPvInitialRelations(
  pvId: string,
  pools: PvRelationPools
) {
  const { data, error } =
    await supabaseAdmin
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
        { ascending: true }
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const rows =
    data ?? [];

  function selected(
    type: string,
    candidates:
      RelationCandidate[]
  ) {
    const map =
      new Map(
        candidates.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    return rows
      .filter(
        (row: any) =>
          row.target_type ===
          type
      )
      .map(
        (row: any) =>
          map.get(
            row.target_id
          )
      )
      .filter(
        Boolean
      ) as RelationCandidate[];
  }

  return {
    initialCards:
      selected(
        "card",
        pools.cardCandidates
      ),

    initialStories:
      selected(
        "story",
        pools.storyCandidates
      ),

    initialPhoneItems:
      selected(
        "phone_item",
        pools.phoneCandidates
      ),

    initialEvents:
      selected(
        "event",
        pools.eventCandidates
      ),
  };
}
`
);


/* =========================================================
   3. PvForm
   단일 관련 이벤트 select 삭제
   RelationPicker 4개 추가
========================================================= */

write(
  "components/extra/pv/PvForm.tsx",
`import PvImageFields
  from "@/components/extra/pv/PvImageFields";

import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";


const CHARACTERS = [
  ["baiqi", "백기"],
  ["lizeyan", "이택언"],
  ["zhouqiluo", "주기락"],
  ["xumo", "허묵"],
  ["lingxiao", "연시호"],
] as const;


const CHARACTER_OPTIONS = [
  {
    value: "baiqi",
    label: "백기",
  },
  {
    value: "lizeyan",
    label: "이택언",
  },
  {
    value: "zhouqiluo",
    label: "주기락",
  },
  {
    value: "xumo",
    label: "허묵",
  },
  {
    value: "lingxiao",
    label: "연시호",
  },
] as const;


const CARD_CATEGORY_OPTIONS = [
  {
    value: "date",
    label: "데이트 연계",
  },
  {
    value: "main_story",
    label: "메인스토리 연계",
  },
  {
    value: "side_story",
    label: "비밀이야기 / 외전 연계",
  },
  {
    value: "birthday",
    label: "생일",
  },
  {
    value: "anniversary",
    label: "주년",
  },
  {
    value: "event",
    label: "이벤트",
  },
  {
    value: "charge",
    label: "누적충전 카드",
  },
  {
    value: "free",
    label: "무료 카드",
  },
] as const;


const STORY_SUBTYPE_OPTIONS = [
  {
    value: "main_story",
    label: "메인스토리",
  },
  {
    value: "behind_story",
    label: "막후의 장",
  },
  {
    value: "card_story",
    label: "데이트",
  },
  {
    value: "side_story",
    label: "비밀이야기 / 외전",
  },
  {
    value: "asmr",
    label: "너의 곁에",
  },
  {
    value: "xiyue_story",
    label: "서월국",
  },
  {
    value: "myhome_story",
    label: "마이홈",
  },
  {
    value: "company_project",
    label: "촬영장 / 회사 프로젝트",
  },
] as const;


const PHONE_SUBTYPE_OPTIONS = [
  {
    value: "message",
    label: "메시지",
  },
  {
    value: "moment",
    label: "모멘트",
  },
  {
    value: "call",
    label: "전화",
  },
  {
    value: "video_call",
    label: "영상통화",
  },
  {
    value: "article",
    label: "기사",
  },
] as const;


const PHONE_CATEGORY_OPTIONS = [
  {
    value: "daily",
    label: "일상",
  },
  {
    value: "companion",
    label: "동반",
  },
  {
    value: "card_story",
    label: "카드",
  },
  {
    value: "main_story",
    label: "메인스토리",
  },
  {
    value: "tangle",
    label: "얽힘",
  },
] as const;


type PvItem = {
  id?: string;

  title?: string;
  slug?: string;

  release_date?:
    string | null;

  character_keys?:
    string[] | null;

  video_cn_url?:
    string | null;

  video_kr_url?:
    string | null;

  original_text?:
    string | null;

  translation_text?:
    string | null;

  image_urls?:
    string[] | null;

  is_published?:
    boolean;
};


type RelationProps = {
  cardCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  phoneCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialStories?:
    RelationCandidate[];

  initialPhoneItems?:
    RelationCandidate[];

  initialEvents?:
    RelationCandidate[];
};


export default function PvForm({
  action,
  item,
  relations,
}: {
  action:
    (
      formData: FormData
    ) =>
      void |
      Promise<void>;

  item?: PvItem;

  relations:
    RelationProps;
}) {

  const selectedCharacters =
    new Set(
      item?.character_keys ??
      []
    );

  return (
    <form
      action={action}
      className="extra-pv-form"
    >

      {item?.id ? (
        <>
          <input
            type="hidden"
            name="id"
            value={item.id}
          />

          <input
            type="hidden"
            name="oldSlug"
            value={
              item.slug ?? ""
            }
          />
        </>
      ) : null}


      <section className="form-section">

        <div className="section-heading">
          <h2>
            PV 기본 정보
          </h2>

          <p>
            PV / 공식 영상
            전용 정보입니다.
          </p>
        </div>


        <div className="form-grid">

          <label className="field full">
            <span>제목</span>

            <input
              name="title"
              required
              defaultValue={
                item?.title ??
                ""
              }
            />
          </label>


          <label className="field">

            <span>슬러그</span>

            <input
              name="slug"
              defaultValue={
                item?.slug ??
                ""
              }
              placeholder="비우면 제목으로 자동 생성"
            />

          </label>


          <label className="field">

            <span>출시일</span>

            <input
              type="date"
              name="releaseDate"
              defaultValue={
                item?.release_date ??
                ""
              }
            />

          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>캐릭터</h2>

          <p>
            여러 명 선택 가능
          </p>
        </div>

        <div className="extra-pv-character-checks">

          {CHARACTERS.map(
            ([key, label]) => (

              <label key={key}>

                <input
                  type="checkbox"
                  name="characterKeys"
                  value={key}
                  defaultChecked={
                    selectedCharacters
                      .has(key)
                  }
                />

                <span>
                  {label}
                </span>

              </label>
            )
          )}

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>영상</h2>
        </div>

        <div className="form-grid">

          <label className="field full">

            <span>
              중국 서버 영상 URL
            </span>

            <input
              name="videoCnUrl"
              defaultValue={
                item?.video_cn_url ??
                ""
              }
              placeholder="YouTube / Bilibili 등"
            />

          </label>


          <label className="field full">

            <span>
              한국 서버 영상 URL
            </span>

            <input
              name="videoKrUrl"
              defaultValue={
                item?.video_kr_url ??
                ""
              }
            />

          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">

          <h2>이미지</h2>

          <p>
            여러 장 업로드 가능
          </p>

        </div>

        <PvImageFields
          initialUrls={
            item?.image_urls ??
            []
          }
        />

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>원문 · 번역</h2>
        </div>

        <div className="form-grid">

          <label className="field full">

            <span>원문</span>

            <textarea
              name="originalText"
              rows={10}
              defaultValue={
                item?.original_text ??
                ""
              }
            />

          </label>


          <label className="field full">

            <span>번역</span>

            <textarea
              name="translationText"
              rows={10}
              defaultValue={
                item?.translation_text ??
                ""
              }
            />

          </label>

        </div>

      </section>


      <RelationPicker
        label="연결 카드"
        name="linkedCardSlugs"
        candidates={
          relations.cardCandidates
        }
        initialSelected={
          relations.initialCards ??
          []
        }
        characterOptions={
          [...CHARACTER_OPTIONS]
        }
        categoryOptions={
          [...CARD_CATEGORY_OPTIONS]
        }
      />


      <RelationPicker
        label="연결 스토리"
        name="linkedStorySlugs"
        candidates={
          relations.storyCandidates
        }
        initialSelected={
          relations.initialStories ??
          []
        }
        characterOptions={
          [...CHARACTER_OPTIONS]
        }
        subtypeOptions={
          [...STORY_SUBTYPE_OPTIONS]
        }
      />


      <RelationPicker
        label="연결 휴대폰"
        name="linkedPhoneItemSlugs"
        candidates={
          relations.phoneCandidates
        }
        initialSelected={
          relations.initialPhoneItems ??
          []
        }
        characterOptions={
          [...CHARACTER_OPTIONS]
        }
        categoryOptions={
          [...PHONE_CATEGORY_OPTIONS]
        }
        subtypeOptions={
          [...PHONE_SUBTYPE_OPTIONS]
        }
      />


      <RelationPicker
        label="연결 이벤트"
        name="linkedEventSlugs"
        candidates={
          relations.eventCandidates
        }
        initialSelected={
          relations.initialEvents ??
          []
        }
        characterOptions={
          [...CHARACTER_OPTIONS]
        }
      />


      <label className="extra-pv-publish">

        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        <span>공개</span>

      </label>


      <div className="extra-pv-form-actions">

        <button
          type="submit"
          className="primary-button"
        >
          {
            item?.id
              ? "수정 저장"
              : "PV 등록"
          }
        </button>

      </div>

    </form>
  );
}
`
);


/* =========================================================
   4. actions
========================================================= */

write(
  "app/extra/pv/actions.ts",
`"use server";

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
        .split(/\\r?\\n/)
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}


function getTargetTable(
  type: string
) {
  if (type === "card")
    return "cards";

  if (type === "story")
    return "stories";

  if (type === "phone_item")
    return "phone_items";

  if (type === "event")
    return "events";

  throw new Error(
    \`지원하지 않는 relation type: \${type}\`
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

  const { error: deleteError } =
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


  const map =
    new Map(
      (targets ?? []).map(
        (item: any) => [
          item.slug,
          item.id,
        ]
      )
    );


  const missing =
    slugs.filter(
      (slug) =>
        !map.has(slug)
    );


  if (missing.length) {
    throw new Error(
      \`\${targetType} 연결 항목을 찾지 못했습니다:\\n\${missing.join("\\n")}\`
    );
  }


  const rows =
    slugs.map(
      (slug, index) => ({
        pv_id: pvId,

        target_type:
          targetType,

        target_id:
          map.get(slug),

        sort_order:
          index,
      })
    );


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
    targetType: "card",

    slugs:
      parseLines(
        formData.get(
          "linkedCardSlugs"
        )
      ),
  });


  await syncPvRelations({
    pvId,
    targetType: "story",

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
    targetType: "event",

    slugs:
      parseLines(
        formData.get(
          "linkedEventSlugs"
        )
      ),
  });
}


function buildPayload(
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
    \`pv-\${Date.now()}\`;


  const imageUrls =
    parseLines(
      formData.get(
        "imageUrls"
      )
    );


  const characterKeys =
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
      .filter(Boolean);


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

    /* 예전 단일 이벤트 필드 폐기 */
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
    buildPayload(
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


  if (error || !inserted) {
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
    \`/extra/pv/\${inserted.slug}\`
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
    buildPayload(
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
      \`/extra/pv/\${oldSlug}\`
    );
  }


  revalidatePath(
    \`/extra/pv/\${payload.slug}\`
  );


  redirect(
    \`/extra/pv/\${payload.slug}\`
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
`
);


/* =========================================================
   5. 신규 등록 page
========================================================= */

write(
  "app/extra/pv/new/page.tsx",
`import Link
  from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import PvForm
  from "@/components/extra/pv/PvForm";

import {
  createExtraPv,
} from "@/app/extra/pv/actions";

import {
  loadPvRelationCandidates,
} from "@/lib/extra/pv/relation-data";


export default async function Page() {

  const admin =
    await isAdmin();


  if (!admin) {
    redirect(
      "/admin/login"
    );
  }


  const relations =
    await loadPvRelationCandidates();


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV / NEW
          </p>

          <h1 className="extra-title">
            PV / 공식 영상 등록
          </h1>

          <p className="extra-description">
            PV 전용 등록 화면입니다.
          </p>

        </div>


        <Link
          href="/extra/pv"
          className="extra-back-link"
        >
          ← PV 목록
        </Link>

      </header>


      <PvForm
        action={
          createExtraPv
        }
        relations={
          relations
        }
      />

    </main>
  );
}
`
);


/* =========================================================
   6. 수정 page
========================================================= */

write(
  "app/extra/pv/[slug]/edit/page.tsx",
`import Link
  from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import PvForm
  from "@/components/extra/pv/PvForm";

import {
  deleteExtraPv,
  updateExtraPv,
} from "@/app/extra/pv/actions";

import {
  loadPvInitialRelations,
  loadPvRelationCandidates,
} from "@/lib/extra/pv/relation-data";


export default async function Page({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {

  const admin =
    await isAdmin();


  if (!admin) {
    redirect(
      "/admin/login"
    );
  }


  const { slug } =
    await params;


  const { data: item } =
    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .select("*")
      .eq(
        "slug",
        slug
      )
      .maybeSingle();


  if (!item) {
    notFound();
  }


  const pools =
    await loadPvRelationCandidates();


  const initial =
    await loadPvInitialRelations(
      item.id,
      pools
    );


  const relations = {
    ...pools,
    ...initial,
  };


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV / EDIT
          </p>

          <h1 className="extra-title">
            PV 수정
          </h1>

        </div>


        <Link
          href={
            \`/extra/pv/\${item.slug}\`
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <PvForm
        action={
          updateExtraPv
        }
        item={item}
        relations={
          relations
        }
      />


      <form
        action={
          deleteExtraPv
        }
        className="extra-pv-delete-form"
      >

        <input
          type="hidden"
          name="id"
          value={item.id}
        />

        <button
          type="submit"
          className="nav-link"
        >
          PV 삭제
        </button>

      </form>

    </main>
  );
}
`
);


console.log("");
console.log("=== PV RELATION PICKER PATCH COMPLETE ===");

console.log("[OK] 단일 관련 이벤트 select 제거");
console.log("[OK] 연결 카드 RelationPicker");
console.log("[OK] 연결 스토리 RelationPicker");
console.log("[OK] 연결 휴대폰 RelationPicker");
console.log("[OK] 연결 이벤트 RelationPicker");
console.log("[OK] 관계 순서 저장");
console.log("[OK] 수정 시 기존 관계 복원");
console.log("Backup:", backup);
