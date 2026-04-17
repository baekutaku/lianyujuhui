import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { verifyGuestbookPassword } from "@/lib/utils/guestbook-password";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, message: "권한 없음." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const adminReply =
      typeof body.adminReply === "string" ? body.adminReply.trim() : "";

    const { error } = await supabase
      .from("guestbook_entries")
      .update({
        admin_reply: adminReply || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "답글 저장 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const admin = await isAdmin();
    const body = await request.json().catch(() => ({}));
    const password = String(body.password ?? "").trim();

    const { data, error } = await supabase
      .from("guestbook_entries")
      .select("id, password_hash, is_deleted")
      .eq("id", id)
      .single();

    if (error || !data || data.is_deleted) {
      return NextResponse.json(
        { ok: false, message: "글을 찾을 수 없음." },
        { status: 404 }
      );
    }

    if (!admin) {
      if (!password) {
        return NextResponse.json(
          { ok: false, message: "비밀번호를 입력해." },
          { status: 400 }
        );
      }

      const valid = verifyGuestbookPassword(password, data.password_hash);
      if (!valid) {
        return NextResponse.json(
          { ok: false, message: "비밀번호 불일치." },
          { status: 403 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("guestbook_entries")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: updateError.message },
        { status: 500 }
      );
    }

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "삭제 실패" },
      { status: 500 }
    );
  }
}