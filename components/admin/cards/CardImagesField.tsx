import CardMultiImageInput from "@/components/admin/media/CardMultiImageInput";
import { getAdminSupabase } from "@/lib/supabase/admin";

type CardImagesFieldProps = {
  cardId?: string;
  beforeThumb?: string | null;
  afterThumb?: string | null;
  beforeCover?: string | null;
  afterCover?: string | null;
};

export default async function CardImagesField({
  cardId,
  beforeThumb,
  afterThumb,
  beforeCover,
  afterCover,
}: CardImagesFieldProps) {
  let rows: any[] = [];

  if (cardId) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("card_images")
      .select(
        "url, sort_order, is_detail_before, is_detail_after, is_list_default, is_list_hover"
      )
      .eq("card_id", cardId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    rows = data ?? [];
  }

  const fallbackUrls = [
    beforeCover,
    afterCover,
    beforeThumb,
    afterThumb,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const initialImages = Array.from(
    new Set([
      ...rows.map((row) => String(row.url || "").trim()).filter(Boolean),
      ...fallbackUrls,
    ])
  ).map((url) => ({ url }));

  const findRole = (key: string) =>
    rows.find((row) => Boolean(row[key]))?.url || null;

  return (
    <CardMultiImageInput
      initialImages={initialImages}
      initialRoles={{
        detailBefore: findRole("is_detail_before") || beforeCover || beforeThumb,
        detailAfter: findRole("is_detail_after") || afterCover || afterThumb,
        listDefault: findRole("is_list_default") || beforeThumb || beforeCover,
        listHover: findRole("is_list_hover") || afterThumb || afterCover,
      }}
    />
  );
}
