import { createStoryBundle } from "@/app/admin/actions";
import { supabase } from "@/lib/supabase/server";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";
import StoryMainMetaFields from "@/components/admin/stories/StoryMainMetaFields";
import StoryVisibilityFields from "@/components/admin/stories/StoryVisibilityFields";
import StoryTranslationFields from "@/components/admin/stories/StoryTranslationFields";

const STORY_SUBTYPE_OPTIONS = [
  { value: "card_story", label: "데이트" },
  { value: "main_story", label: "메인스토리" },
  { value: "side_story", label: "외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "behind_story", label: "막후의 장" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈 스토리" },
  { value: "company_project", label: "회사 프로젝트" },
] as const;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  const { data: characters } = await supabase
    .from("characters")
    .select("id, key, name_ko")
    .order("sort_order", { ascending: true });

  const characterRows = characters ?? [];

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Stories</div>
        <h1 className="page-title">스토리 통합 등록</h1>
        <p className="page-desc">
          스토리 기본 정보, 메인 정렬 메타, 공개 범위, 번역, 영상, 카드 연결을 한 화면에서 등록합니다.
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

      <form action={createStoryBundle} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>카테고리</span>
            <select name="subtype" defaultValue="card_story">
              {STORY_SUBTYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
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
              defaultValue={2025}
              required
            />
          </label>

          <label className="form-field">
            <span>출시일</span>
            <input name="releaseDate" type="date" />
          </label>

          <label className="form-field">
            <span>서버</span>
            <select name="serverKey" defaultValue="cn">
              <option value="cn">중국</option>
              <option value="kr">한국</option>
            </select>
          </label>

          <label className="form-field">
            <span>대표 캐릭터</span>
            <select name="characterKey" defaultValue="baiqi">
              <option value="baiqi">백기</option>
              <option value="lizeyan">이택언</option>
              <option value="zhouqiluo">주기락</option>
              <option value="lingxiao">연시호</option>
              <option value="xumo">허묵</option>
            </select>
          </label>

<label className="form-field form-field-full">
  <span>해시태그</span>
  <input
  name="tagLabels"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  placeholder="예: 러브레터, 워시환니, 키스"
/>
</label>
          <label className="form-field form-field-full">
            <span>CN 유튜브 링크</span>
            <input
              name="youtubeUrlCn"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>KR 유튜브 링크</span>
            <input
              name="youtubeUrlKr"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 URL</span>
            <input name="coverImageUrl" placeholder="https://..." />
          </label>

          <StoryTranslationFields />

          <label className="form-field form-field-full">
            <span>연결 카드 slug (선택)</span>
            <input
              name="cardSlug"
              placeholder="예: baiqi-ssr-some-card"
            />
          </label>
        </div>

        <StoryVisibilityFields
          values={{
            visibility: "public",
            access_hint: "",
          }}
        />

        <StoryMainMetaFields
          characters={characterRows}
          values={{
            manual_sort_order: 0,
            appearing_character_ids: [],
          }}
        />

        <StoryFormEnhancer storageKey="story-draft:new" />
      </form>
    </main>
  );
}