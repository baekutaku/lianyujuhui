import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, source) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    source.replace(/\n/g, "\r\n"),
    "utf8"
  );
}

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    fail(`${label} 패치 위치를 찾지 못했습니다.`);
  }

  return source.replace(before, after);
}

/* =========================================================
   1. RelationPicker
      - 기존 기본값은 slug
      - 휴대폰끼리 연결할 때만 id 직렬화 지원
========================================================= */

{
  const file =
    "components/admin/relations/RelationPicker.tsx";

  let src = read(file);

  if (!src.includes("serializeBy?:")) {
    src = replaceOnce(
      src,
`export type RelationCandidate = {
  slug: string;`,
`export type RelationCandidate = {
  id?: string;
  slug: string;`,
      "RelationCandidate id"
    );

    src = replaceOnce(
      src,
`  categoryOptions?: SelectOption[];
};`,
`  categoryOptions?: SelectOption[];
  serializeBy?: "slug" | "id";
};`,
      "serializeBy prop"
    );

    src = replaceOnce(
      src,
`  categoryOptions = [],
}: RelationPickerProps) {`,
`  categoryOptions = [],
  serializeBy = "slug",
}: RelationPickerProps) {`,
      "serializeBy destructure"
    );

    src = replaceOnce(
      src,
`  const [selected, setSelected] = useState<RelationCandidate[]>(initialSelected);

  const filtered = useMemo(() => {`,
`  const [selected, setSelected] = useState<RelationCandidate[]>(initialSelected);

  function getCandidateKey(item: RelationCandidate) {
    return serializeBy === "id"
      ? item.id || item.slug
      : item.slug;
  }

  const filtered = useMemo(() => {`,
      "candidate key helper"
    );

    src = src.replace(
      `const notSelected = !selected.some((s) => s.slug === item.slug);`,
      `const notSelected = !selected.some(
        (s) => getCandidateKey(s) === getCandidateKey(item)
      );`
    );

    src = src.replace(
      `}, [candidates, query, selected, subtype, character, category]);`,
      `}, [
    candidates,
    query,
    selected,
    subtype,
    character,
    category,
    serializeBy,
  ]);`
    );

    src = replaceOnce(
      src,
`  const serialized = selected.map((item) => item.slug).join("\\n");

  function addItem(item: RelationCandidate) {
    setSelected((prev) => {
      if (prev.some((x) => x.slug === item.slug)) return prev;
      return [...prev, item];
    });
  }

  function removeItem(slug: string) {
    setSelected((prev) => prev.filter((item) => item.slug !== slug));
  }`,
`  const serialized = selected
    .map((item) => getCandidateKey(item))
    .join("\\n");

  function addItem(item: RelationCandidate) {
    setSelected((prev) => {
      const key = getCandidateKey(item);

      if (
        prev.some(
          (current) => getCandidateKey(current) === key
        )
      ) {
        return prev;
      }

      return [...prev, item];
    });
  }

  function removeItem(key: string) {
    setSelected((prev) =>
      prev.filter(
        (item) => getCandidateKey(item) !== key
      )
    );
  }`,
      "RelationPicker serialization"
    );

    src = src.replaceAll(
      `key={item.slug}`,
      `key={getCandidateKey(item)}`
    );

    src = src.replace(
      `onClick={() => removeItem(item.slug)}`,
      `onClick={() => removeItem(getCandidateKey(item))}`
    );

    write(file, src);
    console.log("[PATCHED] RelationPicker ID support");
  } else {
    console.log("[SKIP] RelationPicker already supports ID");
  }
}

/* =========================================================
   2. PhoneItemForm
      RelationPicker를 동일 <form> 안에 넣을 슬롯 추가
========================================================= */

{
  const file =
    "components/admin/phone-items/PhoneItemForm.tsx";

  let src = read(file);

  if (!src.includes("relationFields?: ReactNode")) {
    src = replaceOnce(
      src,
`  hiddenFields?: ReactNode;
  initialValues?: {`,
`  hiddenFields?: ReactNode;
  relationFields?: ReactNode;
  initialValues?: {`,
      "PhoneItemForm relationFields prop"
    );
  }

  if (
    !src.includes(
      `  relationFields,
  initialValues,`
    )
  ) {
    src = replaceOnce(
      src,
`  hiddenFields,
  initialValues,
}: PhoneItemFormProps) {`,
`  hiddenFields,
  relationFields,
  initialValues,
}: PhoneItemFormProps) {`,
      "PhoneItemForm destructure"
    );
  }

  if (!src.includes("{relationFields}")) {
    const button =
`      <button type="submit" className="primary-button">
        {submitLabel}
      </button>`;

    src = replaceOnce(
      src,
      button,
`      {relationFields}

${button}`,
      "PhoneItemForm relation fields render"
    );
  }

  write(file, src);
  console.log("[PATCHED] PhoneItemForm relation slot");
}

