import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/server";

type CharacterRow = {
  id: string;
  key: string | null;
};

type CardMetaRow = {
  release_year: number | string | null;
  primary_character_id: string | null;
};

export const getCardsFilterCache = unstable_cache(
  async () => {
    const [
      { data: characters, error: charactersError },
      { data: cardMeta, error: cardMetaError },
    ] = await Promise.all([
      supabase
        .from("characters")
        .select("id, key"),
      supabase
        .from("cards")
        .select("release_year, primary_character_id")
        .eq("is_published", true),
    ]);

    if (charactersError) {
      throw new Error(charactersError.message);
    }

    if (cardMetaError) {
      throw new Error(cardMetaError.message);
    }

    return {
      characters: (characters ?? []) as CharacterRow[],
      cardMeta: (cardMeta ?? []) as CardMetaRow[],
    };
  },
  ["cards-filter-options-v1"],
  {
    revalidate: 300,
    tags: ["cards-filter-options"],
  }
);
