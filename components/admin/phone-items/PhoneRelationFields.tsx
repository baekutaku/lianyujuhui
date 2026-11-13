import { supabase } from "@/lib/supabase/server";
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
