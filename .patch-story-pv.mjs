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
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   1. STORY PV EXTRAS
   - 여러 이미지 업로드
   - 기존 illustrations 연결
========================================================= */

const pvExtrasFile =
  "components/admin/stories/StoryPvExtras.tsx";

write(
  pvExtrasFile,
`import { supabase } from "@/lib/supabase/server";
import PhoneImageField from "@/components/admin/phone-items/PhoneImageField";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

type Props = {
  storyId?: string;
};

export default async function StoryPvExtras({
  storyId,
}: Props) {
  const [
    { data: illustrations },
    { data: characters },
  ] = await Promise.all([
    supabase
      .from("illustrations")
      .select(
        "id, title, image_url, release_year, release_date, primary_character_id, is_published"
      )
      .eq("is_published", true)
      .order("release_year", { ascending: false })
      .order("release_date", { ascending: false }),

    supabase
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),
  ]);

  let galleryUrls: string[] = [];
  let linkedIllustrationIds: string[] = [];

  if (storyId) {
    const [
      { data: galleryRows },
      { data: relationRows },
    ] = await Promise.all([
      supabase
        .from("media_assets")
        .select("id, url, sort_order")
        .eq("parent_type", "story")
        .eq("parent_id", storyId)
        .eq("media_type", "image")
        .eq("usage_type", "story_gallery")
        .order("sort_order", { ascending: true }),

      supabase
        .from("item_relations")
        .select("child_id, sort_order")
        .eq("parent_type", "story")
        .eq("parent_id", storyId)
        .eq("child_type", "illustration")
        .eq("relation_type", "story_illustration")
        .order("sort_order", { ascending: true }),
    ]);

    galleryUrls = (galleryRows ?? [])
      .map((item: any) => String(item.url || "").trim())
      .filter(Boolean);

    linkedIllustrationIds = (relationRows ?? [])
      .map((item: any) => String(item.child_id || "").trim())
      .filter(Boolean);
  }

  const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [
      item.id,
      item.key,
    ])
  );

  const illustrationCandidates: RelationCandidate[] =
    (illustrations ?? []).map((item: any) => ({
      id: item.id,
      slug: item.id,
      title: item.title || "제목 없음",
      characterKey:
        characterKeyMap.get(
          item.primary_character_id
        ) ?? null,
    }));

  const candidateMap = new Map(
    illustrationCandidates.map((item) => [
      item.id ?? item.slug,
      item,
    ])
  );

  const initialIllustrations =
    linkedIllustrationIds
      .map((id) => candidateMap.get(id))
      .filter(
        (
          item
        ): item is RelationCandidate =>
          Boolean(item)
      );

  const characterOptions =
    (characters ?? []).map((item: any) => ({
      value: item.key,
      label: item.name_ko,
    }));

  return (
    <>
      <div className="detail-panel story-pv-admin-panel">
        <h2 className="detail-section-title">
          PV / 공식 이미지
        </h2>

        <p
          style={{
            margin: "0 0 14px",
            color: "var(--text-sub)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          PV 스틸컷, 티저, 키비주얼,
          이벤트 배너 등을 여러 장
          등록할 수 있습니다.
        </p>

        <PhoneImageField
          label="추가 이미지"
          name="storyGalleryImageUrls"
          initialUrls={galleryUrls}
          multiple
          help="드래그앤드롭 / 파일 선택 / URL 직접 입력 · 여러 장 가능"
        />
      </div>

      <RelationPicker
        label="연결 일러스트"
        name="linkedIllustrationIds"
        candidates={illustrationCandidates}
        initialSelected={initialIllustrations}
        characterOptions={characterOptions}
        serializeBy="id"
      />
    </>
  );
}
`
);

console.log("[CREATED] StoryPvExtras.tsx");

/* =========================================================
   2. LINKED ILLUSTRATION PUBLIC GALLERY
========================================================= */

const linkedGalleryFile =
  "components/story/StoryLinkedIllustrationGallery.tsx";

