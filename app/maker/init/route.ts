import { NextResponse } from "next/server";
import { ensureMakerGuest } from "@/lib/maker/auth";

export async function GET(request: Request) {
  await ensureMakerGuest();

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/maker/me";

  return NextResponse.redirect(new URL(next, url.origin));
}