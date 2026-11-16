import fs from "node:fs";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, src) {
  fs.writeFileSync(file, src, "utf8");
}

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   1. ACTIONS
========================================================= */

const actionsFile = "app/admin/actions.ts";
let actions = read(actionsFile);

/* ---------------------------------------------------------
   promo_video 허용
--------------------------------------------------------- */

const subtypeStart = actions.indexOf(
  "const ALLOWED_STORY_SUBTYPES"
);

if (subtypeStart < 0) {
  fail("ALLOWED_STORY_SUBTYPES를 찾지 못했습니다.");
}

const subtypeEnd = actions.indexOf(
  "]);",
  subtypeStart
);

if (subtypeEnd < 0) {
  fail("ALLOWED_STORY_SUBTYPES 끝을 찾지 못했습니다.");
}

let subtypeBlock = actions.slice(
  subtypeStart,
  subtypeEnd + 3
);

if (!subtypeBlock.includes('"promo_video"')) {
  const anchor = '  "company_project",';

  if (!subtypeBlock.includes(anchor)) {
    fail("company_project subtype 위치를 찾지 못했습니다.");
  }

  subtypeBlock = subtypeBlock.replace(
    anchor,
    `${anchor}
  "promo_video",`
  );

  actions =
    actions.slice(0, subtypeStart) +
    subtypeBlock +
    actions.slice(subtypeEnd + 3);

  console.log("[PATCHED] promo_video subtype");
} else {
  console.log("[SKIP] promo_video subtype already exists");
}

/* ---------------------------------------------------------
   helper 추가
--------------------------------------------------------- */

if (!actions.includes("async function syncStoryGalleryImages(")) {
  const helperInsert =
    actions.indexOf("async function deleteTypedRelations");

  if (helperInsert < 0) {
    fail("deleteTypedRelations 위치를 찾지 못했습니다.");
  }

  const helpers = `
function parseStoryPvValues(
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
            .map((item) => String(item ?? "").trim())
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

  const { error: deleteError } = await supabase
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
  const cleanIds = Array.from(
    new Set(
      illustrationIds
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );

  const { error: deleteError } = await supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", "story")
    .eq("parent_id", storyId)
    .eq("child_type", "illustration")
    .eq("relation_type", "story_illustration");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (cleanIds.length === 0) return;

  const { data: validRows, error: lookupError } =
    await supabase
      .from("illustrations")
      .select("id")
      .in("id", cleanIds);

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const validIds = new Set(
    (validRows ?? []).map((row) => row.id)
  );

  const rows = cleanIds
    .filter((id) => validIds.has(id))
    .map((id, index) => ({
      parent_type: "story",
      parent_id: storyId,
      child_type: "illustration",
      child_id: id,
      relation_type: "story_illustration",
      sort_order: index + 1,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("item_relations")
    .insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

`;

  actions =
    actions.slice(0, helperInsert) +
    helpers +
    actions.slice(helperInsert);

  console.log("[PATCHED] PV save helpers");
}

/* ---------------------------------------------------------
   실제 라이브 함수만 찾는다.
   // export ... 는 절대 잡지 않음
--------------------------------------------------------- */

const createMarker =
  "\nexport async function createStoryBundle";

const updateMarker =
  "\nexport async function updateStoryBundle";

const deleteMarker =
  "\nexport async function deleteStoryBundle";

const createStart =
  actions.indexOf(createMarker);

const updateStart =
  actions.indexOf(updateMarker);

const deleteStart =
  actions.indexOf(deleteMarker);

if (createStart < 0) {
  fail("실제 createStoryBundle을 찾지 못했습니다.");
}

if (updateStart < 0) {
  fail("실제 updateStoryBundle을 찾지 못했습니다.");
}

if (deleteStart < 0) {
  fail("deleteStoryBundle을 찾지 못했습니다.");
}

if (!(createStart < updateStart && updateStart < deleteStart)) {
  fail("스토리 action 함수 순서가 예상과 다릅니다.");
}

let createBlock = actions.slice(
  createStart,
  updateStart
);

let updateBlock = actions.slice(
  updateStart,
  deleteStart
);

/* ---------------------------------------------------------
   CREATE
--------------------------------------------------------- */

if (
  !createBlock.includes(
    'formData.get("storyGalleryImageUrls")'
  )
) {
  const coverLine =
    '    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();';

  if (!createBlock.includes(coverLine)) {
    fail("createStoryBundle coverImageUrl을 찾지 못했습니다.");
  }

  createBlock = createBlock.replace(
    coverLine,
`${coverLine}

    const storyGalleryImageUrls =
      parseStoryPvValues(
        formData.get("storyGalleryImageUrls")
      );

    const linkedIllustrationIds =
      parseStoryPvValues(
        formData.get("linkedIllustrationIds")
      );`
  );
}