write(
  linkedGalleryFile,
`import { supabase } from "@/lib/supabase/server";

type Props = {
  storyId: string;
};

export default async function StoryLinkedIllustrationGallery({
  storyId,
}: Props) {
  const { data: relations } = await supabase
    .from("item_relations")
    .select("child_id, sort_order")
    .eq("parent_type", "story")
    .eq("parent_id", storyId)
    .eq("child_type", "illustration")
    .eq("relation_type", "story_illustration")
    .order("sort_order", { ascending: true });

  const illustrationIds = (relations ?? [])
    .map((item: any) => item.child_id)
    .filter(Boolean);

  if (illustrationIds.length === 0) {
    return null;
  }

  const { data: illustrations } = await supabase
    .from("illustrations")
    .select("id, title, image_url")
    .in("id", illustrationIds);

  const illustrationMap = new Map(
    (illustrations ?? []).map((item: any) => [
      item.id,
      item,
    ])
  );

  const ordered = illustrationIds
    .map((id: string) => illustrationMap.get(id))
    .filter(Boolean)
    .filter(
      (item: any) =>
        Boolean(String(item.image_url || "").trim())
    );

  if (ordered.length === 0) {
    return null;
  }

  return (
    <section className="story-pv-linked-section">
      <div className="story-pv-gallery-label">
        연결 일러스트
      </div>

      <div className="story-pv-gallery">
        {ordered.map((item: any) => (
          <figure
            key={item.id}
            className="story-pv-gallery-item"
          >
            <img
              src={item.image_url}
              alt={item.title || "연결 일러스트"}
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
  );
}
`
);

console.log(
  "[CREATED] StoryLinkedIllustrationGallery.tsx"
);

/* =========================================================
   3. ADMIN NEW / EDIT
========================================================= */

function patchAdminStoryPage(file, isEdit) {
  let src = read(file);

  const importLine =
    `import StoryPvExtras from "@/components/admin/stories/StoryPvExtras";`;

  if (!src.includes(importLine)) {
    const importAnchor =
      `import StoryTranslationFields from "@/components/admin/stories/StoryTranslationFields";`;

    if (!src.includes(importAnchor)) {
      fail(
        `${file}: StoryTranslationFields import를 찾지 못했습니다.`
      );
    }

    src = src.replace(
      importAnchor,
      `${importAnchor}\n${importLine}`
    );
  }

  if (!src.includes('value: "promo_video"')) {
    const mainRegex =
      /(\{\s*value:\s*"main_story",\s*label:\s*"메인스토리"\s*\},)/;

    if (!mainRegex.test(src)) {
      fail(
        `${file}: main_story subtype option을 찾지 못했습니다.`
      );
    }

    src = src.replace(
      mainRegex,
      `$1\n  { value: "promo_video", label: "PV / 공식 영상" },`
    );
  }

  if (!src.includes("<StoryPvExtras")) {
    const relationAnchor =
      "        <RelationPicker";

    const index = src.indexOf(relationAnchor);

    if (index < 0) {
      fail(
        `${file}: RelationPicker 삽입 위치를 찾지 못했습니다.`
      );
    }

    const pvBlock = isEdit
      ? `        <StoryPvExtras storyId={story.id} />\n\n`
      : `        <StoryPvExtras />\n\n`;

    src =
      src.slice(0, index) +
      pvBlock +
      src.slice(index);
  }

  write(file, src);
  console.log("[PATCHED]", file);
}

patchAdminStoryPage(
  "app/admin/stories/new/page.tsx",
  false
);

patchAdminStoryPage(
  "app/admin/stories/[slug]/edit/page.tsx",
  true
);

/* =========================================================
   4. ACTIONS
========================================================= */

const actionsFile = "app/admin/actions.ts";
let actions = read(actionsFile);

if (!actions.includes('"promo_video"')) {
  const allowedAnchor =
    `  "company_project",\n]);`;

  if (!actions.includes(allowedAnchor)) {
    fail(
      "actions.ts: ALLOWED_STORY_SUBTYPES 위치를 찾지 못했습니다."
    );
  }

  actions = actions.replace(
    allowedAnchor,
    `  "company_project",\n  "promo_video",\n]);`
  );
}

