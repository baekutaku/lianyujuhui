import fs from "node:fs";
import path from "node:path";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, src) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, src, "utf8");
}

function fail(message) {
  throw new Error(message);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupDir =
  `.extra-pv-register-backup-${stamp}`;

fs.mkdirSync(backupDir, {
  recursive: true,
});

const backupFiles = [
  "app/admin/stories/new/page.tsx",
  "app/admin/stories/[slug]/edit/page.tsx",
  "app/admin/actions.ts",
  "app/stories/page.tsx",
  "app/extra/pv/page.tsx",
  "app/globals.css",
];

for (const file of backupFiles) {
  if (!fs.existsSync(file)) continue;

  const dest =
    path.join(backupDir, file);

  fs.mkdirSync(
    path.dirname(dest),
    { recursive: true }
  );

  fs.copyFileSync(file, dest);
}


/* =========================================================
   1. PV 관리자 추가 이미지 / 일러스트 필드 복구
========================================================= */

const pvComponent =
  "components/admin/stories/StoryPvExtras.tsx";

const pvBackup =
  "components/admin/stories/StoryPvExtras.tsx.before-pv-resume-20261116-144005.bak";

if (!fs.existsSync(pvComponent)) {
  if (!fs.existsSync(pvBackup)) {
    fail(
      "StoryPvExtras 백업 파일을 찾지 못했습니다."
    );
  }

  fs.copyFileSync(
    pvBackup,
    pvComponent
  );

  console.log(
    "[RESTORED] StoryPvExtras"
  );
}


/* =========================================================
   2. 관리자 스토리 신규 / 수정
========================================================= */

function patchAdminStory(file, isEdit) {
  let src = read(file);

  const importLine =
    'import StoryPvExtras from "@/components/admin/stories/StoryPvExtras";';

  const importAnchor =
    'import StoryTranslationFields from "@/components/admin/stories/StoryTranslationFields";';

  if (!src.includes(importLine)) {
    if (!src.includes(importAnchor)) {
      fail(
        `${file}: StoryTranslationFields import를 못 찾음`
      );
    }

    src = src.replace(
      importAnchor,
      `${importAnchor}
${importLine}`
    );
  }

  if (
    !src.includes(
      'value: "promo_video"'
    )
  ) {
    const anchor =
      '{ value: "main_story", label: "메인스토리" },';

    if (!src.includes(anchor)) {
      fail(
        `${file}: main_story 옵션을 못 찾음`
      );
    }

    src = src.replace(
      anchor,
`${anchor}
  { value: "promo_video", label: "PV / 공식 영상" },`
    );
  }

  if (!isEdit) {
    src = src.replace(
      'defaultValue="card_story"',
      'defaultValue={returnSub === "promo_video" ? "promo_video" : "card_story"}'
    );
  }

  if (
    !src.includes(
      "<StoryPvExtras"
    )
  ) {
    const index =
      src.indexOf(
        "        <RelationPicker"
      );

    if (index < 0) {
      fail(
        `${file}: RelationPicker 위치를 못 찾음`
      );
    }

    const block =
      isEdit
        ? `        <StoryPvExtras storyId={story.id} />

`
        : `        <StoryPvExtras />

`;

    src =
      src.slice(0, index) +
      block +
      src.slice(index);
  }

  write(file, src);

  console.log(
    "[PATCHED]",
    file
  );
}

patchAdminStory(
  "app/admin/stories/new/page.tsx",
  false
);

patchAdminStory(
  "app/admin/stories/[slug]/edit/page.tsx",
  true
);


/* =========================================================
   3. 저장 후 /extra/pv 로 복귀
========================================================= */

const actionsFile =
  "app/admin/actions.ts";

let actions =
  read(actionsFile);

function patchActionRange(
  src,
  startMark,
  endMark
) {
  const start =
    src.indexOf(startMark);

  const end =
    src.indexOf(
      endMark,
      start + 1
    );

  if (
    start < 0 ||
    end < 0
  ) {
    fail(
      `actions 함수 범위를 못 찾음: ${startMark}`
    );
  }

  let block =
    src.slice(start, end);

  if (
    !block.includes(
      'revalidatePath("/extra/pv")'
    )
  ) {
    block =
      block.replace(
        '    revalidatePath("/stories");',
        `    revalidatePath("/stories");
    revalidatePath("/extra/pv");`
      );
  }

  return (
    src.slice(0, start) +
    block +
    src.slice(end)
  );
}

actions =
  patchActionRange(
    actions,
    "export async function createStoryBundle(formData: FormData) {",
    "export async function updateStoryBundle(formData: FormData) {"
  );

actions =
  patchActionRange(
    actions,
    "export async function updateStoryBundle(formData: FormData) {",
    "export async function deleteStoryBundle(formData: FormData) {"
  );


const createRedirect =
  '  redirect(`/stories/${safeSuccessSlug}${returnSuffix}`);';

if (
  actions.includes(createRedirect) &&
  !actions.includes(
    'redirect("/extra/pv");\n  }\n\n  redirect(`/stories/${safeSuccessSlug}'
  )
) {
  actions =
    actions.replace(
      createRedirect,
`  if (
    String(
      formData.get("subtype") || ""
    ).trim() === "promo_video"
  ) {
    redirect("/extra/pv");
  }

${createRedirect}`
    );
}


const updateRedirect =
  '  redirect(`/stories/${safeTargetSlug}${returnSuffix}`);';

if (
  actions.includes(updateRedirect) &&
  !actions.includes(
    'redirect("/extra/pv");\n  }\n\n  redirect(`/stories/${safeTargetSlug}'
  )
) {
  actions =
    actions.replace(
      updateRedirect,
`  if (
    String(
      formData.get("subtype") || ""
    ).trim() === "promo_video"
  ) {
    redirect("/extra/pv");
  }

${updateRedirect}`
    );
}

write(
  actionsFile,
  actions
);

console.log(
  "[PATCHED] actions"
);


/* =========================================================
   4. /stories 에서는 PV 완전히 숨김
========================================================= */

const storiesFile =
  "app/stories/page.tsx";

let stories =
  read(storiesFile);


/* 남아 있는 PV 버튼 제거 */

stories =
  stories.replace(
    /\s*\{\s*key:\s*"promo",\s*label:\s*"PV \/ 공식 영상",\s*href:\s*buildStoriesHref\(\{[\s\S]*?page:\s*1,\s*\}\),\s*\},/m,
    ""
  );


/* 전체 조회에서도 promo_video 제외 */

const allStart =
  stories.indexOf(
    "let allPublishedStoriesQuery = supabase"
  );

if (allStart >= 0) {
  const marker =
    '.eq("is_published", true);';

  const pos =
    stories.indexOf(
      marker,
      allStart
    );

  if (
    pos >= 0 &&
    !stories
      .slice(
        allStart,
        pos + 180
      )
      .includes(
        '.neq("subtype", "promo_video")'
      )
  ) {
    stories =
      stories.slice(0, pos) +
      `.eq("is_published", true)
    .neq("subtype", "promo_video");` +
      stories.slice(
        pos + marker.length
      );
  }
}


const queryStart =
  stories.indexOf(
    "let query = supabase"
  );

if (queryStart >= 0) {
  const marker =
    '.eq("is_published", true);';

  const pos =
    stories.indexOf(
      marker,
      queryStart
    );

  if (
    pos >= 0 &&
    !stories
      .slice(
        queryStart,
        pos + 180
      )
      .includes(
        '.neq("subtype", "promo_video")'
      )
  ) {
    stories =
      stories.slice(0, pos) +
      `.eq("is_published", true)
    .neq("subtype", "promo_video");` +
      stories.slice(
        pos + marker.length
      );
  }
}

write(
  storiesFile,
  stories
);

console.log(
  "[PATCHED] /stories PV 숨김"
);


/* =========================================================
   5. /extra/pv 실제 DB 목록
========================================================= */

write(
  "app/extra/pv/page.tsx",
`import Link from "next/link";
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
`
);


/* =========================================================
   6. CSS
========================================================= */

const cssFile =
  "app/globals.css";

let css =
  read(cssFile);

if (
  !css.includes(
    "EXTRA PV ARCHIVE - 2026-11-16"
  )
) {
  css += `

/* =========================================================
   EXTRA PV ARCHIVE - 2026-11-16
========================================================= */

.extra-pv-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.extra-pv-admin-button,
.extra-pv-edit-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  border:
    1px solid rgba(
      194,
      174,
      207,
      .42
    );

  border-radius: 10px;

  background:
    rgba(
      255,
      255,
      255,
      .5
    );

  color:
    rgba(
      84,
      68,
      92,
      .78
    );

  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.extra-pv-admin-button {
  min-height: 34px;
  padding: 0 12px;
}

.extra-pv-grid {
  display: grid;

  grid-template-columns:
    repeat(
      3,
      minmax(0, 1fr)
    );

  gap: 12px;
}

.extra-pv-card {
  position: relative;

  overflow: hidden;

  min-width: 0;

  border:
    1px solid rgba(
      194,
      182,
      201,
      .34
    );

  border-radius: 17px;

  background:
    rgba(
      255,
      255,
      255,
      .4
    );

  box-shadow:
    0 10px 30px
    rgba(
      83,
      66,
      91,
      .04
    );
}

.extra-pv-card-link {
  display: block;

  color: inherit;
  text-decoration: none;
}

.extra-pv-thumb {
  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  aspect-ratio: 16 / 9;

  background:
    rgba(
      233,
      229,
      237,
      .65
    );

  color:
    rgba(
      112,
      91,
      121,
      .35
    );
}

.extra-pv-thumb img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: cover;
}

.extra-pv-thumb
.material-symbols-rounded {
  font-size: 34px;
}

.extra-pv-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;

  padding:
    13px 14px 15px;
}

.extra-pv-card-body strong {
  color:
    rgba(
      67,
      53,
      73,
      .94
    );

  font-size: 14px;
  line-height: 1.45;
}

.extra-pv-card-body
> span:last-child {
  color:
    rgba(
      95,
      80,
      103,
      .54
    );

  font-size: 10px;
}

.extra-pv-edit-link {
  position: absolute;

  top: 9px;
  right: 9px;

  min-height: 28px;

  padding: 0 9px;

  background:
    rgba(
      255,
      255,
      255,
      .86
    );

  backdrop-filter:
    blur(8px);
}

.story-pv-admin-panel {
  margin-top: 18px;
}

@media (
  max-width: 900px
) {

  .extra-pv-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

}

@media (
  max-width: 620px
) {

  .extra-pv-head-actions {
    width: 100%;

    justify-content:
      space-between;
  }

  .extra-pv-grid {
    grid-template-columns:
      1fr;
  }

}
`;
}

write(
  cssFile,
  css
);


console.log("");
console.log(
  "=== EXTRA PV REGISTER COMPLETE ==="
);

console.log(
  "[OK] 스토리 등록에 PV / 공식 영상 복구"
);

console.log(
  "[OK] 추가 이미지 복구"
);

console.log(
  "[OK] 연결 일러스트 복구"
);

console.log(
  "[OK] /stories 목록에서는 PV 숨김"
);

console.log(
  "[OK] /extra/pv 실제 DB 연결"
);

console.log(
  "[OK] PV 등록 후 /extra/pv 복귀"
);

console.log(
  "Backup:",
  backupDir
);
