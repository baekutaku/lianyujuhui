import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { verifyGuestbookPassword } from "@/lib/utils/guestbook-password";
import { isAdmin } from "@/lib/utils/admin-auth";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const admin = await isAdmin();
    const body = await request.json().catch(() => ({}));
    const password = String(body.password ?? "").trim();

    const { data, error } = await supabase
      .from("guestbook_entries")
      .select("id, password_hash, content, admin_reply, is_private, is_deleted")
      .eq("id", id)
      .single();

    if (error || !data || data.is_deleted) {
      return NextResponse.json(
        { ok: false, message: "글을 찾을 수 없음." },
        { status: 404 }
      );
    }

    if (admin || !data.is_private) {
      return NextResponse.json({
        ok: true,
        content: data.content,
        adminReply: data.admin_reply,
      });
    }

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

    return NextResponse.json({
      ok: true,
      content: data.content,
      adminReply: data.admin_reply,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "열람 실패" },
      { status: 500 }
    );
  }
}