/* helper */
if (
  !actions.includes(
    "async function syncStoryGalleryImages("
  )
) {
  const helperAnchor =
`function parseSlugLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\\n")
    .map((line) => line.trim())
    .filter(Boolean);
}`;

  if (!actions.includes(helperAnchor)) {
    fail(
      "actions.ts: parseSlugLines helper를 찾지 못했습니다."
    );
  }

  const helpers = `${helperAnchor}

function parseMultiValueField(
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
  const uniqueUrls = Array.from(
    new Set(urls.map((item) => item.trim()).filter(Boolean))
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

  if (uniqueUrls.length === 0) {
    return;
  }

  const rows = uniqueUrls.map((url, index) => ({
    parent_type: "story",
    parent_id: storyId,
    media_type: "image",
    usage_type: "story_gallery",
    url,
    title: \`\${title} 이미지 \${index + 1}\`,
    is_primary: false,
    sort_order: 20 + index,
  }));

  const { error } = await supabase
    .from("media_assets")
    .insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

async function syncStoryIllustrationRelations(
  storyId: string,
  illustrationIds: string[]
) {
  const uniqueIds = Array.from(
    new Set(
      illustrationIds
        .map((item) => item.trim())
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

  if (uniqueIds.length === 0) {
    return;
  }

  const { data: validRows, error: lookupError } =
    await supabase
      .from("illustrations")
      .select("id")
      .in("id", uniqueIds);

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const validSet = new Set(
    (validRows ?? []).map((item: any) => item.id)
  );

  const rows = uniqueIds
    .filter((id) => validSet.has(id))
    .map((id, index) => ({
      parent_type: "story",
      parent_id: storyId,
      child_type: "illustration",
      child_id: id,
      relation_type: "story_illustration",
      sort_order: index + 1,
    }));

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}`;

  actions = actions.replace(
    helperAnchor,
    helpers
  );
}

/* patch only live create/update function ranges */
function patchStoryAction(
  src,
  functionStart,
  functionEnd,
  storyIdExpr
) {
  const start = src.indexOf(functionStart);
  const end = src.indexOf(functionEnd, start + 1);

  if (start < 0 || end < 0) {
    fail(
      `actions.ts 함수 범위 찾기 실패: ${functionStart}`
    );
  }

  let block = src.slice(start, end);

  if (
    !block.includes(
      "storyGalleryImageUrls"
    )
  ) {
    const mediaAnchor =
      `    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();`;

    if (!block.includes(mediaAnchor)) {
      fail(
        `${functionStart}: coverImageUrl 위치를 찾지 못했습니다.`
      );
    }

    block = block.replace(
      mediaAnchor,
`${mediaAnchor}
    const storyGalleryImageUrls = parseMultiValueField(
      formData.get("storyGalleryImageUrls")
    );
    const linkedIllustrationIds = parseMultiValueField(
      formData.get("linkedIllustrationIds")
    );`
    );
  }

  if (
    !block.includes(
      "syncStoryGalleryImages("
    )
  ) {
    const relationAnchor =
      storyIdExpr.includes("insertedStory")
        ? `    await syncStoryStoryRelationsBySlugs(insertedStory.id, linkedStorySlugs);`
        : `   await syncStoryStoryRelationsBySlugs(storyId, linkedStorySlugs);`;

    let actualAnchor = relationAnchor;

    if (!block.includes(actualAnchor)) {
      actualAnchor =
        storyIdExpr.includes("insertedStory")
          ? `    await syncStoryStoryRelationsBySlugs(insertedStory.id, linkedStorySlugs);`
          : `    await syncStoryStoryRelationsBySlugs(storyId, linkedStorySlugs);`;
    }

    if (!block.includes(actualAnchor)) {
      fail(
        `${functionStart}: story relation 저장 위치를 찾지 못했습니다.`
      );
    }

    block = block.replace(
      actualAnchor,
`    await syncStoryGalleryImages(
      ${storyIdExpr},
      title,
      storyGalleryImageUrls
    );

    await syncStoryIllustrationRelations(
      ${storyIdExpr},
      linkedIllustrationIds
    );

${actualAnchor}`
    );
  }

  return (
    src.slice(0, start) +
    block +
    src.slice(end)
  );
}

actions = patchStoryAction(
  actions,
  "export async function createStoryBundle(formData: FormData) {",
  "// export async function updateStoryBundle",
  "insertedStory.id"
);