/* =========================================================
   3. PhoneRelationFields 신규 생성
========================================================= */

{
  const file =
    "components/admin/phone-items/PhoneRelationFields.tsx";

  const source = `import { supabase } from "@/lib/supabase/server";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

type PhoneRelationFieldsProps = {
  phoneItemId?: string;
};

type RelationRow = {
  parent_id?: string;
  child_id?: string;
  sort_order?: number | null;
};

function makeOptions(
  values: Array<string | null | undefined>
) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  )
    .sort((a, b) => a.localeCompare(b, "ko"))
    .map((value) => ({
      value,
      label: value,
    }));
}

function sortRelations(rows: RelationRow[]) {
  return [...rows].sort(
    (a, b) =>
      Number(a.sort_order ?? 0) -
      Number(b.sort_order ?? 0)
  );
}

const PHONE_SUBTYPE_OPTIONS = [
  { value: "message", label: "메시지" },
  { value: "moment", label: "모멘트" },
  { value: "call", label: "전화" },
  { value: "video_call", label: "영상통화" },
  { value: "article", label: "기사" },
];

export default async function PhoneRelationFields({
  phoneItemId,
}: PhoneRelationFieldsProps) {
  const [
    { data: characters },
    { data: cards },
    { data: stories },
    { data: events },
    { data: phoneItems },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),

    supabase
      .from("cards")
      .select(
        "id, title, slug, card_category, primary_character_id"
      )
      .order("release_year", { ascending: false }),

    supabase
      .from("stories")
      .select(
        "id, title, slug, subtype, primary_character_id"
      )
      .order("release_year", { ascending: false }),

    supabase
      .from("events")
      .select(
        "id, title, slug, subtype, primary_character_id"
      )
      .order("release_year", { ascending: false }),

    supabase
      .from("phone_items")
      .select(
        "id, title, slug, subtype, content_json, primary_character_id"
      )
      .order("release_year", { ascending: false }),
  ]);

  const characterMap = new Map(
    (characters ?? []).map((item: any) => [
      item.id,
      item.key,
    ])
  );

  const characterOptions = (characters ?? []).map(
    (item: any) => ({
      value: item.key,
      label: item.name_ko || item.key,
    })
  );

  const cardCandidates: RelationCandidate[] =
    (cards ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      characterKey:
        characterMap.get(item.primary_character_id) ?? null,
      category: item.card_category ?? null,
    }));

  const storyCandidates: RelationCandidate[] =
    (stories ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtype: item.subtype ?? null,
      characterKey:
        characterMap.get(item.primary_character_id) ?? null,
    }));

  const eventCandidates: RelationCandidate[] =
    (events ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtype: item.subtype ?? null,
      characterKey:
        characterMap.get(item.primary_character_id) ?? null,
    }));

  const phoneCandidates: RelationCandidate[] =
    (phoneItems ?? [])
      .filter((item: any) => item.id !== phoneItemId)
      .map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title || item.slug,
        subtype: item.subtype ?? null,
        characterKey:
          item.content_json?.characterKey ??
          item.content_json?.authorKey ??
          characterMap.get(item.primary_character_id) ??
          null,
        category:
          item.content_json?.historyCategory ??
          item.content_json?.momentCategory ??
          item.content_json?.sourceSlug ??
          null,
      }));

  let initialCards: RelationCandidate[] = [];
  let initialStories: RelationCandidate[] = [];
  let initialEvents: RelationCandidate[] = [];
  let initialPhones: RelationCandidate[] = [];

  if (phoneItemId) {
    const [
      { data: cardRelations },
      { data: storyRelations },
      { data: eventRelations },
      { data: phoneRelations },
    ] = await Promise.all([
      supabase
        .from("item_relations")
        .select("parent_id, sort_order")
        .eq("parent_type", "card")
        .eq("child_type", "phone_item")
        .eq("child_id", phoneItemId)
        .eq("relation_type", "card_phone")
        .order("sort_order", { ascending: true }),

      supabase
        .from("item_relations")
        .select("child_id, sort_order")
        .eq("parent_type", "phone_item")
        .eq("parent_id", phoneItemId)
        .eq("child_type", "story")
        .eq("relation_type", "phone_story")
        .order("sort_order", { ascending: true }),

      supabase
        .from("item_relations")
        .select("child_id, sort_order")
        .eq("parent_type", "phone_item")
        .eq("parent_id", phoneItemId)
        .eq("child_type", "event")
        .eq("relation_type", "phone_event")
        .order("sort_order", { ascending: true }),

      supabase
        .from("item_relations")
        .select("child_id, sort_order")
        .eq("parent_type", "phone_item")
        .eq("parent_id", phoneItemId)
        .eq("child_type", "phone_item")
        .eq("relation_type", "phone_phone")
        .order("sort_order", { ascending: true }),
    ]);

    const cardMap = new Map(
      cardCandidates.map((item) => [item.id, item])
    );

    const storyMap = new Map(
      storyCandidates.map((item) => [item.id, item])
    );

    const eventMap = new Map(
      eventCandidates.map((item) => [item.id, item])
    );

    const phoneMap = new Map(
      phoneCandidates.map((item) => [item.id, item])
    );

    initialCards = sortRelations(
      (cardRelations ?? []) as RelationRow[]
    )
      .map((row) => cardMap.get(row.parent_id))
      .filter(Boolean) as RelationCandidate[];

    initialStories = sortRelations(
      (storyRelations ?? []) as RelationRow[]
    )
      .map((row) => storyMap.get(row.child_id))
      .filter(Boolean) as RelationCandidate[];

    initialEvents = sortRelations(
      (eventRelations ?? []) as RelationRow[]
    )
      .map((row) => eventMap.get(row.child_id))
      .filter(Boolean) as RelationCandidate[];

    initialPhones = sortRelations(
      (phoneRelations ?? []) as RelationRow[]
    )
      .map((row) => phoneMap.get(row.child_id))
      .filter(Boolean) as RelationCandidate[];
  }

  return (
    <>
      <RelationPicker
        label="연결 카드"
        name="linkedCardSlugs"
        candidates={cardCandidates}
        initialSelected={initialCards}
        characterOptions={characterOptions}
        categoryOptions={makeOptions(
          cardCandidates.map((item) => item.category)
        )}
      />

      <RelationPicker
        label="연결 스토리"
        name="linkedStorySlugs"
        candidates={storyCandidates}
        initialSelected={initialStories}
        subtypeOptions={makeOptions(
          storyCandidates.map((item) => item.subtype)
        )}
        characterOptions={characterOptions}
      />

      <RelationPicker
        label="연결 이벤트"
        name="linkedEventSlugs"
        candidates={eventCandidates}
        initialSelected={initialEvents}
        subtypeOptions={makeOptions(
          eventCandidates.map((item) => item.subtype)
        )}
        characterOptions={characterOptions}
      />

      <RelationPicker
        label="연결 휴대폰"
        name="linkedPhoneItemIds"
        candidates={phoneCandidates}
        initialSelected={initialPhones}
        subtypeOptions={PHONE_SUBTYPE_OPTIONS}
        characterOptions={characterOptions}
        categoryOptions={makeOptions(
          phoneCandidates.map((item) => item.category)
        )}
        serializeBy="id"
      />
    </>
  );
}
`;

  write(file, source);

  console.log("[CREATED] PhoneRelationFields.tsx");
}

