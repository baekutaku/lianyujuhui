import { createCard } from "@/app/admin/actions";
import StoryFormEnhancer from "@/components/admin/stories/StoryFormEnhancer";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const RARITY_OPTIONS = [
  { value: "nh", label: "NH" },
  { value: "n", label: "N" },
  { value: "r", label: "R" },
  { value: "sr", label: "SR" },
  { value: "er", label: "ER" },
  { value: "ser", label: "SER" },
  { value: "ssr", label: "SSR" },
  { value: "sp", label: "SP" },
  { value: "ur", label: "UR" },
] as const;

const ATTRIBUTE_OPTIONS = [
  { value: "execution", label: "추진력" },
  { value: "affinity", label: "친화력" },
  { value: "decision", label: "결단력" },
  { value: "creativity", label: "창의력" },
] as const;

const CARD_CATEGORY_OPTIONS = [
  { value: "date", label: "데이트 카드" },
  { value: "main_story", label: "메인스토리 연계" },
  { value: "side_story", label: "외전 / 서브" },
  { value: "birthday", label: "생일 카드" },
  { value: "charge", label: "누적충전 카드" },
  { value: "free", label: "무료 카드" },
] as const;

const SERVER_OPTIONS = [
  { value: "kr", label: "KR" },
  { value: "cn", label: "CN" },
] as const;

const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
] as const;

export default async function NewCardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Cards</div>
        <h1 className="page-title">카드 등록</h1>
        <p className="page-desc">
          카드 기본 정보, 이미지, 카드 분류, 해시태그를 등록합니다.
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
            <span>카드 제목</span>
            <input name="title" required />
          </label>

          <label className="form-field">
            <span>등급</span>
            <select name="rarity" defaultValue="ssr">
              {RARITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>속성</span>
            <select name="attribute" defaultValue="affinity">
              {ATTRIBUTE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
  <span>카드 분류</span>
  <select name="cardCategory" defaultValue="">
    <option value="">미분류</option>
    {CARD_CATEGORY_OPTIONS.map((item) => (
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
            <select name="serverKey" defaultValue="kr">
              {SERVER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>캐릭터</span>
            <select name="characterKey" defaultValue="baiqi">
              {CHARACTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
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
              placeholder="예: 생일, 무료, 카드스토리, 메인연계"
            />
          </label>

          <label className="form-field form-field-full">
            <span>요약</span>
            <textarea
              name="summary"
              rows={4}
              placeholder="상세페이지에서만 보이게 둘 거면 짧게 적어도 됨"
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 (진화 전)</span>
            <input
              name="thumbnailUrl"
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>썸네일 (진화 후)</span>
            <input
              name="thumbnailAfterUrl"
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 (진화 전)</span>
            <input
              name="coverImageUrl"
              placeholder="https://..."
            />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지 (진화 후)</span>
            <input
              name="coverAfterUrl"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="admin-subpanel">
          <StoryFormEnhancer storageKey="card-draft:new" />
        </div>
      </form>
    </main>
  );
}