actions = patchStoryAction(
  actions,
  "export async function updateStoryBundle(formData: FormData) {",
  "export async function deleteStoryBundle",
  "storyId"
);

write(actionsFile, actions);
console.log("[PATCHED] app/admin/actions.ts");

/* =========================================================
   5. STORIES ARCHIVE TAB
========================================================= */

const storiesPageFile = "app/stories/page.tsx";
let storiesPage = read(storiesPageFile);

if (
  !storiesPage.includes(
    'key: "promo"'
  )
) {
  const tabAnchor =
`  {
    key: "event",
    label: "이벤트 / 기념일",
    subtypes: [],
    desc: "생일, 기념일, 시즌, 복귀, N주년 이벤트",
  },`;

  if (!storiesPage.includes(tabAnchor)) {
    fail(
      "stories/page.tsx: STORY_TAB_OPTIONS event 위치를 찾지 못했습니다."
    );
  }

  storiesPage = storiesPage.replace(
    tabAnchor,
`  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
    desc: "공식 PV, 티저, 프로모션 영상과 관련 이미지를 모아봅니다.",
  },
${tabAnchor}`
  );
}

if (
  !storiesPage.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  const labelAnchor =
    `  main_story: "메인스토리",`;

  if (storiesPage.includes(labelAnchor)) {
    storiesPage = storiesPage.replace(
      labelAnchor,
`${labelAnchor}
  promo_video: "PV / 공식 영상",`
    );
  }
}

storiesPage = storiesPage.replaceAll(
  'primaryKeys={["all", "main", "card"]}',
  'primaryKeys={["all", "main", "card", "promo"]}'
);

const eventUiAnchor =
`    {
      key: "event",
      label: "이벤트 / 기념일",
      href: buildStoriesHref({`;

if (
  !storiesPage.includes(
    'key: "promo",\n      label: "PV / 공식 영상",\n      href: buildStoriesHref'
  )
) {
  if (!storiesPage.includes(eventUiAnchor)) {
    fail(
      "stories/page.tsx: 카테고리 UI event 위치를 찾지 못했습니다."
    );
  }

  const promoUi =
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

  storiesPage =
    storiesPage.split(eventUiAnchor).join(
      promoUi + eventUiAnchor
    );
}

write(storiesPageFile, storiesPage);
console.log("[PATCHED] app/stories/page.tsx");

/* =========================================================
   6. STORY DETAIL
========================================================= */

const storyDetailFile =
  "app/stories/[slug]/page.tsx";

let detail = read(storyDetailFile);

const linkedImport =
  `import StoryLinkedIllustrationGallery from "@/components/story/StoryLinkedIllustrationGallery";`;

if (!detail.includes(linkedImport)) {
  const importAnchor =
    `import StoryMediaSwitcher from "@/components/story/StoryMediaSwitcher";`;

  if (!detail.includes(importAnchor)) {
    fail(
      "story detail: StoryMediaSwitcher import를 찾지 못했습니다."
    );
  }

  detail = detail.replace(
    importAnchor,
    `${importAnchor}\n${linkedImport}`
  );
}

/* detail next/prev tab awareness */
if (
  !detail.includes(
    'subtypes: ["promo_video"]'
  )
) {
  const detailEventTab =
`  {
    key: "event",
    label: "이벤트 / 기념일",
    subtypes: [],
  },`;

  if (detail.includes(detailEventTab)) {
    detail = detail.replace(
      detailEventTab,
`  {
    key: "promo",
    label: "PV / 공식 영상",
    subtypes: ["promo_video"],
  },
${detailEventTab}`
    );
  }
}

if (
  !detail.includes(
    'promo_video: "PV / 공식 영상"'
  )
) {
  const mainLabel =
    `  main_story: "메인스토리",`;

  if (detail.includes(mainLabel)) {
    detail = detail.replace(
      mainLabel,
`${mainLabel}
  promo_video: "PV / 공식 영상",`
    );
  }
}

