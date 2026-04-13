import { supabase } from "@/lib/supabase/server";

type MomentRow = {
  content_json?: {
    authorKey?: string;
  } | null;
};

export async function getMomentCountByAuthorKey(authorKey: string) {
  const safeAuthorKey = String(authorKey || "").trim();
  if (!safeAuthorKey) return 0;

  const { data, error } = await supabase
    .from("phone_items")
    .select("content_json")
    .eq("subtype", "moment")
    .eq("is_published", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as MomentRow[] | null) ?? [];

  return rows.filter(
    (row) =>
      String(row.content_json?.authorKey || "other").trim() === safeAuthorKey
  ).length;
}