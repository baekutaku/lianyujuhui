import { supabase } from "@/lib/supabase/server";
import { canonicalImageSource } from "@/lib/media/image-source";

export type ImageDerivativePublic = {
  source_url: string;
  mirrored_original_url: string | null;
  display_url: string | null;
  thumb_url: string | null;
  status: "pending" | "ready" | "failed";
};

export type ImageDerivativeObject =
  Record<string, ImageDerivativePublic>;

export async function getImageDerivativeObject(
  sources: Array<string | null | undefined>
): Promise<ImageDerivativeObject> {
  const cleanSources = Array.from(
    new Set(
      sources
        .map(canonicalImageSource)
        .filter(Boolean)
    )
  );

  if (cleanSources.length === 0) return {};

  const result: ImageDerivativeObject = {};

  /*
    PostgREST URL length stays reasonable for archive pages.
    Chunking also prevents a future large gallery from generating
    an oversized `in(...)` filter.
  */
  for (let index = 0; index < cleanSources.length; index += 80) {
    const chunk = cleanSources.slice(index, index + 80);

    const { data, error } = await supabase
      .from("image_derivatives")
      .select(
        "source_url, mirrored_original_url, display_url, thumb_url, status"
      )
      .in("source_url", chunk);

    /*
      Migration may not have been applied yet during local rollout.
      Fail open to source URLs rather than breaking the archive.
    */
    if (error) {
      console.warn(
        "[image-derivatives] lookup failed:",
        error.message
      );
      return {};
    }

    for (const row of data ?? []) {
      const source = canonicalImageSource(row.source_url);

      if (!source) continue;

      result[source] = {
        source_url: source,
        mirrored_original_url:
          row.mirrored_original_url || null,
        display_url: row.display_url || null,
        thumb_url: row.thumb_url || null,
        status: row.status,
      };
    }
  }

  return result;
}

export function resolveImageDerivativeUrl(
  source: string | null | undefined,
  derivatives: ImageDerivativeObject,
  kind: "thumb" | "display" | "original"
) {
  const clean = canonicalImageSource(source);
  if (!clean) return "";

  const row = derivatives[clean];

  if (!row || row.status !== "ready") {
    return clean;
  }

  if (kind === "thumb") {
    return row.thumb_url || row.display_url || clean;
  }

  if (kind === "display") {
    return row.display_url || row.thumb_url || clean;
  }

  return row.mirrored_original_url || clean;
}
