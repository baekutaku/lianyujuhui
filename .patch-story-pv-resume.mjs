import fs from "node:fs";

function read(file) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function write(file, src) {
  fs.writeFileSync(file, src, "utf8");
}

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   ACTIONS
========================================================= */

const actionsFile = "app/admin/actions.ts";
let actions = read(actionsFile);

/* promo_video 허용 */
if (!actions.includes('"promo_video"')) {
  const allowedRegex =
    /(const\s+ALLOWED_STORY_SUBTYPES[\s\S]*?new\s+Set(?:<[^>]+>)?\s*\(\s*\[)([\s\S]*?)(\]\s*\)\s*;)/;

  const match = actions.match(allowedRegex);

  if (!match) {
    fail("ALLOWED_STORY_SUBTYPES를 찾지 못했습니다.");
  }

  actions = actions.replace(
    allowedRegex,
    `${match[1]}${match[2].trimEnd()}
  "promo_video",
${match[3]}`
  );

  console.log("[PATCHED] promo_video 허용");
} else {
  console.log("[SKIP] promo_video 이미 허용됨");
}

/* gallery / illustration helper */
if (
  !actions.includes(
    "async function syncStoryGalleryImages("
  )
) {
  const parseRegex =
    /function\s+parseSlugLines\s*\([^)]*\)\s*\{[\s\S]*?\n\}/;

  const match = actions.match(parseRegex);

  if (!match) {
    fail("parseSlugLines를 찾지 못했습니다.");
  }

  const helpers = `${match[0]}

function parseStoryMultiValues(
  value: FormDataEntryValue | null
) {
  const raw = String(value ?? "").trim();

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed
            .map((item) =>
              String(item ?? "").trim()
            )
            .filter(Boolean)
        )
      );
    }
  } catch {}

  return Array.from(
    new Set(
      raw
        .split(/[\\r\\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

async function syncStoryGalleryImages(
  storyId: string,
  title: string,
  urls: string[]
) {
  const cleanUrls = Array.from(
    new Set(
      urls
        .map((url) => url.trim())
        .filter(Boolean)
    )
  );

  const { error: deleteError } =
    await supabase
      .from("media_assets")
      .delete()
      .eq("parent_type", "story")
      .eq("parent_id", storyId)
      .eq("media_type", "image")
      .eq("usage_type", "story_gallery");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (cleanUrls.length === 0) return;

  const { error } = await supabase
    .from("media_assets")
    .insert(
      cleanUrls.map((url, index) => ({
        parent_type: "story",
        parent_id: storyId,
        media_type: "image",
        usage_type: "story_gallery",
        url,
        title: \`\${title} 이미지 \${index + 1}\`,
        is_primary: false,
        sort_order: 20 + index,
      }))
    );

  if (error) {
    throw new Error(error.message);
  }
}

async function syncStoryIllustrationRelations(
  storyId: string,
  illustrationIds: string[]
) {
  const ids = Array.from(
    new Set(
      illustrationIds
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );

  const { error: deleteError } =
    await supabase
      .from("item_relations")
      .delete()
      .eq("parent_type", "story")
      .eq("parent_id", storyId)
      .eq("child_type", "illustration")
      .eq(
        "relation_type",
        "story_illustration"
      );

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (ids.length === 0) return;

  const { data: validRows, error: lookupError } =
    await supabase
      .from("illustrations")
      .select("id")
      .in("id", ids);

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const validIds = new Set(
    (validRows ?? []).map(
      (row) => row.id
    )
  );

  const rows = ids
    .filter((id) => validIds.has(id))
    .map((id, index) => ({
      parent_type: "story",
      parent_id: storyId,
      child_type: "illustration",
      child_id: id,
      relation_type:
        "story_illustration",
      sort_order: index + 1,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("item_relations")
    .insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}`;

  actions = actions.replace(
    match[0],
    helpers
  );

  console.log(
    "[PATCHED] gallery / illustration helpers"
  );
}

/* 실제 live 함수 범위 찾기 */
function getLiveRange(
  src,
  functionName,
  nextFunctionName
) {
  const startRegex = new RegExp(
    `^export\\\\s+async\\\\s+function\\\\s+${functionName}\\\\s*\\\\(\\\\s*formData\\\\s*:\\\\s*FormData\\\\s*\\\\)\\\\s*\\\\{`,
    "m"
  );

  const startMatch =
    startRegex.exec(src);

  if (!startMatch) {
    fail(
      `live ${functionName} 함수를 찾지 못했습니다.`
    );
  }

  const nextRegex = new RegExp(
    `^export\\\\s+async\\\\s+function\\\\s+${nextFunctionName}\\\\b`,
    "m"
  );

  const after =
    src.slice(
      startMatch.index +
        startMatch[0].length
    );

  const nextMatch =
    nextRegex.exec(after);

  if (!nextMatch) {
    fail(
      `${nextFunctionName} 경계를 찾지 못했습니다.`
    );
  }

  const start = startMatch.index;
  const end =
    startMatch.index +
    startMatch[0].length +
    nextMatch.index;

  return { start, end };
}

