import { cookies } from "next/headers";

export async function getPhoneAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("phone_admin")?.value === "1";
}