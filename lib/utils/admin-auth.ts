import { cookies } from "next/headers";

export async function isAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth")?.value;
  return adminAuth === "ok";
}