function patchActionBlock(
  src,
  functionName,
  nextFunctionName,
  storyIdExpression
) {
  const { start, end } =
    getLiveRange(
      src,
      functionName,
      nextFunctionName
    );

  let block = src.slice(start, end);

  if (
    !block.includes(
      'formData.get("storyGalleryImageUrls")'
    )
  ) {
    const coverRegex =
      /(\s*const\s+coverImageUrl\s*=\s*String\(\s*formData\.get\("coverImageUrl"\)\s*\|\|\s*""\s*\)\.trim\(\)\s*;)/;

    if (!coverRegex.test(block)) {
      fail(
        `${functionName}: coverImageUrl 선언을 찾지 못했습니다.`
      );
    }

    block = block.replace(
      coverRegex,
`$1

    const storyGalleryImageUrls =
      parseStoryMultiValues(
        formData.get(
          "storyGalleryImageUrls"
        )
      );

    const linkedIllustrationIds =
      parseStoryMultiValues(
        formData.get(
          "linkedIllustrationIds"
        )
      );`
    );
  }

  if (
    !block.includes(
      "syncStoryGalleryImages("
    )
  ) {
    const relationIndex =
      block.indexOf(
        "await syncStoryStoryRelationsBySlugs("
      );

    if (relationIndex < 0) {
      fail(
        `${functionName}: story_story relation 위치를 찾지 못했습니다.`
      );
    }

    const syncCode =
`await syncStoryGalleryImages(
      ${storyIdExpression},
      title,
      storyGalleryImageUrls
    );

    await syncStoryIllustrationRelations(
      ${storyIdExpression},
      linkedIllustrationIds
    );

    `;

    block =
      block.slice(0, relationIndex) +
      syncCode +
      block.slice(relationIndex);
  }

  console.log(
    `[PATCHED] ${functionName}`
  );

  return (
    src.slice(0, start) +
    block +
    src.slice(end)
  );
}

actions = patchActionBlock(
  actions,
  "createStoryBundle",
  "updateStoryBundle",
  "insertedStory.id"
);

actions = patchActionBlock(
  actions,
  "updateStoryBundle",
  "deleteStoryBundle",
  "storyId"
);

write(actionsFile, actions);

console.log(
  "[OK] app/admin/actions.ts 완료"
);

/* =========================================================
   STORIES LIST
========================================================= */

const listFile = "app/stories/page.tsx";
let list = read(listFile);

function patchStoryTabConstant(
  src,
  includeDescription
) {
  const start =
    src.indexOf(
      "const STORY_TAB_OPTIONS"
    );

  if (start < 0) {
    fail("STORY_TAB_OPTIONS 없음");
  }

  const end =
    src.indexOf(
      "] as const;",
      start
    );

  if (end < 0) {
    fail(
      "STORY_TAB_OPTIONS 끝 없음"
    );
  }

  let block =
    src.slice(start, end);

  if (
    !block.includes(
      'key: "promo"'
    )
  ) {
    const eventPos =
      block.indexOf(
        '    key: "event"'
      );

    const objectStart =
      block.lastIndexOf(
        "  {",
        eventPos
      );

    if (
      eventPos < 0 ||
      objectStart < 0
    ) {
      fail(
        "STORY_TAB_OPTIONS event 위치 없음"
      );
    }

    const promo = includeDescription
      ? `  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
    desc: "공식 PV, 티저, 프로모션 영상과 관련 이미지",
  },
`
      : `  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
  },
`;

    block =
      block.slice(0, objectStart) +
      promo +
      block.slice(objectStart);
  }

  return (
    src.slice(0, start) +
    block +
    src.slice(end)
  );
}

list =
  patchStoryTabConstant(
    list,
    true
  );

if (
  !list.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  list = list.replace(
    /(\s+main_story:\s*"메인스토리",)/,
    `$1
  promo_video: "PV / 공식 영상",`
  );
}

list = list.replaceAll(
  'primaryKeys={["all", "main", "card"]}',
  'primaryKeys={["all", "main", "card", "promo"]}'
);

/* 수동 카테고리 배열들에도 PV 추가 */
const eventNavRegex =
  /(\s{4}\{\n\s+key:\s*"event",\n\s+label:\s*"이벤트 \/ 기념일",\n\s+href:\s*buildStoriesHref\(\{[\s\S]*?\n\s+\}\),\n\s+\},)/g;

list = list.replace(
  eventNavRegex,
  (match, _whole, offset) => {
    const before =
      list.slice(
        Math.max(0, offset - 500),
        offset
      );

    if (
      before.includes(
        'key: "promo"'
      )
    ) {
      return match;
    }

    return `    {
      key: "promo",
      label: "PV / 공식 영상",
      href: buildStoriesHref({
        tab: "promo",
        q,
        years: selectedYears,
        characters:
          selectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
${match}`;
  }
);

write(listFile, list);

console.log(
  "[PATCHED] stories 목록 PV 탭"
);

/* =========================================================
   STORY DETAIL
========================================================= */

const detailFile =
  "app/stories/[slug]/page.tsx";

let detail = read(detailFile);

const linkedImport =
`import StoryLinkedIllustrationGallery from "@/components/story/StoryLinkedIllustrationGallery";`;

