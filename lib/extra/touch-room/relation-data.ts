import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import type {
  RelationCandidate,
} from "@/components/admin/relations/RelationPicker";


export type TouchRoomRelationPools = {
  cardCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialIllustrations?:
    RelationCandidate[];

  initialStories?:
    RelationCandidate[];

  initialEvents?:
    RelationCandidate[];
};


export async function loadTouchRoomRelationCandidates():
  Promise<TouchRoomRelationPools> {

  const [
    { data: characters },
    { data: cards },
    { data: illustrations },
    { data: stories },
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
          "id, title, primary_character_id, is_published"
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
    eventCandidates,
  };
}


export async function loadTouchRoomInitialRelations(
  itemId: string,
  pools: TouchRoomRelationPools
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "extra_touch_room_relations"
      )
      .select(
        "target_type, target_id, sort_order"
      )
      .eq(
        "touch_room_id",
        itemId
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

    initialEvents:
      selected(
        "event",
        pools.eventCandidates
      ),
  };
}
