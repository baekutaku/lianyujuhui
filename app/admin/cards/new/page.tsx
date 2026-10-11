import { createCard } from "@/app/admin/actions";
import { supabase } from "@/lib/supabase/server";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const RARITY_OPTIONS = [

  { value: "r", label: "R" },
  { value: "sr", label: "SR" },
  { value: "er", label: "ER" },
  { value: "ser", label: "SER" },
  { value: "ssr", label: "SSR" },
  { value: "sp", label: "SP" },
  { value: "ur", label: "UR" },
    { value: "nh", label: "NH" },
  { value: "n", label: "N" },
] as const;

const ATTRIBUTE_OPTIONS = [
  { value: "drive", label: "異붿쭊?? },
  { value: "affinity", label: "移쒗솕?? },
  { value: "judgment", label: "寃곕떒?? },
  { value: "creativity", label: "李쎌쓽?? },
] as const;

const CARD_CATEGORY_OPTIONS = [
  { value: "date", label: "?곗씠???곌퀎" },
  { value: "main_story", label: "硫붿씤?ㅽ넗由??곌퀎" },
  { value: "side_story", label: "鍮꾨??댁빞湲?/ ?몄쟾 ?곌퀎" },
  { value: "birthday", label: "?앹씪" },
  { value: "anniversary", label: "二쇰뀈" },
  { value: "event", label: "?대깽?? },
  { value: "charge", label: "?꾩쟻異⑹쟾 移대뱶" },
  { value: "free", label: "臾대즺 移대뱶" },
] as const;

const SERVER_OPTIONS = [
  { value: "kr", label: "KR" },
  { value: "cn", label: "CN" },
] as const;

const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "諛깃린" },
  { value: "lizeyan", label: "?댄깮?? },
  { value: "zhouqiluo", label: "二쇨린?? },
  { value: "xumo", label: "?덈У" },
  { value: "lingxiao", label: "?곗떆?? },
] as const;

const PHONE_CATEGORY_OPTIONS = [
  { value: "daily", label: "?쇱긽" },
  { value: "companion", label: "?숇컲" },
  { value: "card_story", label: "移대뱶" },
  { value: "main_story", label: "硫붿씤?ㅽ넗由? },
  { value: "tangle", label: "?쏀옒" },
] as const;

export default async function NewCardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  const [
    { data: characters },
    { data: allStories },
    { data: allPhoneItems },
    { data: allEvents },
    { data: allCards },
  ] = await Promise.all([
    supabase.from("characters").select("id, key"),
    supabase
      .from("stories")
      .select("id, slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("phone_items")
      .select("id, slug, title, subtype, content_json")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("events")
      .select("id, slug, title, subtype, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("cards")
      .select("id, slug, title, rarity, primary_character_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);
 const characterMap = new Map(
    (characters ?? []).map((item: any) => [item.id, item.key])
  );

  // ?쒓렇 議고쉶
  const allItemIds = [
    ...(allStories ?? []).map((item: any) => item.id ?? item.slug),
    ...(allPhoneItems ?? []).map((item: any) => item.id ?? item.slug),
    ...(allEvents ?? []).map((item: any) => item.id ?? item.slug),
    ...(allCards ?? []).map((item: any) => item.id ?? item.slug),
  ].filter(Boolean);

  let itemTagsMap = new Map<string, string[]>();

  if (allItemIds.length > 0) {
 

    const allIds = Array.from(new Set([
      ...(allStories ?? []).map((item: any) => item.id).filter(Boolean),
      ...(allPhoneItems ?? []).map((item: any) => item.id).filter(Boolean),
      ...(allEvents ?? []).map((item: any) => item.id).filter(Boolean),
      ...(allCards ?? []).map((item: any) => item.id).filter(Boolean),
    ]));

    if (allIds.length > 0) {
     const CHUNK_SIZE = 100;
      const itemTagRows: any[] = [];
      for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
        const { data } = await supabase
          .from("item_tags")
          .select("item_id, tag_id, sort_order")
          .in("item_id", allIds.slice(i, i + CHUNK_SIZE))
          .order("sort_order", { ascending: true });
        if (data) itemTagRows.push(...data);
      }

      const tagIds = Array.from(new Set((itemTagRows ?? []).map((row: any) => row.tag_id)));

      if (tagIds.length > 0) {
        const { data: tagRows } = await supabase
          .from("tags")
          .select("id, label, name, slug")
          .in("id", tagIds);

        const tagLabelMap = new Map(
          (tagRows ?? []).map((row: any) => [row.id, row.label ?? row.name ?? row.slug])
        );

        itemTagsMap = (itemTagRows ?? []).reduce((map: Map<string, string[]>, row: any) => {
          const label = tagLabelMap.get(row.tag_id);
          if (!label) return map;
          const prev = map.get(row.item_id) ?? [];
          prev.push(label);
          map.set(row.item_id, prev);
          return map;
        }, new Map<string, string[]>());
      }
    }
  }

 const storyCandidates: RelationCandidate[] =
    (allStories ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const phoneCandidates: RelationCandidate[] =
    (allPhoneItems ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: item.content_json?.characterKey ?? null,
      category: item.content_json?.historyCategory ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const eventCandidates: RelationCandidate[] =
    (allEvents ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.subtype,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];

  const cardCandidates: RelationCandidate[] =
    (allCards ?? []).map((item: any) => ({
      slug: item.slug,
      title: item.title,
      subtype: item.rarity,
      characterKey: characterMap.get(item.primary_character_id) ?? null,
      tags: itemTagsMap.get(item.id) ?? [],
    })) ?? [];
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">移대뱶 ?깅줉</h1>
        <p className="page-desc">
          移대뱶 湲곕낯 ?뺣낫, ?대?吏, 移대뱶 遺꾨쪟, ?댁떆?쒓렇, ?곌껐 肄섑뀗痢좊? ?깅줉?⑸땲??
        </p>
      </header>

      {error ? (
        <p
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#3a1f1f",
            color: "#ffb4b4",
            border: "1px solid #6b2d2d",
            whiteSpace: "pre-wrap",
          }}
        >
          {safeDecode(error)}
        </p>
      ) : null}

      <form action={createCard} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>移대뱶 ?쒕ぉ</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>?깃툒</span>
            <select name="rarity" defaultValue="ssr">
              {RARITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>?띿꽦</span>
            <select name="attribute" defaultValue="affinity">
              {ATTRIBUTE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>移대뱶 遺꾨쪟</span>
            <select name="cardCategory" defaultValue="">
              <option value="">誘몃텇瑜?(?곌껐 ?ㅽ넗由??놁쓬)</option>
              {CARD_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>?곕룄</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={2025}
              required
            />
          </label>

          <label className="form-field">
            <span>異쒖떆??/span>
            <input name="releaseDate" type="date" />
          </label>

          <label className="form-field">
            <span>?쒕쾭</span>
            <select name="serverKey" defaultValue="cn">
              {SERVER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>罹먮┃??/span>
            <select name="characterKey" defaultValue="baiqi">
              {CHARACTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>?댁떆?쒓렇</span>
            <input
              name="tagLabels"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="?? ?앹씪, 臾대즺, 移대뱶?ㅽ넗由? 硫붿씤?곌퀎"
            />
          </label>

          <label className="form-field form-field-full">
            <span>?붿빟</span>
            <textarea
              name="summary"
              rows={4}
              placeholder="?곸꽭?섏씠吏?먯꽌留?蹂댁씠寃???嫄곕㈃ 吏㏐쾶 ?곸뼱????
            />
          </label>

          <label className="form-field form-field-full">
            <span>?몃꽕??(吏꾪솕 ??</span>
            <input name="thumbnailUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>?몃꽕??(吏꾪솕 ??</span>
            <input name="thumbnailAfterUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>而ㅻ쾭 ?대?吏 (吏꾪솕 ??</span>
            <input name="coverImageUrl" placeholder="https://..." />
          </label>

          <label className="form-field form-field-full">
            <span>而ㅻ쾭 ?대?吏 (吏꾪솕 ??</span>
            <input name="coverAfterUrl" placeholder="https://..." />
          </label>
        </div>

        <RelationPicker
          label="?곌껐 ?ㅽ넗由?
          name="linkedStorySlugs"
          candidates={storyCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[
            { value: "card_story", label: "?곗씠?? },
            { value: "asmr", label: "?덉쓽 怨곸뿉" },
            { value: "side_story", label: "?몄쟾" },
            { value: "main_story", label: "硫붿씤?ㅽ넗由? },
            { value: "behind_story", label: "留됲썑???? },
            { value: "xiyue_story", label: "?쒖썡援? },
            { value: "myhome_story", label: "留덉씠???ㅽ넗由? },
            { value: "company_project", label: "?뚯궗 ?꾨줈?앺듃" },
          ]}
        />

        <RelationPicker
          label="?곌껐 ?대???
          name="linkedPhoneItemSlugs"
          candidates={phoneCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          categoryOptions={[...PHONE_CATEGORY_OPTIONS]}
          subtypeOptions={[
            { value: "message", label: "硫붿떆吏" },
            { value: "moment", label: "紐⑤찘?? },
            { value: "call", label: "?꾪솕" },
            { value: "video_call", label: "?곸긽?듯솕" },
            { value: "article", label: "湲곗궗" },
          ]}
        />

        <RelationPicker
          label="?곌껐 ?대깽??
          name="linkedEventSlugs"
          candidates={eventCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
        />

        <RelationPicker
          label="?곌껐 移대뱶"
          name="linkedCardSlugs"
          candidates={cardCandidates}
          characterOptions={[...CHARACTER_OPTIONS]}
          subtypeOptions={[
            { value: "r", label: "R" },
            { value: "sr", label: "SR" },
            { value: "er", label: "ER" },
            { value: "ser", label: "SER" },
            { value: "ssr", label: "SSR" },
            { value: "sp", label: "SP" },
            { value: "ur", label: "UR" },
            { value: "nh", label: "NH" },
            { value: "n", label: "N" },
          ]}
        />

        <div className="admin-subpanel">
          <StoryFormEnhancer storageKey="card-draft:new" />
        </div>
      </form>
    </main>
  );
}
