type CharacterOption = {
  id: string;
  key: string;
  name_ko: string;
};

type StoryMainMetaValue = {
  part_no?: number | null;
  volume_no?: number | null;
  main_season?: number | null;
  chapter_no?: number | null;
  main_kind?: string | null;
  route_scope?: string | null;
  primary_character_id?: string | null;
  manual_sort_order?: number | null;
  arc_title?: string | null;
  episode_title?: string | null;
  appearing_character_ids?: string[];
};

type Props = {
  characters: CharacterOption[];
  values?: StoryMainMetaValue;
};

export default function StoryMainMetaFields({
  characters,
  values = {},
}: Props) {
  const appearingIds = new Set(values.appearing_character_ids ?? []);

  return (
    <section className="admin-form-section">
      <div className="admin-form-section-head">
        <h3>메인스토리 세부 정보</h3>
        <p>메인스토리 / 막후의 장 / 외전이면 입력, 아니면 비워두기</p>
      </div>

      <div className="admin-form-grid two-column">
        <label className="admin-form-field">
          <span>부</span>
          <select name="part_no" defaultValue={values.part_no ? String(values.part_no) : ""}>
            <option value="">선택 안 함</option>
            <option value="1">1부</option>
            <option value="2">2부</option>
          </select>
        </label>

        <label className="admin-form-field">
          <span>vol</span>
          <input
            type="number"
            name="volume_no"
            defaultValue={values.volume_no ?? ""}
            placeholder="예: 4"
          />
        </label>

        <label className="admin-form-field">
          <span>시즌</span>
          <input
            type="number"
            name="main_season"
            defaultValue={values.main_season ?? ""}
            placeholder="예: 13"
          />
        </label>

        <label className="admin-form-field">
          <span>장</span>
          <input
            type="number"
            name="chapter_no"
            defaultValue={values.chapter_no ?? ""}
            placeholder="예: 37"
          />
        </label>

        <label className="admin-form-field">
          <span>메인스토리 성격</span>
          <select name="main_kind" defaultValue={values.main_kind ?? ""}>
            <option value="">선택 안 함</option>
            <option value="core">본편</option>
            <option value="preview">예비 / 프리뷰</option>
            <option value="branch">분기 / 루트</option>
            <option value="supplement">보충 / 연결</option>
          </select>
        </label>

        <label className="admin-form-field">
          <span>등장 범위</span>
          <select name="route_scope" defaultValue={values.route_scope ?? ""}>
            <option value="">선택 안 함</option>
            <option value="all_cast">전체 등장</option>
            <option value="route_focus">루트 중심</option>
            <option value="multi_character">복수 등장</option>
          </select>
        </label>

        <label className="admin-form-field">
          <span>중심 캐릭터</span>
          <select
            name="primary_character_id"
            defaultValue={values.primary_character_id ?? ""}
          >
            <option value="">없음 / 전체</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name_ko}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form-field">
          <span>정렬 보정값</span>
          <input
            type="number"
            name="manual_sort_order"
            defaultValue={values.manual_sort_order ?? 0}
            placeholder="기본 0"
          />
        </label>

        <label className="admin-form-field">
          <span>아크명</span>
          <input
            type="text"
            name="arc_title"
            defaultValue={values.arc_title ?? ""}
            placeholder="예: 암전"
          />
        </label>

        <label className="admin-form-field">
          <span>에피소드명</span>
          <input
            type="text"
            name="episode_title"
            defaultValue={values.episode_title ?? ""}
            placeholder="예: 반복되는 덫으로"
          />
        </label>
      </div>

      <div className="admin-form-subsection">
        <div className="admin-form-subsection-head">
          <h4>등장 캐릭터</h4>
          <p>복수 선택 가능, 실제 등장 인물 전부 체크</p>
        </div>

        <div className="admin-checkbox-grid">
          {characters.map((character) => (
            <label key={character.id} className="admin-checkbox-chip">
              <input
                type="checkbox"
                name="appearing_character_ids"
                value={character.id}
                defaultChecked={appearingIds.has(character.id)}
              />
              <span>{character.name_ko}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}