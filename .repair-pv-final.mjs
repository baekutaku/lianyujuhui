import fs from "node:fs";
import path from "node:path";

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `.pv-final-repair-${stamp}`;

fs.mkdirSync(backup, { recursive: true });

for (const file of [
  "lib/extra/pv/relation-data.ts",
  "components/extra/pv/PvForm.tsx",
  "app/extra/pv/actions.ts",
  "app/extra/pv/page.tsx",
  "app/extra/pv/[slug]/page.tsx",
]) {
  if (!fs.existsSync(file)) continue;

  const target = path.join(backup, file);

  fs.mkdirSync(
    path.dirname(target),
    { recursive: true }
  );

  fs.copyFileSync(file, target);
}


/* =========================================================
   1. RELATION DATA
========================================================= */

write(
  "lib/extra/pv/relation-data.ts",
`import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import type {
  RelationCandidate,
} from "@/components/admin/relations/RelationPicker";


export type PvRelationPools = {
  cardCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  phoneCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialIllustrations?:
    RelationCandidate[];

  initialStories?:
    RelationCandidate[];

  initialPhoneItems?:
    RelationCandidate[];

  initialEvents?:
    RelationCandidate[];
};


export async function loadPvRelationCandidates():
  Promise<PvRelationPools> {

  const [
    { data: characters },
    { data: cards },
    { data: illustrations },
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
        .from("illustrations")
        .select(
          "id, title, image_url, release_year, release_date, primary_character_id"
        )
        .eq(
          "is_published",
          true
        )
        .order(
          "release_year",
          { ascending: false }
        )
        .order(
          "release_date",
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


  const illustrationCandidates:
    RelationCandidate[] =
      (illustrations ?? []).map(
        (item: any) => ({
          id: item.id,

          /* RelationPicker 검색용 */
          slug: item.id,

          title:
            item.title ||
            "제목 없음",

          characterKey:
            characterMap.get(
              item.primary_character_id
            ) ?? null,
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
    illustrationCandidates,
    storyCandidates,
    phoneCandidates,
    eventCandidates,
  };
}


export async function loadPvInitialRelations(
  pvId: string,
  pools: PvRelationPools
) {
  const {
    data,
    error,
  } =
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

    initialIllustrations:
      selected(
        "illustration",
        pools.illustrationCandidates
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
   2. PV FORM
========================================================= */

write(
  "components/extra/pv/PvForm.tsx",
`import PvImageFields
  from "@/components/extra/pv/PvImageFields";

import PvVideoFields, {
  type PvVideoItem,
} from "@/components/extra/pv/PvVideoFields";

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
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
];


const STORY_SUBTYPE_OPTIONS = [
  { value: "main_story", label: "메인스토리" },
  { value: "behind_story", label: "막후의 장" },
  { value: "card_story", label: "데이트" },
  { value: "side_story", label: "비밀이야기 / 외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈" },
  { value: "company_project", label: "촬영장 / 회사 프로젝트" },
];


const PHONE_SUBTYPE_OPTIONS = [
  { value: "message", label: "메시지" },
  { value: "moment", label: "모멘트" },
  { value: "call", label: "전화" },
  { value: "video_call", label: "영상통화" },
  { value: "article", label: "기사" },
];


type PvItem = {
  id?: string;

  title?: string;
  slug?: string;

  release_date?:
    string | null;

  character_keys?:
    string[] | null;

  videos?:
    PvVideoItem[] | null;

  image_urls?:
    string[] | null;

  original_text?:
    string | null;

  translation_text?:
    string | null;

  is_published?:
    boolean;
};


