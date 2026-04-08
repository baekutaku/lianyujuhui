import { notFound } from "next/navigation";
import SmartEditor from "@/components/editor/SmartEditor";
import { supabase } from "@/lib/supabase/client";
import { updateEventBundle } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

type EditEventPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EditEventPage({
  params,
  searchParams,
}: EditEventPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error ?? "";

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title, slug, subtype, release_year, start_date, end_date, summary, server_id, primary_character_id, thumbnail_url, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (eventError) {
    console.error("[admin/events/[slug]/edit] event fetch error:", eventError);
  }

  if (!event) {
    notFound();
  }

  const { data: translation } = await supabase
    .from("translations")
    .select("id, title, body")
    .eq("parent_type", "event")
    .eq("parent_id", event.id)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, url, media_type, usage_type")
    .eq("parent_type", "event")
    .eq("parent_id", event.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const primaryMedia = media?.[0] ?? null;

  const { data: servers } = await supabase
    .from("servers")
    .select("id, key, name")
    .order("sort_order", { ascending: true });

  const { data: characters } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .order("sort_order", { ascending: true });

  const serverKey =
    servers?.find((server) => server.id === event.server_id)?.key ?? "kr";

  const characterKey =
    characters?.find((character) => character.id === event.primary_character_id)?.key ??
    "baiqi";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Events / Edit</div>
        <h1 className="page-title">이벤트 수정</h1>
        <p className="page-desc">
          이벤트 기본 정보, 번역, 영상, 관련 연결을 수정합니다.
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

      <form action={updateEventBundle} className="form-panel">
        <input type="hidden" name="eventId" value={event.id} />
        <input type="hidden" name="slug" value={event.slug} />
        <input type="hidden" name="translationId" value={translation?.id ?? ""} />
        <input type="hidden" name="mediaId" value={primaryMedia?.id ?? ""} />

        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>title</span>
            <input name="title" defaultValue={event.title} required />
          </label>

          <label className="form-field">
            <span>subtype</span>
            <select name="subtype" defaultValue={event.subtype}>
              <option value="return_event">return_event</option>
              <option value="birthday_baiqi">birthday_baiqi</option>
              <option value="birthday_mc">birthday_mc</option>
              <option value="game_event">game_event</option>
              <option value="anniversary_event">anniversary_event</option>
              <option value="seasonal_event">seasonal_event</option>
            </select>
          </label>

          <label className="form-field">
            <span>release_year</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={event.release_year ?? ""}
              required
            />
          </label>

          <label className="form-field">
            <span>start_date</span>
            <input
              name="startDate"
              type="date"
              defaultValue={event.start_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>end_date</span>
            <input
              name="endDate"
              type="date"
              defaultValue={event.end_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>server</span>
            <select name="serverKey" defaultValue={serverKey}>
              {servers?.map((server) => (
                <option key={server.id} value={server.key}>
                  {server.key}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>character</span>
            <select name="characterKey" defaultValue={characterKey}>
              {characters?.map((character) => (
                <option key={character.id} value={character.key}>
                  {character.key}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>summary</span>
            <textarea name="summary" rows={4} defaultValue={event.summary ?? ""} />
          </label>

          <label className="form-field form-field-full">
            <span>youtube url</span>
            <input
              name="youtubeUrl"
              defaultValue={
                primaryMedia?.media_type === "youtube" ? primaryMedia.url ?? "" : ""
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>thumbnail url</span>
            <input
              name="thumbnailUrl"
              defaultValue={event.thumbnail_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>translation title</span>
            <input
              name="translationTitle"
              defaultValue={translation?.title ?? ""}
            />
          </label>

          <SmartEditor
            name="translationBody"
            label="translation body"
            initialValue={translation?.body ?? ""}
            height="700px"
          />

          <label className="form-field form-field-full">
            <span>is_published</span>
            <select
              name="isPublished"
              defaultValue={event.is_published ? "true" : "false"}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>

        <button type="submit" className="primary-button">
          이벤트 수정 저장
        </button>
      </form>
    </main>
  );
}