import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";

import TouchRoomThumbnailField
  from "@/components/extra/touch-room/TouchRoomThumbnailField";


const OCCASION_PRESETS = [
  "일상",
  "신년",
  "설날",
  "원소절",
  "발렌타인",
  "화이트데이",
  "어린이날",
  "단오",
  "칠석",
  "중추절",
  "할로윈",
  "크리스마스",
  "생일",
  "기념일",
  "이벤트",
];


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


type TouchRoomItem = {
  id?: string;

  character_key?: string;

  title?: string;
  slug?: string;

  release_date?:
    string | null;

  occasion?:
    string | null;

  video_url?:
    string | null;

  thumbnail_url?:
    string | null;

  original_text?:
    string | null;

  translation_text?:
    string | null;

  is_published?:
    boolean;
};


type RelationProps = {
  cardCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialIllustrations?:
    RelationCandidate[];

  initialStories?:
    RelationCandidate[];

  initialEvents?:
    RelationCandidate[];
};


export default function TouchRoomForm({
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

  item?: TouchRoomItem;

  characterOptions:
    CharacterOption[];

  relations:
    RelationProps;
}) {
  return (
    <form
      action={action}
      className="touch-room-form"
    >

      {item?.id ? (
        <>
          <input
            type="hidden"
            name="id"
            value={item.id}
          />

          <input
            type="hidden"
            name="oldSlug"
            value={
              item.slug ?? ""
            }
          />
        </>
      ) : null}


      <section className="form-section">

        <div className="section-heading">
          <h2>
            터치룸 음성 기본 정보
          </h2>
        </div>


        <div className="form-grid">

          <label className="field">

            <span>
              캐릭터
            </span>

            <select
              name="characterKey"
              required
              defaultValue={
                item?.character_key ??
                "baiqi"
              }
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

            <span>
              출시일
            </span>

            <input
              type="date"
              name="releaseDate"
              defaultValue={
                item?.release_date ??
                ""
              }
            />

          </label>


          <label className="field full">

            <span>
              제목
            </span>

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
              슬러그
            </span>

            <input
              name="slug"
              defaultValue={
                item?.slug ??
                ""
              }
              placeholder="비우면 제목으로 자동 생성"
            />

          </label>


          <label className="field">

            <span>
              기념일 / 분류
            </span>

            <input
              name="occasion"
              list="touch-room-occasion-list"
              defaultValue={
                item?.occasion ??
                ""
              }
              placeholder="예: 할로윈"
            />

            <datalist
              id="touch-room-occasion-list"
            >
              {OCCASION_PRESETS.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  />
                )
              )}
            </datalist>

          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">

          <h2>
            YouTube Shorts
          </h2>

          <p>
            한 터치룸 음성당 영상 하나를 등록합니다.
          </p>

        </div>


        <label className="field full">

          <span>
            영상 URL
          </span>

          <input
            type="url"
            name="videoUrl"
            required
            defaultValue={
              item?.video_url ??
              ""
            }
            placeholder="https://youtube.com/shorts/..."
          />

        </label>


        <div className="touch-room-thumbnail-admin">

          <span className="touch-room-field-label">
            목록 썸네일
          </span>

          <TouchRoomThumbnailField
            initialUrl={
              item?.thumbnail_url ??
              ""
            }
          />

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>
            대사
          </h2>
        </div>


        <div className="form-grid">

          <label className="field full">

            <span>
              중국어 원문
            </span>

            <textarea
              name="originalText"
              rows={8}
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
              rows={8}
              defaultValue={
                item?.translation_text ??
                ""
              }
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


      <label className="touch-room-publish">

        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        <span>
          공개
        </span>

      </label>


      <div className="touch-room-form-actions">

        <button
          type="submit"
          className="primary-button"
        >
          {item?.id
            ? "수정 저장"
            : "터치룸 음성 등록"}
        </button>

      </div>

    </form>
  );
}
