import { supabaseAdmin } from "@/lib/supabase/admin";

import type {
  RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

export type PvRelationPools = {
  cardCandidates: RelationCandidate[];
  storyCandidates: RelationCandidate[];
  phoneCandidates: RelationCandidate[];
  eventCandidates: RelationCandidate[];
  illustrationCandidates: RelationCandidate[];

  initialCards?: RelationCandidate[];
  initialStories?: RelationCandidate[];
  initialPhoneItems?: RelationCandidate[];
  initialEvents?: RelationCandidate[];
  initialIllustrations?: RelationCandidate[];
};

export async function loadPvRelationCandidates():
  Promise<PvRelationPools> {

  const [
    { data: characters },
    { data: cards },
    { data: stories },
    { data: phoneItems },
    { data: events },
    { data: illustrations },
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

      supabaseAdmin
        .from("illustrations")
        .select(
          "id, title, image_url, release_year, release_date, primary_character_id, is_published"
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


  const illustrationCandidates:
    RelationCandidate[] =
      (illustrations ?? []).map(
        (item: any) => ({
          id: item.id,

          /* RelationPicker 검색용.
             실제 저장은 serializeBy=id */
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

  return {
    cardCandidates,
    storyCandidates,
    phoneCandidates,
    eventCandidates,
    illustrationCandidates,
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

    initialIllustrations:
      selected(
        "illustration",
        pools.illustrationCandidates
      ),
  };
}