if (
  !detail.includes(
    "<StoryLinkedIllustrationGallery"
  )
) {
  const mediaCall =
    `<StoryMediaSwitcher storyTitle={story.title} media={media ?? []} />`;

  if (!detail.includes(mediaCall)) {
    fail(
      "story detail: StoryMediaSwitcher 렌더 위치를 찾지 못했습니다."
    );
  }

  detail = detail.replace(
    mediaCall,
`${mediaCall}
  <StoryLinkedIllustrationGallery storyId={story.id} />`
  );
}

write(storyDetailFile, detail);
console.log("[PATCHED] app/stories/[slug]/page.tsx");

/* =========================================================
   7. STORY MEDIA SWITCHER - DIRECT GALLERY
========================================================= */

const switcherFile =
  "components/story/StoryMediaSwitcher.tsx";

let switcher = read(switcherFile);

if (!switcher.includes("const galleryImages =")) {
  const fallbackAnchor =
`  const fallbackMedia =
    media.find((item) => item.media_type === "image" && item.usage_type === "cover") ??
    media[0] ??
    null;`;

  if (!switcher.includes(fallbackAnchor)) {
    fail(
      "StoryMediaSwitcher: fallbackMedia 위치를 찾지 못했습니다."
    );
  }

  switcher = switcher.replace(
    fallbackAnchor,
`${fallbackAnchor}

  const galleryImages = media.filter(
    (item) =>
      item.media_type === "image" &&
      item.usage_type === "story_gallery"
  );`
  );
}

if (
  !switcher.includes(
    'className="story-pv-gallery"'
  )
) {
  const closeAnchor =
`      </div>
    </div>
  );
}`;

  if (!switcher.includes(closeAnchor)) {
    fail(
      "StoryMediaSwitcher: 컴포넌트 끝 위치를 찾지 못했습니다."
    );
  }

  switcher = switcher.replace(
    closeAnchor,
`      </div>

      {galleryImages.length > 0 ? (
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
    </div>
  );
}`
  );
}

write(switcherFile, switcher);
console.log(
  "[PATCHED] components/story/StoryMediaSwitcher.tsx"
);

/* =========================================================
   8. CARD DETAIL RELATED STORY LABEL
========================================================= */

const cardDetailFile =
  "app/cards/[slug]/page.tsx";

if (fs.existsSync(cardDetailFile)) {
  let cardDetail = read(cardDetailFile);

  if (
    cardDetail.includes(
      "STORY_SUBTYPE_LABEL_MAP"
    ) &&
    !cardDetail.includes(
      'promo_video: "PV / 공식 영상"'
    )
  ) {
    const anchor =
      `  main_story: "메인스토리",`;

    if (cardDetail.includes(anchor)) {
      cardDetail = cardDetail.replace(
        anchor,
`${anchor}
  promo_video: "PV / 공식 영상",`
      );

      write(cardDetailFile, cardDetail);
      console.log(
        "[PATCHED] card detail PV label"
      );
    }
  }
}

/* =========================================================
   9. CSS
========================================================= */

const cssFile = "app/globals.css";
let css = read(cssFile);

const cssMarker =
  "STORY PV / OFFICIAL MEDIA GALLERY - 2026-11-16";

if (!css.includes(cssMarker)) {
  css += `

/* =========================================================
   STORY PV / OFFICIAL MEDIA GALLERY - 2026-11-16
========================================================= */

.story-pv-admin-panel {
  margin-top: 18px;
}

.story-pv-gallery-section,
.story-pv-linked-section {
  margin-top: 18px;
}

.story-pv-gallery-label {
  margin-bottom: 9px;

  color: rgba(88, 76, 94, 0.58);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
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
  border-radius: 12px;

  background:
    rgba(255, 255, 255, 0.46);
  border:
    1px solid rgba(214, 204, 219, 0.36);
}

.story-pv-gallery-item img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
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
console.log("[PATCHED] app/globals.css");

console.log("");
console.log("=== STORY PV PATCH COMPLETE ===");
console.log("- subtype: promo_video / PV / 공식 영상");
console.log("- CN / KR 유튜브 유지");
console.log("- CN / KR 번역 유지");
console.log("- 복수 캐릭터 기존 item_characters 유지");
console.log("- 여러 이미지 업로드 추가");
console.log("- illustrations 연결 추가");
console.log("- 상세페이지 이미지 갤러리 추가");
