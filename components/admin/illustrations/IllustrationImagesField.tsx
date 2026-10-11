import MultiR2ImageInput from "@/components/admin/media/MultiR2ImageInput";
import { getAdminSupabase } from "@/lib/supabase/admin";

type IllustrationImagesFieldProps = {
  illustrationId?: string;
  primaryUrl?: string | null;
};

export default async function IllustrationImagesField({
  illustrationId,
  primaryUrl,
}: IllustrationImagesFieldProps) {
  let initialImages: { url: string }[] = [];

  if (illustrationId) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("illustration_images")
      .select("url, sort_order, is_primary")
      .eq("illustration_id", illustrationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    initialImages = (data ?? []).map((row: any) => ({ url: row.url }));
  }

  const fallbackPrimary = String(primaryUrl || "").trim();

  if (
    fallbackPrimary &&
    !initialImages.some((item) => item.url === fallbackPrimary)
  ) {
    initialImages = [{ url: fallbackPrimary }, ...initialImages];
  }

  return (
    <MultiR2ImageInput
      scope="illustrations"
      initialImages={initialImages}
      initialPrimaryUrl={fallbackPrimary}
    />
  );
}