if (
  !createBlock.includes(
    "syncStoryGalleryImages("
  )
) {
  const relationLine =
    "    await syncStoryStoryRelationsBySlugs(insertedStory.id, linkedStorySlugs);";

  if (!createBlock.includes(relationLine)) {
    fail("createStoryBundle story_story 저장 위치를 찾지 못했습니다.");
  }

  createBlock = createBlock.replace(
    relationLine,
`    await syncStoryGalleryImages(
      insertedStory.id,
      title,
      storyGalleryImageUrls
    );

    await syncStoryIllustrationRelations(
      insertedStory.id,
      linkedIllustrationIds
    );

${relationLine}`
  );
}

console.log("[PATCHED] createStoryBundle");

/* ---------------------------------------------------------
   UPDATE
--------------------------------------------------------- */

if (
  !updateBlock.includes(
    'formData.get("storyGalleryImageUrls")'
  )
) {
  const coverLine =
    '    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();';

  if (!updateBlock.includes(coverLine)) {
    fail("updateStoryBundle coverImageUrl을 찾지 못했습니다.");
  }

  updateBlock = updateBlock.replace(
    coverLine,
`${coverLine}

    const storyGalleryImageUrls =
      parseStoryPvValues(
        formData.get("storyGalleryImageUrls")
      );

    const linkedIllustrationIds =
      parseStoryPvValues(
        formData.get("linkedIllustrationIds")
      );`
  );
}

if (
  !updateBlock.includes(
    "syncStoryGalleryImages("
  )
) {
  const relationText =
    "await syncStoryStoryRelationsBySlugs(storyId, linkedStorySlugs);";

  const relationPos =
    updateBlock.indexOf(relationText);

  if (relationPos < 0) {
    fail("updateStoryBundle story_story 저장 위치를 찾지 못했습니다.");
  }

  updateBlock =
    updateBlock.slice(0, relationPos) +
`await syncStoryGalleryImages(
      storyId,
      title,
      storyGalleryImageUrls
    );

    await syncStoryIllustrationRelations(
      storyId,
      linkedIllustrationIds
    );

    ` +
    updateBlock.slice(relationPos);
}

console.log("[PATCHED] updateStoryBundle");

/* 함수 블록 되돌려 넣기 */
actions =
  actions.slice(0, createStart) +
  createBlock +
  updateBlock +
  actions.slice(deleteStart);

write(actionsFile, actions);

console.log("[OK] actions.ts 저장 완료");

/* =========================================================
   2. STORIES LIST - PV 탭
========================================================= */

const listFile = "app/stories/page.tsx";
let list = read(listFile);

const tabStart =
  list.indexOf("const STORY_TAB_OPTIONS");

if (tabStart < 0) {
  fail("stories/page.tsx STORY_TAB_OPTIONS 없음");
}

const tabEnd =
  list.indexOf("] as const;", tabStart);

if (tabEnd < 0) {
  fail("stories/page.tsx STORY_TAB_OPTIONS 끝 없음");
}

let tabBlock =
  list.slice(tabStart, tabEnd);

if (!tabBlock.includes('key: "promo"')) {
  const eventKey =
    tabBlock.indexOf('key: "event"');

  const eventObjectStart =
    tabBlock.lastIndexOf("  {", eventKey);

  if (eventKey < 0 || eventObjectStart < 0) {
    fail("event 탭 위치를 찾지 못했습니다.");
  }

  const promoTab =
`  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
    desc: "공식 PV, 티저, 프로모션 영상과 관련 이미지",
  },
`;

  tabBlock =
    tabBlock.slice(0, eventObjectStart) +
    promoTab +
    tabBlock.slice(eventObjectStart);

  list =
    list.slice(0, tabStart) +
    tabBlock +
    list.slice(tabEnd);

  console.log("[PATCHED] STORY_TAB_OPTIONS promo");
}

/* subtype 한국어 */
if (
  !list.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  list = list.replace(
    '  main_story: "메인스토리",',
`  main_story: "메인스토리",
  promo_video: "PV / 공식 영상",`
  );
}

/* 상단 주요 탭 */
list = list.replaceAll(
  'primaryKeys={["all", "main", "card"]}',
  'primaryKeys={["all", "main", "card", "promo"]}'
);

/* 수동으로 생성하는 nav 배열 2곳 */
const eventNavAnchor =
`    {
      key: "event",
      label: "이벤트 / 기념일",
      href: buildStoriesHref({
        tab: "event",`;

if (
  list.includes(eventNavAnchor) &&
  !list.includes(
`    {
      key: "promo",
      label: "PV / 공식 영상",
      href: buildStoriesHref({
        tab: "promo",`
  )
) {
  const promoNav =
`    {
      key: "promo",
      label: "PV / 공식 영상",
      href: buildStoriesHref({
        tab: "promo",
        q,
        years: selectedYears,
        characters: selectedCharacterKeys,
        scope,
        sort,
        page: 1,
      }),
    },
`;

  list = list.split(eventNavAnchor).join(
    promoNav + eventNavAnchor
  );
}

