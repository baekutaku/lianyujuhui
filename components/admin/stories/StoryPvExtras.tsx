import { supabase } from "@/lib/supabase/server";
import PhoneImageField from "@/components/admin/phone-items/PhoneImageField";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

type Props = {
  storyId?: string;
};

export default async function StoryPvExtras({
  storyId,
}: Props) {
  const [
    { data: illustrations },
    { data: characters },
  ] = await Promise.all([
    supabase
      .from("illustrations")
      .select(
        "id, title, image_url, release_year, release_date, primary_character_id, is_published"
      )
      .eq("is_published", true)
      .order("release_year", { ascending: false })
      .order("release_date", { ascending: false }),

    supabase
      .from("characters")
      .select("id, key, name_ko")
      .order("sort_order", { ascending: true }),
  ]);

  let galleryUrls: string[] = [];
  let linkedIllustrationIds: string[] = [];

  if (storyId) {
    const [
      { data: galleryRows },
      { data: relationRows },
    ] = await Promise.all([
      supabase
        .from("media_assets")
        .select("id, url, sort_order")
        .eq("parent_type", "story")
        .eq("parent_id", storyId)
        .eq("media_type", "image")
        .eq("usage_type", "story_gallery")
        .order("sort_order", { ascending: true }),

      supabase
        .from("item_relations")
        .select("child_id, sort_order")
        .eq("parent_type", "story")
        .eq("parent_id", storyId)
        .eq("child_type", "illustration")
        .eq("relation_type", "story_illustration")
        .order("sort_order", { ascending: true }),
    ]);

    galleryUrls = (galleryRows ?? [])
      .map((item: any) => String(item.url || "").trim())
      .filter(Boolean);

    linkedIllustrationIds = (relationRows ?? [])
      .map((item: any) => String(item.child_id || "").trim())
      .filter(Boolean);
  }

  const characterKeyMap = new Map(
    (characters ?? []).map((item: any) => [
      item.id,
      item.key,
    ])
  );

  const illustrationCandidates: RelationCandidate[] =
    (illustrations ?? []).map((item: any) => ({
      id: item.id,
      slug: item.id,
      title: item.title || "제목 없음",
      characterKey:
        characterKeyMap.get(
          item.primary_character_id
        ) ?? null,
    }));

  const candidateMap = new Map(
    illustrationCandidates.map((item) => [
      item.id ?? item.slug,
      item,
    ])
  );

  const initialIllustrations =
    linkedIllustrationIds
      .map((id) => candidateMap.get(id))
      .filter(
        (
          item
        ): item is RelationCandidate =>
          Boolean(item)
      );

  const characterOptions =
    (characters ?? []).map((item: any) => ({
      value: item.key,
      label: item.name_ko,
    }));

  return (
    <>
      <div className="detail-panel story-pv-admin-panel">
        <h2 className="detail-section-title">
          PV / 공식 이미지
        </h2>

        <p
          style={{
            margin: "0 0 14px",
            color: "var(--text-sub)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          PV 스틸컷, 티저, 키비주얼,
          이벤트 배너 등을 여러 장
          등록할 수 있습니다.
        </p>

        <PhoneImageField
          label="추가 이미지"
          name="storyGalleryImageUrls"
          initialUrls={galleryUrls}
          multiple
          help="드래그앤드롭 / 파일 선택 / URL 직접 입력 · 여러 장 가능"
        />
      </div>

      <RelationPicker
        label="연결 일러스트"
        name="linkedIllustrationIds"
        candidates={illustrationCandidates}
        initialSelected={initialIllustrations}
        characterOptions={characterOptions}
        serializeBy="id"
      />
    </>
  );
}