/* =========================================================
   4. new / edit 페이지에 관계 UI 연결
========================================================= */

function patchPage(file, edit) {
  let src = read(file);

  const importLine =
    'import PhoneRelationFields from "@/components/admin/phone-items/PhoneRelationFields";';

  if (!src.includes(importLine)) {
    const phoneImport =
      'import PhoneItemForm from "@/components/admin/phone-items/PhoneItemForm";';

    if (!src.includes(phoneImport)) {
      fail(`${file}: PhoneItemForm import를 찾지 못했습니다.`);
    }

    src = src.replace(
      phoneImport,
      phoneImport + "\n" + importLine
    );
  }

  if (!src.includes("relationFields={<PhoneRelationFields")) {
    const formIndex = src.indexOf("<PhoneItemForm");

    if (formIndex < 0) {
      fail(`${file}: PhoneItemForm JSX를 찾지 못했습니다.`);
    }

    const submitIndex = src.indexOf(
      "submitLabel=",
      formIndex
    );

    if (submitIndex < 0) {
      fail(`${file}: submitLabel을 찾지 못했습니다.`);
    }

    const lineEnd = src.indexOf("\n", submitIndex);

    if (lineEnd < 0) {
      fail(`${file}: submitLabel 줄 끝을 찾지 못했습니다.`);
    }

    const relationLine = edit
      ? `        relationFields={
          <PhoneRelationFields phoneItemId={item.id} />
        }
`
      : `        relationFields={<PhoneRelationFields />}
`;

    src =
      src.slice(0, lineEnd + 1) +
      relationLine +
      src.slice(lineEnd + 1);
  }

  write(file, src);
  console.log(`[PATCHED] ${file}`);
}