if (!detail.includes(linkedImport)) {
  detail = detail.replace(
    `import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";`,
    `import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";
${linkedImport}`
  );
}

detail =
  patchStoryTabConstant(
    detail,
    false
  );

if (
  !detail.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  detail = detail.replace(
    /(\s+main_story:\s*"메인스토리",)/,
    `$1
  promo_video: "PV / 공식 영상",`
  );
}

if (
  !detail.includes(
    "<StoryLinkedIllustrationGallery"
  )
) {
  const mediaAnchor =
`<StoryMediaSwitcher storyTitle={story.title} media={media ?? []} />`;

  if (!detail.includes(mediaAnchor)) {
    fail(
      "스토리 상세 media switcher 위치 없음"
    );
  }

  detail = detail.replace(
    mediaAnchor,
`${mediaAnchor}
  <StoryLinkedIllustrationGallery
    storyId={story.id}
  />`
  );
}

write(detailFile, detail);

console.log(
  "[PATCHED] story detail PV"
);

/* =========================================================
   MEDIA SWITCHER
========================================================= */

const switcherFile =
  "components/story/StoryMediaSwitcher.tsx";

let sw = read(switcherFile);

if (
  !sw.includes(
    "const galleryImages ="
  )
) {
  const fallbackRegex =
    /(  const fallbackMedia =[\s\S]*?\n    null;)/;

  if (!fallbackRegex.test(sw)) {
    fail(
      "StoryMediaSwitcher fallbackMedia 없음"
    );
  }

  sw = sw.replace(
    fallbackRegex,
`$1

  const galleryImages = media.filter(
    (item) =>
      item.media_type === "image" &&
      item.usage_type ===
        "story_gallery"
  );`
  );
}

if (
  !sw.includes(
    "story-pv-gallery-section"
  )
) {
  const finalClose =
`    </div>
  );
}`;

  const pos =
    sw.lastIndexOf(finalClose);

  if (pos < 0) {
    fail(
      "StoryMediaSwitcher 끝 위치 없음"
    );
  }

  const gallery =
`      {galleryImages.length > 0 ? (
        <section className="story-pv-gallery-section">
          <div className="story-pv-gallery-label">
            이미지
          </div>

          <div className="story-pv-gallery">
            {galleryImages.map(
              (item) => (
                <figure
                  key={item.id}
                  className="story-pv-gallery-item"
                >
                  <img
                    src={item.url}
                    alt={
                      item.title ||
                      storyTitle
                    }
                  />

                  {item.title ? (
                    <figcaption>
                      {item.title}
                    </figcaption>
                  ) : null}
                </figure>
              )
            )}
          </div>
        </section>
      ) : null}

`;

  sw =
    sw.slice(0, pos) +
    gallery +
    sw.slice(pos);
}

write(switcherFile, sw);

console.log(
  "[PATCHED] StoryMediaSwitcher gallery"
);

/* =========================================================
   CARD RELATED LABEL
========================================================= */

const cardDetail =
  "app/cards/[slug]/page.tsx";

if (fs.existsSync(cardDetail)) {
  let card = read(cardDetail);

  if (
    card.includes(
      "STORY_SUBTYPE_LABEL_MAP"
    ) &&
    !card.includes(
      'promo_video: "PV / 공식 영상"'
    )
  ) {
    card = card.replace(
      /(\s+main_story:\s*"메인스토리",)/,
      `$1
  promo_video: "PV / 공식 영상",`
    );

    write(cardDetail, card);
  }
}

/* =========================================================
   CSS
========================================================= */

const cssFile = "app/globals.css";
let css = read(cssFile);

const marker =
  "STORY PV GALLERY - 2026-11-16";

if (!css.includes(marker)) {
  css += `

/* =========================================================
   STORY PV GALLERY - 2026-11-16
========================================================= */

.story-pv-gallery-section,
.story-pv-linked-section {
  margin-top: 18px;
}

.story-pv-gallery-label {
  margin-bottom: 9px;
  color: rgba(88, 76, 94, 0.58);
  font-size: 11px;
  font-weight: 700;
}

.story-pv-gallery {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.story-pv-gallery-item {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid
    rgba(214, 204, 219, 0.36);
  border-radius: 12px;
  background:
    rgba(255, 255, 255, 0.46);
}

.story-pv-gallery-item img {
  display: block;
  width: 100%;
  height: auto;
}

.story-pv-gallery-item figcaption {
  padding: 7px 9px;
  color: rgba(78, 68, 84, 0.68);
  font-size: 10px;
}

@media (max-width: 700px) {
  .story-pv-gallery {
    grid-template-columns: 1fr;
  }
}
`;
}

write(cssFile, css);

console.log("[PATCHED] PV CSS");

console.log("");
console.log(
  "=== PV RESUME PATCH COMPLETE ==="
);
console.log(
  "- actions 저장 로직 완료"
);
console.log(
  "- PV 목록 탭 완료"
);
console.log(
  "- 상세 이미지 갤러리 완료"
);
console.log(
  "- 연결 일러스트 상세 표시 완료"
);
