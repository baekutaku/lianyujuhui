"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD가 설정되지 않았습니다.");
  }

  if (password !== adminPassword) {
    throw new Error("비밀번호가 올바르지 않습니다.");
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "ok", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  redirect("/admin/login");
}