import Link from "next/link";
import { notFound } from "next/navigation";
import SmartEditor from "@/components/editor/SmartEditor";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import { supabase } from "@/lib/supabase/client";
import { updateEventBundle, deleteEventBundle } from "@/app/admin/actions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const EVENT_SUBTYPE_OPTIONS = [
  { value: "birthday_baiqi", label: "캐릭터 생일" },
  { value: "birthday_mc", label: "유저 생일" },
  { value: "anniversary_event", label: "N주년" },
  { value: "game_event", label: "명절 / 기념일" },
  { value: "seasonal_event", label: "시즌 이벤트" },
  { value: "game_event", label: "콜라보" },
  { value: "return_event", label: "복귀 이벤트" },
] as const;

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
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error ?? "";

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title, slug, subtype, release_year, start_date, end_date, summary, server_id, primary_character_id, thumbnail_url, is_published, visibility, access_hint"
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

  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("tag_id, sort_order")
    .eq("item_type", "event")
    .eq("item_id", event.id)
    .order("sort_order", { ascending: true });

  const tagIds = Array.from(new Set((itemTagRows ?? []).map((row) => row.tag_id)));

  let defaultTagText = "";

  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, label, name, slug")
      .in("id", tagIds);

    const tagNameMap = new Map(
      (tagRows ?? []).map((row) => [row.id, row.label ?? row.name ?? row.slug])
    );

    defaultTagText = (itemTagRows ?? [])
      .map((row) => tagNameMap.get(row.tag_id))
      .filter(Boolean)
      .join(", ");
  }

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
            <span>제목</span>
            <input name="title" defaultValue={event.title} required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue={event.subtype ?? "seasonal_event"}>
              {EVENT_SUBTYPE_OPTIONS.map((item) => (
                <option
                  key={`${item.value}-${item.label}`}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>연도</span>
            <input
              name="releaseYear"
              type="number"
              defaultValue={event.release_year ?? ""}
              required
            />
          </label>

          <label className="form-field">
            <span>시작일</span>
            <input
              name="startDate"
              type="date"
              defaultValue={event.start_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>종료일</span>
            <input
              name="endDate"
              type="date"
              defaultValue={event.end_date ?? ""}
            />
          </label>

          <label className="form-field">
            <span>서버</span>
            <select name="serverKey" defaultValue={serverKey}>
              {servers?.map((server) => (
                <option key={server.id} value={server.key}>
                  {server.key}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>캐릭터</span>
            <select name="characterKey" defaultValue={characterKey}>
              {characters?.map((character) => (
                <option key={character.id} value={character.key}>
                  {character.key}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
            <textarea name="summary" rows={4} defaultValue={event.summary ?? ""} />
          </label>

          <label className="form-field form-field-full">
            <span>해시태그</span>
            <input
              name="tagLabels"
              defaultValue={defaultTagText}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="예: 생일, 한정, 복각"
            />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 URL</span>
            <input
              name="youtubeUrl"
              defaultValue={
                primaryMedia?.media_type === "youtube" ? primaryMedia.url ?? "" : ""
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 URL</span>
            <input
              name="thumbnailUrl"
              defaultValue={event.thumbnail_url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>번역 제목</span>
            <input
              name="translationTitle"
              defaultValue={translation?.title ?? ""}
            />
          </label>

          <SmartEditor
            name="translationBody"
            label="번역 본문"
            initialValue={translation?.body ?? ""}
            height="700px"
          />

          <label className="form-field form-field-full">
            <span>게시 여부</span>
            <select
              name="isPublished"
              defaultValue={event.is_published ? "true" : "false"}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>

        <StoryVisibilityFields
          values={{
            visibility: event.visibility ?? "public",
            access_hint: event.access_hint ?? "",
          }}
        />

        <button type="submit" className="primary-button">
          이벤트 수정 저장
        </button>
      </form>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "18px",
        }}
      >
        <Link href={`/events/${event.slug}`} className="nav-link">
          공개 보기
        </Link>

        <Link href="/admin/events" className="nav-link">
          목록으로
        </Link>

        <form action={deleteEventBundle}>
          <input type="hidden" name="eventId" value={event.id} />
          <button
            type="submit"
            className="nav-link"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </form>
      </div>
    </main>
  );
}