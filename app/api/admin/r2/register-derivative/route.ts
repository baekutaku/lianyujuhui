import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canonicalImageSource } from "@/lib/media/image-source";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const sourceUrl = canonicalImageSource(
      String(body?.sourceUrl || "")
    );

    const displayUrl = String(
      body?.displayUrl || ""
    ).trim();

    const thumbUrl = String(
      body?.thumbUrl || ""
    ).trim();

    const mirroredOriginalUrl = String(
      body?.mirroredOriginalUrl || sourceUrl
    ).trim();

    if (!/^https?:\/\//i.test(sourceUrl)) {
      return NextResponse.json(
        { error: "sourceUrl이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!displayUrl || !thumbUrl) {
      return NextResponse.json(
        { error: "displayUrl / thumbUrl이 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("image_derivatives")
      .upsert(
        {
          source_url: sourceUrl,
          source_kind: "r2_upload",
          mirrored_original_url: mirroredOriginalUrl,
          display_url: displayUrl,
          thumb_url: thumbUrl,
          status: "ready",
          content_type:
            String(body?.contentType || "").trim() || null,
          width:
            Number.isFinite(Number(body?.width))
              ? Number(body.width)
              : null,
          height:
            Number.isFinite(Number(body?.height))
              ? Number(body.height)
              : null,
          original_bytes:
            Number.isFinite(Number(body?.originalBytes))
              ? Number(body.originalBytes)
              : null,
          display_bytes:
            Number.isFinite(Number(body?.displayBytes))
              ? Number(body.displayBytes)
              : null,
          thumb_bytes:
            Number.isFinite(Number(body?.thumbBytes))
              ? Number(body.thumbBytes)
              : null,
          last_error: null,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_url" }
      );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[register-derivative] fatal:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파생 이미지 등록에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