write(listFile, list);

console.log("[PATCHED] stories PV tab");

/* =========================================================
   3. STORY DETAIL
========================================================= */

const detailFile =
  "app/stories/[slug]/page.tsx";

let detail = read(detailFile);

const galleryImport =
  'import StoryLinkedIllustrationGallery from "@/components/story/StoryLinkedIllustrationGallery";';

if (!detail.includes(galleryImport)) {
  const mediaImport =
    'import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";';

  if (!detail.includes(mediaImport)) {
    fail("StoryMediaSwitcher import 없음");
  }

  detail = detail.replace(
    mediaImport,
    `${mediaImport}
${galleryImport}`
  );
}

/* 상세의 탭 목록 */
const detailTabStart =
  detail.indexOf("const STORY_TAB_OPTIONS");

if (detailTabStart >= 0) {
  const detailTabEnd =
    detail.indexOf(
      "] as const;",
      detailTabStart
    );

  if (detailTabEnd >= 0) {
    let block =
      detail.slice(
        detailTabStart,
        detailTabEnd
      );

    if (!block.includes('key: "promo"')) {
      const eventKey =
        block.indexOf('key: "event"');

      const objectStart =
        block.lastIndexOf(
          "  {",
          eventKey
        );

      if (
        eventKey >= 0 &&
        objectStart >= 0
      ) {
        const promo =
`  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
  },
`;

        block =
          block.slice(0, objectStart) +
          promo +
          block.slice(objectStart);

        detail =
          detail.slice(
            0,
            detailTabStart
          ) +
          block +
          detail.slice(
            detailTabEnd
          );
      }
    }
  }
}

if (
  !detail.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  detail = detail.replace(
    '  main_story: "메인스토리",',
`  main_story: "메인스토리",
  promo_video: "PV / 공식 영상",`
  );
}

if (
  !detail.includes(
    "<StoryLinkedIllustrationGallery"
  )
) {
  const mediaRender =
    '<StoryMediaSwitcher storyTitle={story.title} media={media ?? []} />';

  if (!detail.includes(mediaRender)) {
    fail("스토리 상세 StoryMediaSwitcher 렌더 위치 없음");
  }

  detail = detail.replace(
    mediaRender,
`${mediaRender}
  <StoryLinkedIllustrationGallery
    storyId={story.id}
  />`
  );
}

write(detailFile, detail);

console.log("[PATCHED] story detail PV");

/* =========================================================
   4. StoryMediaSwitcher - 여러 이미지
========================================================= */

const switcherFile =
  "components/story/StoryMediaSwitcher.tsx";

let sw = read(switcherFile);

if (!sw.includes("const galleryImages =")) {
  const initialLang =
    '  const initialLang: "cn" | "kr" = mediaCn ? "cn" : "kr";';

  if (!sw.includes(initialLang)) {
    fail("StoryMediaSwitcher initialLang 위치 없음");
  }

  sw = sw.replace(
    initialLang,
`  const galleryImages = media.filter(
    (item) =>
      item.media_type === "image" &&
      item.usage_type === "story_gallery"
  );

${initialLang}`
  );
}

if (!sw.includes("story-pv-gallery-section")) {
  const finalClose =
`    </div>
  );
}`;

  const finalPos =
    sw.lastIndexOf(finalClose);

  if (finalPos < 0) {
    fail("StoryMediaSwitcher 끝 위치 없음");
  }

  const gallery =
`      {galleryImages.length > 0 ? (
        <section className="story-pv-gallery-section">
          <div className="story-pv-gallery-label">
            이미지
          </div>

          <div className="story-pv-gallery">
            {galleryImages.map((item) => (
              <figure
                key={item.id}
                className="story-pv-gallery-item"
              >
                <img
                  src={item.url}
                  alt={item.title || storyTitle}
                />

                {item.title ? (
                  <figcaption>
                    {item.title}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

`;

  sw =
    sw.slice(0, finalPos) +
    gallery +
    sw.slice(finalPos);
}

write(switcherFile, sw);

console.log("[PATCHED] StoryMediaSwitcher gallery");

/* =========================================================
   5. CSS
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
  line-height: 1.4;
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
console.log("=== STORY PV V3 COMPLETE ===");
console.log("- PV / 공식 영상 카테고리");
console.log("- CN / KR 영상 유지");
console.log("- CN / KR 번역 유지");
console.log("- 복수 캐릭터 유지");
console.log("- 직접 이미지 여러 장");
console.log("- 기존 일러스트 연결");
