import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nickname = String(body.nickname ?? "").trim();
    const content = String(body.content ?? "").trim();
    const isPrivate = Boolean(body.isPrivate);
    const homepage = String(body.homepage ?? "").trim(); // honeypot

    if (homepage) {
      return NextResponse.json({ ok: true });
    }

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "내용을 입력해." },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { ok: false, message: "내용이 너무 김." },
        { status: 400 }
      );
    }

    if (nickname.length > 20) {
      return NextResponse.json(
        { ok: false, message: "닉네임이 너무 김." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("anonymous_messages").insert({
      nickname: nickname || null,
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "등록 실패" },
      { status: 500 }
    );
  }
}