patchPage(
  "app/admin/phone-items/new/page.tsx",
  false
);

patchPage(
  "app/admin/phone-items/[id]/edit/page.tsx",
  true
);

/* =========================================================
   5. 저장 액션
========================================================= */

{
  const file =
    "lib/admin/phone-items/actions.ts";

  let src = read(file);

  if (!src.includes("async function syncPhoneItemRelationsFromForm")) {
    const anchor =
      "export async function createPhoneItemAction(formData: FormData)";

    const index = src.indexOf(anchor);

    if (index < 0) {
      fail("createPhoneItemAction을 찾지 못했습니다.");
    }

    const helper = `
function parsePhoneRelationLines(
  value: FormDataEntryValue | null
) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/\\r?\\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

async function deletePhoneRelationGroup(params: {
  parentType: string;
  parentId: string;
  childType: string;
  childId?: string;
  relationType: string;
}) {
  let query = supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", params.parentType)
    .eq("parent_id", params.parentId)
    .eq("child_type", params.childType)
    .eq("relation_type", params.relationType);

  if (params.childId) {
    query = query.eq("child_id", params.childId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

async function syncCardPhoneRelations(
  phoneItemId: string,
  slugs: string[]
) {
  const { error: deleteError } = await supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", "card")
    .eq("child_type", "phone_item")
    .eq("child_id", phoneItemId)
    .eq("relation_type", "card_phone");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!slugs.length) return;

  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, slug")
    .in("slug", slugs);

  if (error) {
    throw new Error(error.message);
  }

  const found = cards ?? [];
  const foundSlugs = new Set(
    found.map((item) => item.slug)
  );

  const missing = slugs.filter(
    (slug) => !foundSlugs.has(slug)
  );

  if (missing.length) {
    throw new Error(
      \`card slug를 찾을 수 없습니다:\\n\${missing.join("\\n")}\`
    );
  }

  const orderMap = new Map(
    slugs.map((slug, index) => [slug, index])
  );

  const rows = found.map((card) => ({
    parent_type: "card",
    parent_id: card.id,
    child_type: "phone_item",
    child_id: phoneItemId,
    relation_type: "card_phone",
    sort_order: orderMap.get(card.slug) ?? 0,
  }));

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  slugs.forEach((slug) => {
    revalidatePath(
      \`/cards/\${encodeURIComponent(slug)}\`
    );
  });
}

async function syncPhoneOutgoingBySlugs(params: {
  phoneItemId: string;
  childType: "story" | "event";
  table: "stories" | "events";
  relationType: "phone_story" | "phone_event";
  slugs: string[];
}) {
  const { error: deleteError } = await supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", "phone_item")
    .eq("parent_id", params.phoneItemId)
    .eq("child_type", params.childType)
    .eq("relation_type", params.relationType);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!params.slugs.length) return;

  const { data: children, error } = await supabase
    .from(params.table)
    .select("id, slug")
    .in("slug", params.slugs);

  if (error) {
    throw new Error(error.message);
  }

  const found = children ?? [];
  const foundSlugs = new Set(
    found.map((item) => item.slug)
  );

  const missing = params.slugs.filter(
    (slug) => !foundSlugs.has(slug)
  );

  if (missing.length) {
    throw new Error(
      \`\${params.childType} slug를 찾을 수 없습니다:\\n\${missing.join("\\n")}\`
    );
  }

  const orderMap = new Map(
    params.slugs.map((slug, index) => [
      slug,
      index,
    ])
  );

  const rows = found.map((item) => ({
    parent_type: "phone_item",
    parent_id: params.phoneItemId,
    child_type: params.childType,
    child_id: item.id,
    relation_type: params.relationType,
    sort_order: orderMap.get(item.slug) ?? 0,
  }));

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  params.slugs.forEach((slug) => {
    revalidatePath(
      \`/\${params.table}/\${encodeURIComponent(slug)}\`
    );
  });
}

async function syncPhonePhoneRelations(
  phoneItemId: string,
  ids: string[]
) {
  const { error: deleteError } = await supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", "phone_item")
    .eq("parent_id", phoneItemId)
    .eq("child_type", "phone_item")
    .eq("relation_type", "phone_phone");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const uniqueIds = ids.filter(
    (id) => id && id !== phoneItemId
  );

  if (!uniqueIds.length) return;

  const { data: phoneItems, error } = await supabase
    .from("phone_items")
    .select("id")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const foundIds = new Set(
    (phoneItems ?? []).map((item) => item.id)
  );

  const missing = uniqueIds.filter(
    (id) => !foundIds.has(id)
  );

  if (missing.length) {
    throw new Error(
      \`phone item id를 찾을 수 없습니다:\\n\${missing.join("\\n")}\`
    );
  }

  const rows = uniqueIds.map((id, index) => ({
    parent_type: "phone_item",
    parent_id: phoneItemId,
    child_type: "phone_item",
    child_id: id,
    relation_type: "phone_phone",
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function syncPhoneItemRelationsFromForm(
  phoneItemId: string,
  formData: FormData
) {
  if (formData.has("linkedCardSlugs")) {
    await syncCardPhoneRelations(
      phoneItemId,
      parsePhoneRelationLines(
        formData.get("linkedCardSlugs")
      )
    );
  }

  if (formData.has("linkedStorySlugs")) {
    await syncPhoneOutgoingBySlugs({
      phoneItemId,
      childType: "story",
      table: "stories",
      relationType: "phone_story",
      slugs: parsePhoneRelationLines(
        formData.get("linkedStorySlugs")
      ),
    });
  }

  if (formData.has("linkedEventSlugs")) {
    await syncPhoneOutgoingBySlugs({
      phoneItemId,
      childType: "event",
      table: "events",
      relationType: "phone_event",
      slugs: parsePhoneRelationLines(
        formData.get("linkedEventSlugs")
      ),
    });
  }

  if (formData.has("linkedPhoneItemIds")) {
    await syncPhonePhoneRelations(
      phoneItemId,
      parsePhoneRelationLines(
        formData.get("linkedPhoneItemIds")
      )
    );
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/stories");
  revalidatePath("/admin/events");
  revalidatePath("/admin/phone-items");
  revalidatePath("/cards");
  revalidatePath("/stories");
  revalidatePath("/events");
  revalidatePath("/phone-items");
}

`;

    src =
      src.slice(0, index) +
      helper +
      src.slice(index);

    console.log(
      "[PATCHED] phone relation save helpers"
    );
  }

  /* CREATE */
  const createStart = src.indexOf(
    "export async function createPhoneItemAction"
  );

  const createRevalidate = src.indexOf(
    "revalidatePhoneItemPaths(",
    createStart
  );

  if (createStart < 0 || createRevalidate < 0) {
    fail("create relation sync 위치를 찾지 못했습니다.");
  }

  const createPrefix =
    src.slice(
      Math.max(createStart, createRevalidate - 300),
      createRevalidate
    );

  if (
    !createPrefix.includes(
      "syncPhoneItemRelationsFromForm"
    )
  ) {
    src =
      src.slice(0, createRevalidate) +
      `await syncPhoneItemRelationsFromForm(
      createdItem.id,
      formData
    );

    ` +
      src.slice(createRevalidate);

    console.log("[PATCHED] create relation sync");
  }

  /* UPDATE */
  const updateStart = src.indexOf(
    "export async function updatePhoneItemAction"
  );

  const updateRevalidate = src.indexOf(
    "revalidatePhoneItemPaths(",
    updateStart
  );

  if (updateStart < 0 || updateRevalidate < 0) {
    fail("update relation sync 위치를 찾지 못했습니다.");
  }

  const updatePrefix =
    src.slice(
      Math.max(updateStart, updateRevalidate - 300),
      updateRevalidate
    );

  if (
    !updatePrefix.includes(
      "syncPhoneItemRelationsFromForm"
    )
  ) {
    src =
      src.slice(0, updateRevalidate) +
      `await syncPhoneItemRelationsFromForm(
      phoneItemId,
      formData
    );

    ` +
      src.slice(updateRevalidate);

    console.log("[PATCHED] update relation sync");
  }

  write(file, src);
}

console.log("");
console.log("=== PHONE RELATION PICKER PATCH COMPLETE ===");
console.log("- 카드: card_phone");
console.log("- 스토리: phone_story");
console.log("- 이벤트: phone_event");
console.log("- 휴대폰: phone_phone / ID 기반");
