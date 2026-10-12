import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { canonicalImageSource } from "@/lib/media/image-source";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sources = Array.from(
      new Set(
        (Array.isArray(body?.sources) ? body.sources : [])
          .slice(0, 100)
          .map((value: unknown) =>
            canonicalImageSource(String(value || ""))
          )
          .filter(Boolean)
      )
    );

    if (sources.length === 0) {
      return NextResponse.json({ derivatives: {} });
    }

    const { data, error } = await supabase
      .from("image_derivatives")
      .select(
        "source_url, mirrored_original_url, display_url, thumb_url, status"
      )
      .in("source_url", sources);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          derivatives: {},
        },
        { status: 500 }
      );
    }

    const derivatives = Object.fromEntries(
      (data ?? []).map((row) => {
        const source = canonicalImageSource(row.source_url);

        return [
          source,
          {
            source_url: source,
            mirrored_original_url:
              row.mirrored_original_url || null,
            display_url: row.display_url || null,
            thumb_url: row.thumb_url || null,
            status: row.status,
          },
        ];
      })
    );

    return NextResponse.json({ derivatives });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지 파생본 조회에 실패했습니다.",
        derivatives: {},
      },
      { status: 500 }
    );
  }
}