type RelationProps = {
  cardCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  phoneCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialIllustrations?:
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

  const selected =
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
                    selected.has(key)
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

          <p>
            순서상 첫 번째 영상이
            PV 목록 대표 썸네일 기준입니다.
          </p>

        </div>


        <PvVideoFields
          initialVideos={
            item?.videos ??
            []
          }
        />

      </section>


      <section className="form-section">

        <div className="section-heading">

          <h2>이미지</h2>

          <p>
            상세 페이지용 이미지입니다.
            목록 썸네일로는 사용하지 않습니다.
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
          CHARACTER_OPTIONS
        }
      />


      <RelationPicker
        label="연결 카드 외 일러스트"
        name="linkedIllustrationIds"
        candidates={
          relations.illustrationCandidates
        }
        initialSelected={
          relations.initialIllustrations ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
        serializeBy="id"
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
          CHARACTER_OPTIONS
        }
        subtypeOptions={
          STORY_SUBTYPE_OPTIONS
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
          CHARACTER_OPTIONS
        }
        subtypeOptions={
          PHONE_SUBTYPE_OPTIONS
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
          CHARACTER_OPTIONS
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
   3. ACTIONS
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
        .split(/\\r?\\n/)
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
    .map(
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
        /^https?:\\/\\//i
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
      /(?:youtu\\.be\\/|youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{6,})/
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
`
);


/* =========================================================
   4. PV LIST
   썸네일 = 첫 번째 영상
========================================================= */

write(
  "app/extra/pv/page.tsx",
`import Link
  from "next/link";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabase,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


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
      /(?:youtu\\.be\\/|youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ??
    "";
}


export default async function Page() {

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
      .select(
        \`
        id,
        title,
        slug,
        release_date,
        release_year,
        character_keys,
        videos,
        video_cn_url,
        video_kr_url,
        is_published,
        created_at
        \`
      )
      .order(
        "release_date",
        {
          ascending:
            false,
        }
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );


  if (!admin) {
    query =
      query.eq(
        "is_published",
        true
      );
  }


  const {
    data,
    error,
  } =
    await query;


  const items =
    data ?? [];


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
            프로모션 영상을
            정리합니다.
          </p>

        </div>


        <div className="extra-pv-head-actions">

          {admin ? (
            <Link
              href="/extra/pv/new"
              className="primary-button"
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

          <strong>
            등록된 PV가 없습니다.
          </strong>

        </section>
      ) : null}


      {items.length ? (
        <section className="extra-pv-grid">

          {items.map(
            (item: any) => {

              const videos =
                Array.isArray(
                  item.videos
                )
                  ? item.videos
                  : [];


              const firstVideo =
                videos[0] ??
                (
                  item.video_cn_url
                    ? {
                        server: "CN",
                        url:
                          item.video_cn_url,
                      }
                    : item.video_kr_url
                      ? {
                          server: "KR",
                          url:
                            item.video_kr_url,
                        }
                      : null
                );


              const firstUrl =
                String(
                  firstVideo
                    ?.url ??
                  ""
                );


              const yt =
                youtubeId(
                  firstUrl
                );


              /*
               * 갤러리 이미지 X
               * 첫 번째 PV 영상 썸네일만 사용
               */
              const thumb =
                String(
                  firstVideo
                    ?.thumbnail_url ??
                  ""
                ).trim() ||
                (
                  yt
                    ? "https://img.youtube.com/vi/" +
                      yt +
                      "/hqdefault.jpg"
                    : ""
                );


              const characters =
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
                  .join(" · ");


              return (
                <Link
                  key={item.id}
                  href={
                    "/extra/pv/" +
                    item.slug
                  }
                  className="extra-pv-card"
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

                    <span>
                      {[
                        item.release_date ||
                          item.release_year,

                        characters,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>

                  </div>

                </Link>
              );
            }
          )}

        </section>
      ) : null}

    </main>
  );
}
`
);


/* =========================================================
   5. DETAIL
========================================================= */

write(
  "app/extra/pv/[slug]/page.tsx",
`import Link
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
      /(?:youtu\\.be\\/|youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ??
    "";
}


function bilibiliId(
  url: string
) {
  const match =
    url.match(
      /\\b(BV[A-Za-z0-9]+)\\b/i
    );

  return match?.[1] ??
    "";
}


function isDirectVideo(
  url: string
) {
  return /\\.(mp4|webm|ogg)(?:$|[?#])/i
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
`
);


console.log("");
console.log("=== PV FINAL REPAIR COMPLETE ===");
console.log("[OK] 연결 카드 외 일러스트");
console.log("[OK] 연결 스토리 상세 표시");
console.log("[OK] 영상 여러 개");
console.log("[OK] 첫 영상 = 목록 썸네일");
console.log("[OK] 이미지 = 상세 갤러리 전용");
console.log("Backup:", backup);
