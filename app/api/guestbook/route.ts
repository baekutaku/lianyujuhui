import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";
import { hashGuestbookPassword } from "@/lib/utils/guestbook-password";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nickname = String(body.nickname ?? "").trim();
    const password = String(body.password ?? "").trim();
    const content = String(body.content ?? "").trim();
    const isPrivate = Boolean(body.isPrivate);
    const homepage = String(body.homepage ?? "").trim(); // honeypot

    if (homepage) {
      return NextResponse.json({ ok: true });
    }

    if (!password || password.length < 4 || password.length > 20) {
      return NextResponse.json(
        { ok: false, message: "비밀번호는 4~20자로 입력." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "내용 입력." },
        { status: 400 }
      );
    }

   if (content.length > 2000) {
  return NextResponse.json(
    { ok: false, message: "내용은 2000자 이하만 가능." },
    { status: 400 }
  );
}

    const { error } = await supabase.from("guestbook_entries").insert({
      nickname: nickname || null,
      password_hash: hashGuestbookPassword(password),
      content,
      is_private: isPrivate,
      is_approved: false,
      is_deleted: false,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/");
    revalidatePath("/guestbook");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "등록 실패" },
      { status: 500 }
    );
  }
}