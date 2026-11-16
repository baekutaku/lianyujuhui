import PhoneImageField
  from "@/components/admin/phone-items/PhoneImageField";

﻿import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";


const STORY_SUBTYPE_OPTIONS = [
  { value: "main_story", label: "메인스토리" },
  { value: "behind_story", label: "막후의 장" },
  { value: "card_story", label: "데이트" },
  { value: "side_story", label: "비밀이야기 / 외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈" },
  { value: "company_project", label: "촬영장 / 회사 프로젝트" },
];


type CharacterOption = {
  value: string;
  label: string;
};


type MailItem = {
  id?: string;
  character_key?: string;
  title?: string;
  mail_date?: string;
  original_text?: string;
  translation_text?: string | null;
  occasion?: string | null;
  image_url?: string | null;
  is_published?: boolean;
};


type RelationProps = {
  cardCandidates: RelationCandidate[];
  illustrationCandidates: RelationCandidate[];
  storyCandidates: RelationCandidate[];
  eventCandidates: RelationCandidate[];

  initialCards?: RelationCandidate[];
  initialIllustrations?: RelationCandidate[];
  initialStories?: RelationCandidate[];
  initialEvents?: RelationCandidate[];
};


export default function MailForm({
  action,
  item,
  characterOptions,
  relations,
}: {
  action:
    (
      formData: FormData
    ) =>
      void |
      Promise<void>;

  item?: MailItem;

  characterOptions:
    CharacterOption[];

  relations:
    RelationProps;
}) {
  return (
    <form
      action={action}
      className="extra-mail-form"
    >

      {item?.id ? (
        <input
          type="hidden"
          name="id"
          value={item.id}
        />
      ) : null}


      <section className="form-section">

        <div className="section-heading">

          <h2>
            우편 기본 정보
          </h2>

          <p>
            이미지 없이 제목 · 날짜 ·
            원문만으로도 등록할 수 있습니다.
          </p>

        </div>


        <div className="form-grid">

          <label className="field">

            <span>캐릭터</span>

            <select
              name="characterKey"
              defaultValue={
                item?.character_key ??
                "baiqi"
              }
              required
            >
              {characterOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

          </label>


          <label className="field">

            <span>날짜</span>

            <input
              type="date"
              name="mailDate"
              required
              defaultValue={
                item?.mail_date ??
                ""
              }
            />

          </label>


          <label className="field full">

            <span>제목</span>

            <input
              name="title"
              required
              defaultValue={
                item?.title ??
                ""
              }
            />

          </label>


          <label className="field">

            <span>
              분류 / 기념일
            </span>

            <input
              name="occasion"
              defaultValue={
                item?.occasion ??
                ""
              }
              placeholder="예: 신년, 발렌타인, 생일, 칠석"
            />

          </label>


          <div className="field full">

            <PhoneImageField
              label="우편 이미지"
              name="imageUrl"
              initialUrls={
                item?.image_url
                  ? [
                      item.image_url
                    ]
                  : []
              }
              multiple={false}
              help="이미지를 드래그하거나 파일 선택, URL 직접 입력이 가능합니다."
            />

          </div>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>본문</h2>
        </div>


        <div className="form-grid">

          <label className="field full">

            <span>중문 원문</span>

            <textarea
              name="originalText"
              required
              rows={7}
              defaultValue={
                item?.original_text ??
                ""
              }
            />

          </label>


          <label className="field full">

            <span>
              한국어 번역
            </span>

            <textarea
              name="translationText"
              rows={7}
              defaultValue={
                item?.translation_text ??
                ""
              }
              placeholder="없으면 비워둬도 됩니다."
            />

          </label>

        </div>

      </section>


      <RelationPicker
        label="연결 카드"
        name="linkedCardSlugs"
        candidates={
          relations.cardCandidates
        }
        initialSelected={
          relations.initialCards ??
          []
        }
        characterOptions={
          characterOptions
        }
      />


      <RelationPicker
        label="연결 카드 외 일러스트"
        name="linkedIllustrationIds"
        candidates={
          relations.illustrationCandidates
        }
        initialSelected={
          relations.initialIllustrations ??
          []
        }
        characterOptions={
          characterOptions
        }
        serializeBy="id"
      />


      <RelationPicker
        label="연결 스토리"
        name="linkedStorySlugs"
        candidates={
          relations.storyCandidates
        }
        initialSelected={
          relations.initialStories ??
          []
        }
        characterOptions={
          characterOptions
        }
        subtypeOptions={
          STORY_SUBTYPE_OPTIONS
        }
      />


      <RelationPicker
        label="연결 이벤트"
        name="linkedEventSlugs"
        candidates={
          relations.eventCandidates
        }
        initialSelected={
          relations.initialEvents ??
          []
        }
        characterOptions={
          characterOptions
        }
      />


      <label className="extra-mail-publish">

        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        <span>공개</span>

      </label>


      <div className="extra-mail-form-actions">

        <button
          type="submit"
          className="primary-button"
        >
          {item?.id
            ? "수정 저장"
            : "우편 등록"}
        </button>

      </div>

    </form>
  );
}

